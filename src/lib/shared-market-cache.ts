type RedisScalar = string | number
type RedisCommand = [string, ...RedisScalar[]]

type SharedCacheBackend =
  | {
      enabled: false
      kind: "none"
    }
  | {
      enabled: true
      kind: "upstash-rest"
      baseUrl: string
      token: string
    }

type SharedStaleEntry<T> = {
  value: T
  updatedAt: number
  source: string
}

const ONE_WEEK_SECONDS = 7 * 24 * 60 * 60

function normalizeBaseUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url
}

function resolveSharedCacheBackend(): SharedCacheBackend {
  const baseUrl = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN

  if (!baseUrl || !token) {
    return { enabled: false, kind: "none" }
  }

  return {
    enabled: true,
    kind: "upstash-rest",
    baseUrl: normalizeBaseUrl(baseUrl),
    token,
  }
}

const sharedCacheBackend = resolveSharedCacheBackend()

async function runRedisCommand<T>(command: RedisCommand): Promise<T | null> {
  if (!sharedCacheBackend.enabled) return null

  const response = await fetch(sharedCacheBackend.baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sharedCacheBackend.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Shared market cache HTTP ${response.status}`)
  }

  const payload = await response.json() as { result?: T; error?: string | null }
  if (payload.error) {
    throw new Error(`Shared market cache error: ${payload.error}`)
  }

  return (payload.result ?? null) as T | null
}

async function runRedisPipeline(commands: RedisCommand[]): Promise<Array<{ result?: unknown; error?: string | null }>> {
  if (!sharedCacheBackend.enabled || commands.length === 0) return []

  const response = await fetch(`${sharedCacheBackend.baseUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${sharedCacheBackend.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Shared market cache pipeline HTTP ${response.status}`)
  }

  const payload = await response.json() as Array<{ result?: unknown; error?: string | null }>
  const firstError = payload.find((entry) => entry?.error)
  if (firstError?.error) {
    throw new Error(`Shared market cache pipeline error: ${firstError.error}`)
  }
  return payload
}

function namespacedKey(key: string) {
  return `axiom:market:${key}`
}

export function getSharedMarketCacheBackendName() {
  return sharedCacheBackend.kind
}

export function isSharedMarketCacheConfigured() {
  return sharedCacheBackend.enabled
}

export async function readSharedStale<T>(key: string, maxAgeMs: number): Promise<SharedStaleEntry<T> | null> {
  if (!sharedCacheBackend.enabled) return null

  try {
    const raw = await runRedisCommand<string>(["GET", namespacedKey(`stale:${key}`)])
    if (!raw) return null

    const parsed = JSON.parse(raw) as SharedStaleEntry<T>
    if (!parsed || typeof parsed.updatedAt !== "number") return null
    if (Date.now() - parsed.updatedAt > maxAgeMs) return null

    return parsed
  } catch (error) {
    console.warn("[market/shared-cache] stale read failed", {
      key,
      reason: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function writeSharedStale<T>(
  key: string,
  value: T,
  ttlSeconds: number,
  source: string
): Promise<void> {
  if (!sharedCacheBackend.enabled) return

  try {
    const payload: SharedStaleEntry<T> = {
      value,
      updatedAt: Date.now(),
      source,
    }

    await runRedisCommand([
      "SET",
      namespacedKey(`stale:${key}`),
      JSON.stringify(payload),
      "EX",
      Math.max(1, Math.floor(ttlSeconds)),
    ])
  } catch (error) {
    console.warn("[market/shared-cache] stale write failed", {
      key,
      reason: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function recordSharedMetric(params: {
  provider: "coingecko" | "kraken" | "market"
  operation: string
  durationMs: number
  ok: boolean
  countAsRequest?: boolean
  statusCode?: number
  staleServed?: boolean
  staleSource?: "memory" | "shared"
  reason?: string
}): Promise<void> {
  if (!sharedCacheBackend.enabled) return

  const key = namespacedKey(`metrics:${params.provider}`)
  const now = new Date().toISOString()
  const commands: RedisCommand[] = [
    ["HSET", key, "lastAttemptAt", now, "backend", sharedCacheBackend.kind],
    ["EXPIRE", key, ONE_WEEK_SECONDS],
  ]

  if (params.countAsRequest !== false) {
    commands.push(
      ["HINCRBY", key, "requests", 1],
      ["HINCRBYFLOAT", key, "durationTotalMs", Math.max(0, params.durationMs)]
    )
  }

  if (params.ok) {
    commands.push(
      ["HINCRBY", key, "successes", 1],
      ["HSET", key, "lastSuccessAt", now, "lastOperation", params.operation]
    )
  } else {
    commands.push(
      ["HINCRBY", key, "errors", 1],
      ["HSET", key, "lastErrorAt", now, "lastOperation", params.operation]
    )
  }

  if (params.statusCode === 429) {
    commands.push(
      ["HINCRBY", key, "rateLimits", 1],
      ["HSET", key, "lastRateLimitAt", now]
    )
  }

  if (params.staleServed) {
    commands.push(
      ["HINCRBY", key, "staleServed", 1],
      ["HSET", key, "lastStaleServedAt", now]
    )
    if (params.staleSource) {
      commands.push(["HINCRBY", key, `${params.staleSource}StaleServed`, 1])
    }
  }

  if (params.reason) {
    commands.push(["HSET", key, "lastReason", params.reason.slice(0, 240)])
  }

  try {
    await runRedisPipeline(commands)
  } catch (error) {
    console.warn("[market/shared-cache] metric write failed", {
      provider: params.provider,
      operation: params.operation,
      reason: error instanceof Error ? error.message : String(error),
    })
  }
}

export async function getSharedMetricSnapshot(provider: "coingecko" | "kraken" | "market") {
  if (!sharedCacheBackend.enabled) return null

  try {
    const result = await runRedisCommand<Record<string, string>>(["HGETALL", namespacedKey(`metrics:${provider}`)])
    return result
  } catch (error) {
    console.warn("[market/shared-cache] metric read failed", {
      provider,
      reason: error instanceof Error ? error.message : String(error),
    })
    return null
  }
}

export async function getSharedStaleStatus(keys: string[]) {
  if (!sharedCacheBackend.enabled || keys.length === 0) return []

  try {
    const rawEntries = await Promise.all(keys.map((key) => readSharedStale<unknown>(key, ONE_WEEK_SECONDS * 1000)))
    return keys.map((key, index) => ({
      key,
      available: Boolean(rawEntries[index]),
      updatedAt: rawEntries[index]?.updatedAt ?? null,
      source: rawEntries[index]?.source ?? null,
    }))
  } catch {
    return keys.map((key) => ({ key, available: false, updatedAt: null, source: null }))
  }
}

import * as Sentry from "@sentry/nextjs"
import {
  getSharedMetricSnapshot,
  recordSharedMetric,
  getSharedMarketCacheBackendName,
  getSharedStaleStatus,
  isSharedMarketCacheConfigured,
} from "@/lib/shared-market-cache"

type Provider = "coingecko" | "kraken" | "market"

type ProviderMetrics = {
  requests: number
  successes: number
  errors: number
  rateLimits: number
  staleServed: number
  memoryStaleServed: number
  sharedStaleServed: number
  durationTotalMs: number
  lastSuccessAt: string | null
  lastErrorAt: string | null
  lastRateLimitAt: string | null
  lastReason: string | null
  lastOperation: string | null
}

type MetricsStore = Record<Provider, ProviderMetrics>

const DEFAULT_PROVIDER_METRICS = (): ProviderMetrics => ({
  requests: 0,
  successes: 0,
  errors: 0,
  rateLimits: 0,
  staleServed: 0,
  memoryStaleServed: 0,
  sharedStaleServed: 0,
  durationTotalMs: 0,
  lastSuccessAt: null,
  lastErrorAt: null,
  lastRateLimitAt: null,
  lastReason: null,
  lastOperation: null,
})

const localMetricsStore = (
  globalThis as typeof globalThis & { __axiomMarketMetrics?: MetricsStore }
).__axiomMarketMetrics ?? {
  coingecko: DEFAULT_PROVIDER_METRICS(),
  kraken: DEFAULT_PROVIDER_METRICS(),
  market: DEFAULT_PROVIDER_METRICS(),
}

if (!(globalThis as typeof globalThis & { __axiomMarketMetrics?: MetricsStore }).__axiomMarketMetrics) {
  ;(globalThis as typeof globalThis & { __axiomMarketMetrics?: MetricsStore }).__axiomMarketMetrics = localMetricsStore
}

function roundDuration(value: number) {
  return Number.isFinite(value) ? Math.round(value * 100) / 100 : 0
}

function updateLocalMetrics(params: {
  provider: Provider
  operation: string
  durationMs: number
  ok: boolean
  countAsRequest?: boolean
  statusCode?: number
  staleServed?: boolean
  staleSource?: "memory" | "shared"
  reason?: string
}) {
  const metrics = localMetricsStore[params.provider]
  const now = new Date().toISOString()

  if (params.countAsRequest !== false) {
    metrics.requests += 1
    metrics.durationTotalMs += Math.max(0, params.durationMs)
  }
  metrics.lastOperation = params.operation

  if (params.ok) {
    metrics.successes += 1
    metrics.lastSuccessAt = now
  } else {
    metrics.errors += 1
    metrics.lastErrorAt = now
    metrics.lastReason = params.reason ?? null
  }

  if (params.statusCode === 429) {
    metrics.rateLimits += 1
    metrics.lastRateLimitAt = now
  }

  if (params.staleServed) {
    metrics.staleServed += 1
    if (params.staleSource === "memory") metrics.memoryStaleServed += 1
    if (params.staleSource === "shared") metrics.sharedStaleServed += 1
  }
}

export async function recordMarketEvent(params: {
  provider: Provider
  operation: string
  durationMs: number
  ok: boolean
  countAsRequest?: boolean
  statusCode?: number
  staleServed?: boolean
  staleSource?: "memory" | "shared"
  reason?: string
  extra?: Record<string, unknown>
}) {
  updateLocalMetrics(params)

  const logPayload = {
    provider: params.provider,
    operation: params.operation,
    ok: params.ok,
    statusCode: params.statusCode ?? null,
    durationMs: roundDuration(params.durationMs),
    staleServed: params.staleServed ?? false,
    staleSource: params.staleSource ?? null,
    reason: params.reason ?? null,
    extra: params.extra ?? null,
  }

  if (!params.ok || params.staleServed) {
    console.warn("[market/observability]", logPayload)
  } else if (params.durationMs >= 400) {
    console.info("[market/observability]", logPayload)
  }

  if (!params.ok && params.statusCode !== 429) {
    Sentry.addBreadcrumb({
      category: "market",
      message: `${params.provider}:${params.operation}`,
      level: "warning",
      data: logPayload,
    })
  }

  await recordSharedMetric(params)
}

function summarizeMetrics(metrics: ProviderMetrics | null) {
  if (!metrics) return null
  const averageFetchMs = metrics.requests > 0 ? roundDuration(metrics.durationTotalMs / metrics.requests) : null
  const errorRate = metrics.requests > 0 ? roundDuration((metrics.errors / metrics.requests) * 100) : null

  return {
    ...metrics,
    averageFetchMs,
    errorRate,
  }
}

function parseSharedMetrics(input: Record<string, string> | null): ProviderMetrics | null {
  if (!input) return null

  return {
    requests: Number(input.requests ?? 0),
    successes: Number(input.successes ?? 0),
    errors: Number(input.errors ?? 0),
    rateLimits: Number(input.rateLimits ?? 0),
    staleServed: Number(input.staleServed ?? 0),
    memoryStaleServed: Number(input.memoryStaleServed ?? 0),
    sharedStaleServed: Number(input.sharedStaleServed ?? 0),
    durationTotalMs: Number(input.durationTotalMs ?? 0),
    lastSuccessAt: input.lastSuccessAt ?? null,
    lastErrorAt: input.lastErrorAt ?? null,
    lastRateLimitAt: input.lastRateLimitAt ?? null,
    lastReason: input.lastReason ?? null,
    lastOperation: input.lastOperation ?? null,
  }
}

export async function getMarketHealthSnapshot() {
  const [sharedCoinGecko, sharedKraken, sharedMarket, staleKeys] = await Promise.all([
    getSharedMetricSnapshot("coingecko"),
    getSharedMetricSnapshot("kraken"),
    getSharedMetricSnapshot("market"),
    getSharedStaleStatus([
      "market:snapshot",
      "kraken:tickers",
      "cg:global",
      "cg:top50",
      "cg:markets:100",
    ]),
  ])

  return {
    sharedCache: {
      configured: isSharedMarketCacheConfigured(),
      backend: getSharedMarketCacheBackendName(),
    },
    local: {
      coingecko: summarizeMetrics(localMetricsStore.coingecko),
      kraken: summarizeMetrics(localMetricsStore.kraken),
      market: summarizeMetrics(localMetricsStore.market),
    },
    shared: {
      coingecko: summarizeMetrics(parseSharedMetrics(sharedCoinGecko)),
      kraken: summarizeMetrics(parseSharedMetrics(sharedKraken)),
      market: summarizeMetrics(parseSharedMetrics(sharedMarket)),
    },
    staleKeys,
    generatedAt: new Date().toISOString(),
  }
}

export function getLocalMarketHealthSnapshot() {
  return {
    coingecko: summarizeMetrics(localMetricsStore.coingecko),
    kraken: summarizeMetrics(localMetricsStore.kraken),
    market: summarizeMetrics(localMetricsStore.market),
    generatedAt: new Date().toISOString(),
    sharedCacheConfigured: isSharedMarketCacheConfigured(),
    sharedCacheBackend: getSharedMarketCacheBackendName(),
  }
}

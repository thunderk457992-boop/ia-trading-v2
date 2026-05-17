import { unstable_cache } from "next/cache"
import { cache } from "react"
import {
  getTrackedCryptoUniverse,
  normalizeTrackedSymbol,
  type CryptoUniverseAsset,
} from "@/lib/crypto-universe"
import { recordMarketEvent } from "@/lib/market-observability"
import { readSharedStale, writeSharedStale } from "@/lib/shared-market-cache"

export interface KrakenTicker {
  symbol: string
  pair: string
  price: number
  ask: number
  bid: number
  volume24h: number
}

type KrakenTickerResult = {
  a?: string[]
  b?: string[]
  c?: string[]
  v?: string[]
}

type KrakenAssetPair = {
  altname?: string
  wsname?: string
  base?: string
  quote?: string
  status?: string
}

type KrakenApiResponse<T> = {
  error: string[]
  result: T
}

type StaleKrakenStore = Map<string, { value: unknown; updatedAt: number }>

const KRAKEN_STALE_MAX_AGE_MS = 15 * 60 * 1000
const KRAKEN_TICKERS_REVALIDATE_SECONDS = 45

const krakenStaleStore = (
  globalThis as typeof globalThis & { __axiomKrakenStaleStore?: StaleKrakenStore }
).__axiomKrakenStaleStore ?? new Map<string, { value: unknown; updatedAt: number }>()

if (!(globalThis as typeof globalThis & { __axiomKrakenStaleStore?: StaleKrakenStore }).__axiomKrakenStaleStore) {
  ;(globalThis as typeof globalThis & { __axiomKrakenStaleStore?: StaleKrakenStore }).__axiomKrakenStaleStore = krakenStaleStore
}

function writeStale<T>(key: string, value: T) {
  krakenStaleStore.set(key, { value, updatedAt: Date.now() })
}

function readStaleEntry<T>(key: string) {
  const entry = krakenStaleStore.get(key)
  if (!entry) return null
  if (Date.now() - entry.updatedAt > KRAKEN_STALE_MAX_AGE_MS) {
    krakenStaleStore.delete(key)
    return null
  }
  return entry as { value: T; updatedAt: number }
}

async function persistKrakenStale<T>(key: string, value: T) {
  writeStale(key, value)
  await writeSharedStale(key, value, Math.ceil(KRAKEN_STALE_MAX_AGE_MS / 1000), "Kraken")
}

async function readBestKrakenStale<T>(key: string) {
  const [localEntry, sharedEntry] = await Promise.all([
    Promise.resolve(readStaleEntry<T>(key)),
    readSharedStale<T>(key, KRAKEN_STALE_MAX_AGE_MS),
  ])

  if (localEntry && sharedEntry) {
    return localEntry.updatedAt >= sharedEntry.updatedAt
      ? { value: localEntry.value, source: "memory" as const, updatedAt: localEntry.updatedAt }
      : { value: sharedEntry.value, source: "shared" as const, updatedAt: sharedEntry.updatedAt }
  }

  if (localEntry) return { value: localEntry.value, source: "memory" as const, updatedAt: localEntry.updatedAt }
  if (sharedEntry) return { value: sharedEntry.value, source: "shared" as const, updatedAt: sharedEntry.updatedAt }
  return null
}

function withTimeout(ms: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  }
}

function isUsdPair(pairKey: string, pair: KrakenAssetPair) {
  const altname = pair.altname?.toUpperCase() ?? ""
  const wsname = pair.wsname?.toUpperCase() ?? ""
  const quote = pair.quote?.toUpperCase() ?? ""
  const upperKey = pairKey.toUpperCase()

  return (
    quote === "USD"
    || quote === "ZUSD"
    || altname.endsWith("USD")
    || wsname.endsWith("/USD")
    || upperKey.endsWith("USD")
    || upperKey.endsWith("ZUSD")
  )
}

function getPairCandidates(pairKey: string, pair: KrakenAssetPair) {
  const altname = pair.altname?.toUpperCase() ?? ""
  const wsname = pair.wsname?.toUpperCase() ?? ""
  const base = pair.base?.toUpperCase() ?? ""
  const upperKey = pairKey.toUpperCase()

  const candidates = new Set<string>()

  if (altname.endsWith("USD")) {
    candidates.add(altname.slice(0, -3))
  }

  if (wsname.includes("/")) {
    candidates.add(wsname.split("/")[0] ?? "")
  }

  candidates.add(base)
  candidates.add(upperKey.replace(/Z?USD$/, ""))

  return Array.from(candidates)
    .map((candidate) => candidate.trim())
    .filter(Boolean)
}

function scoreKrakenPair(
  asset: CryptoUniverseAsset,
  pairKey: string,
  pair: KrakenAssetPair
) {
  const candidates = new Set(
    [asset.symbol, ...(asset.aliases ?? []), ...asset.krakenBaseCandidates].map((candidate) =>
      candidate.toUpperCase()
    )
  )
  const pairCandidates = getPairCandidates(pairKey, pair)

  let score = 0
  for (const candidate of pairCandidates) {
    if (candidates.has(candidate)) score = Math.max(score, 120)
    if (candidates.has(candidate.replace(/^X/, ""))) score = Math.max(score, 100)
    if (candidates.has(candidate.replace(/^XX/, "X"))) score = Math.max(score, 95)
  }

  const altname = pair.altname?.toUpperCase() ?? ""
  const wsname = pair.wsname?.toUpperCase() ?? ""

  if (asset.krakenBaseCandidates.some((candidate) => altname === `${candidate}USD`)) score += 15
  if (asset.krakenBaseCandidates.some((candidate) => wsname === `${candidate}/USD`)) score += 10

  return score
}

async function fetchKrakenAssetPairsRaw() {
  const startedAt = Date.now()
  const timeout = withTimeout(8000)
  try {
    const res = await fetch("https://api.kraken.com/0/public/AssetPairs", {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: timeout.signal,
    }).finally(timeout.clear)

    if (!res.ok) throw new Error(`Kraken AssetPairs HTTP ${res.status}`)

    const data = (await res.json()) as KrakenApiResponse<Record<string, KrakenAssetPair>>
    if (data.error?.length) throw new Error(`Kraken AssetPairs error: ${data.error.join(", ")}`)

    await recordMarketEvent({
      provider: "kraken",
      operation: "assetPairs",
      durationMs: Date.now() - startedAt,
      ok: true,
      extra: { pairCount: Object.keys(data.result ?? {}).length },
    })
    return data.result
  } catch (error) {
    await recordMarketEvent({
      provider: "kraken",
      operation: "assetPairs",
      durationMs: Date.now() - startedAt,
      ok: false,
      statusCode: error instanceof Error && /HTTP (\d+)/.test(error.message)
        ? Number(error.message.match(/HTTP (\d+)/)?.[1] ?? 0)
        : undefined,
      reason: error instanceof Error ? error.message : String(error),
    })
    throw error
  }
}

async function fetchKrakenTickerBatchRaw(pairs: string[]) {
  if (!pairs.length) return {} as Record<string, KrakenTickerResult>

  const startedAt = Date.now()
  const timeout = withTimeout(8000)
  try {
    const res = await fetch(
      `https://api.kraken.com/0/public/Ticker?pair=${pairs.join(",")}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
        signal: timeout.signal,
      }
    ).finally(timeout.clear)

    if (!res.ok) throw new Error(`Kraken Ticker HTTP ${res.status}`)

    const data = (await res.json()) as KrakenApiResponse<Record<string, KrakenTickerResult>>
    if (data.error?.length) throw new Error(`Kraken Ticker error: ${data.error.join(", ")}`)

    await recordMarketEvent({
      provider: "kraken",
      operation: "tickerBatch",
      durationMs: Date.now() - startedAt,
      ok: true,
      extra: { pairCount: pairs.length, tickerCount: Object.keys(data.result ?? {}).length },
    })
    return data.result
  } catch (error) {
    await recordMarketEvent({
      provider: "kraken",
      operation: "tickerBatch",
      durationMs: Date.now() - startedAt,
      ok: false,
      statusCode: error instanceof Error && /HTTP (\d+)/.test(error.message)
        ? Number(error.message.match(/HTTP (\d+)/)?.[1] ?? 0)
        : undefined,
      reason: error instanceof Error ? error.message : String(error),
      extra: { pairCount: pairs.length },
    })
    throw error
  }
}

function resolveKrakenPairs(assetPairs: Record<string, KrakenAssetPair>) {
  const trackedAssets = getTrackedCryptoUniverse()
  const resolved = new Map<string, string>()

  for (const asset of trackedAssets) {
    let bestPairKey: string | null = null
    let bestScore = 0

    for (const [pairKey, pair] of Object.entries(assetPairs)) {
      if (!isUsdPair(pairKey, pair)) continue
      if (pair.status && pair.status !== "online") continue

      const score = scoreKrakenPair(asset, pairKey, pair)
      if (score > bestScore) {
        bestScore = score
        bestPairKey = pairKey
      }
    }

    if (bestPairKey) {
      resolved.set(asset.symbol, bestPairKey)
    }
  }

  return resolved
}

async function fetchKrakenTickersImpl(): Promise<KrakenTicker[]> {
  const assetPairs = await fetchKrakenAssetPairsRaw()
  const resolvedPairs = resolveKrakenPairs(assetPairs)
  const uniquePairs = Array.from(new Set(resolvedPairs.values())).sort()
  const tickerMap = await fetchKrakenTickerBatchRaw(uniquePairs)

  return Array.from(resolvedPairs.entries())
    .map(([displaySymbol, pairKey]) => {
      const rawTicker = tickerMap[pairKey]
      if (!rawTicker) return null

      const price = Number(rawTicker.c?.[0] ?? Number.NaN)
      const ask = Number(rawTicker.a?.[0] ?? Number.NaN)
      const bid = Number(rawTicker.b?.[0] ?? Number.NaN)
      const volume24h = Number(rawTicker.v?.[1] ?? Number.NaN)

      if (!Number.isFinite(price) || price <= 0) return null

      return {
        symbol: normalizeTrackedSymbol(displaySymbol),
        pair: pairKey,
        price,
        ask: Number.isFinite(ask) ? ask : price,
        bid: Number.isFinite(bid) ? bid : price,
        volume24h: Number.isFinite(volume24h) ? volume24h : 0,
      }
    })
    .filter((ticker): ticker is KrakenTicker => ticker !== null)
}

const fetchKrakenTickersCached = unstable_cache(
  async () => {
    const tickers = await fetchKrakenTickersImpl()
    if (!tickers.length) {
      throw new Error("Kraken tickers unavailable")
    }

    await persistKrakenStale("kraken:tickers", tickers)
    return tickers
  },
  ["kraken-tickers-v1"],
  {
    revalidate: KRAKEN_TICKERS_REVALIDATE_SECONDS,
    tags: ["market:kraken-tickers"],
  }
)

export const fetchKrakenTickers = cache(async (): Promise<KrakenTicker[]> => {
  const startedAt = Date.now()
  try {
    const tickers = await fetchKrakenTickersCached()
    await recordMarketEvent({
      provider: "kraken",
      operation: "fetchKrakenTickers",
      durationMs: Date.now() - startedAt,
      ok: true,
      countAsRequest: false,
      extra: { count: tickers.length },
    })
    return tickers
  } catch (error) {
    const stale = await readBestKrakenStale<KrakenTicker[]>("kraken:tickers")
    if (stale?.value?.length) {
      await recordMarketEvent({
        provider: "kraken",
        operation: "fetchKrakenTickers",
        durationMs: Date.now() - startedAt,
        ok: false,
        countAsRequest: false,
        staleServed: true,
        staleSource: stale.source,
        reason: error instanceof Error ? error.message : String(error),
        extra: { count: stale.value.length, updatedAt: stale.updatedAt },
      })
      console.warn("[Kraken] serving stale tickers after upstream error", {
        reason: error instanceof Error ? error.message : String(error),
        count: stale.value.length,
        source: stale.source,
        updatedAt: stale.updatedAt,
      })
      return stale.value
    }

    await recordMarketEvent({
      provider: "kraken",
      operation: "fetchKrakenTickers",
      durationMs: Date.now() - startedAt,
      ok: false,
      countAsRequest: false,
      reason: error instanceof Error ? error.message : String(error),
    })
    console.warn("[Kraken] tickers unavailable and no stale cache is available", error)
    return []
  }
})

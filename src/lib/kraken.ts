import { unstable_cache } from "next/cache"
import { cache } from "react"
import {
  getTrackedCryptoUniverse,
  normalizeTrackedSymbol,
  type CryptoUniverseAsset,
} from "@/lib/crypto-universe"

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

function readStale<T>(key: string): T | null {
  const entry = krakenStaleStore.get(key)
  if (!entry) return null
  if (Date.now() - entry.updatedAt > KRAKEN_STALE_MAX_AGE_MS) {
    krakenStaleStore.delete(key)
    return null
  }
  return entry.value as T
}

function writeStale<T>(key: string, value: T) {
  krakenStaleStore.set(key, { value, updatedAt: Date.now() })
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
  const timeout = withTimeout(8000)
  const res = await fetch("https://api.kraken.com/0/public/AssetPairs", {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: timeout.signal,
  }).finally(timeout.clear)

  if (!res.ok) {
    throw new Error(`Kraken AssetPairs HTTP ${res.status}`)
  }

  const data = (await res.json()) as KrakenApiResponse<Record<string, KrakenAssetPair>>
  if (data.error?.length) {
    throw new Error(`Kraken AssetPairs error: ${data.error.join(", ")}`)
  }

  return data.result
}

async function fetchKrakenTickerBatchRaw(pairs: string[]) {
  if (!pairs.length) return {} as Record<string, KrakenTickerResult>

  const timeout = withTimeout(8000)
  const res = await fetch(
    `https://api.kraken.com/0/public/Ticker?pair=${pairs.join(",")}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: timeout.signal,
    }
  ).finally(timeout.clear)

  if (!res.ok) {
    throw new Error(`Kraken Ticker HTTP ${res.status}`)
  }

  const data = (await res.json()) as KrakenApiResponse<Record<string, KrakenTickerResult>>
  if (data.error?.length) {
    throw new Error(`Kraken Ticker error: ${data.error.join(", ")}`)
  }

  return data.result
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

    writeStale("kraken:tickers", tickers)
    return tickers
  },
  ["kraken-tickers-v1"],
  {
    revalidate: KRAKEN_TICKERS_REVALIDATE_SECONDS,
    tags: ["market:kraken-tickers"],
  }
)

export const fetchKrakenTickers = cache(async (): Promise<KrakenTicker[]> => {
  try {
    return await fetchKrakenTickersCached()
  } catch (error) {
    const stale = readStale<KrakenTicker[]>("kraken:tickers")
    if (stale?.length) {
      console.warn("[Kraken] serving stale tickers after upstream error", {
        reason: error instanceof Error ? error.message : String(error),
        count: stale.length,
      })
      return stale
    }

    console.warn("[Kraken] tickers unavailable and no stale cache is available", error)
    return []
  }
})

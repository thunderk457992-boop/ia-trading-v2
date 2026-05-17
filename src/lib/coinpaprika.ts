/**
 * CoinPaprika — secondary metrics source
 *
 * Free tier, no API key required.
 * Rate limits: 100 req/min, 25 000 req/month.
 * Revalidate: 5 min → ~288 req/day well within limits.
 *
 * Used as fallback when CoinGecko is rate-limited (HTTP 429).
 * Provides: market cap, volume 24h, price change, BTC dominance, total market cap.
 */

import { unstable_cache } from "next/cache"
import { cache } from "react"
import { getTrackedCryptoUniverse, normalizeTrackedSymbol } from "@/lib/crypto-universe"
import { readSharedStale, writeSharedStale } from "@/lib/shared-market-cache"
import type { MarketGlobal } from "@/lib/coingecko"

const CP_BASE = "https://api.coinpaprika.com/v1"
const CP_REVALIDATE_SECONDS = 300
const CP_STALE_MAX_AGE_MS = 6 * 60 * 60 * 1000  // 6 hours

export interface CoinPaprikaMetrics {
  symbol: string
  price: number
  marketCap: number
  volume24h: number
  change24h: number
  change7d: number
}

// ── In-process stale store ────────────────────────────────────────────────────

type StaleStore = Map<string, { value: unknown; updatedAt: number }>

const cpStaleStore: StaleStore = (
  globalThis as typeof globalThis & { __axiomCPStore?: StaleStore }
).__axiomCPStore ?? new Map()

if (!(globalThis as typeof globalThis & { __axiomCPStore?: StaleStore }).__axiomCPStore) {
  ;(globalThis as typeof globalThis & { __axiomCPStore?: StaleStore }).__axiomCPStore = cpStaleStore
}

function cpWriteStale<T>(key: string, value: T) {
  cpStaleStore.set(key, { value, updatedAt: Date.now() })
}

function cpReadStale<T>(key: string): T | null {
  const entry = cpStaleStore.get(key)
  if (!entry) return null
  if (Date.now() - entry.updatedAt > CP_STALE_MAX_AGE_MS) {
    cpStaleStore.delete(key)
    return null
  }
  return entry.value as T
}

async function cpReadBestStale<T>(key: string): Promise<T | null> {
  const [local, shared] = await Promise.all([
    Promise.resolve(cpReadStale<T>(key)),
    readSharedStale<T>(key, CP_STALE_MAX_AGE_MS),
  ])
  return local ?? shared?.value ?? null
}

// ── Timeout helper ────────────────────────────────────────────────────────────

function withTimeout(ms: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return { signal: controller.signal, clear: () => clearTimeout(timeout) }
}

// ── Global market data ────────────────────────────────────────────────────────

async function fetchCPGlobalImpl(): Promise<MarketGlobal | null> {
  const t = withTimeout(6000)
  try {
    const res = await fetch(`${CP_BASE}/global`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: t.signal,
    }).finally(t.clear)

    if (!res.ok) throw new Error(`CoinPaprika global HTTP ${res.status}`)
    const data = await res.json() as Record<string, unknown>

    const totalMarketCapUsd = Number(data.market_cap_usd ?? 0)
    const btcDominance      = Number(data.bitcoin_dominance_percentage ?? 0)
    const change24h         = Number(data.market_cap_change_24h ?? 0)

    if (!Number.isFinite(totalMarketCapUsd) || totalMarketCapUsd <= 0) {
      throw new Error("CoinPaprika global: invalid market cap value")
    }

    return { totalMarketCapUsd, btcDominance, change24h }
  } catch (err) {
    console.warn("[CoinPaprika] global failed:", err instanceof Error ? err.message : String(err))
    return null
  }
}

const fetchCPGlobalCached = unstable_cache(
  async () => {
    const data = await fetchCPGlobalImpl()
    if (!data) throw new Error("CoinPaprika global unavailable")
    cpWriteStale("cp:global", data)
    await writeSharedStale("cp:global", data, Math.ceil(CP_STALE_MAX_AGE_MS / 1000), "CoinGecko")
    return data
  },
  ["coinpaprika-global-v1"],
  { revalidate: CP_REVALIDATE_SECONDS, tags: ["market:coinpaprika:global"] }
)

export const fetchCoinPaprikaGlobal = cache(async (): Promise<MarketGlobal | null> => {
  try {
    return await fetchCPGlobalCached()
  } catch {
    const stale = await cpReadBestStale<MarketGlobal>("cp:global")
    if (stale) console.info("[CoinPaprika] serving stale global data")
    return stale
  }
})

// ── Per-coin metrics ──────────────────────────────────────────────────────────

type CPTickerRaw = {
  symbol?: string
  quotes?: {
    USD?: {
      price?: number
      market_cap?: number
      volume_24h?: number
      percent_change_24h?: number
      percent_change_7d?: number
    }
  }
}

async function fetchCPTickersImpl(): Promise<Map<string, CoinPaprikaMetrics>> {
  const t = withTimeout(10000)
  try {
    const res = await fetch(`${CP_BASE}/tickers?limit=250`, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: t.signal,
    }).finally(t.clear)

    if (!res.ok) throw new Error(`CoinPaprika tickers HTTP ${res.status}`)
    const data = await res.json() as CPTickerRaw[]
    if (!Array.isArray(data)) throw new Error("CoinPaprika tickers: invalid payload shape")

    const trackedSymbols = new Set(
      getTrackedCryptoUniverse().map((asset) => asset.symbol.toUpperCase())
    )

    const result = new Map<string, CoinPaprikaMetrics>()

    for (const coin of data) {
      const rawSymbol = (coin?.symbol ?? "").toUpperCase()
      const symbol = normalizeTrackedSymbol(rawSymbol)
      if (!trackedSymbols.has(symbol)) continue

      const usd = coin?.quotes?.USD
      if (!usd) continue

      const price     = Number(usd.price ?? 0)
      const marketCap = Number(usd.market_cap ?? 0)
      const volume24h = Number(usd.volume_24h ?? 0)
      const change24h = Number(usd.percent_change_24h ?? Number.NaN)
      const change7d  = Number(usd.percent_change_7d  ?? Number.NaN)

      if (!Number.isFinite(price) || price <= 0) continue

      result.set(symbol, {
        symbol,
        price,
        marketCap: Number.isFinite(marketCap) && marketCap > 0 ? marketCap : 0,
        volume24h: Number.isFinite(volume24h) && volume24h > 0 ? volume24h : 0,
        change24h: Number.isFinite(change24h) ? change24h : Number.NaN,
        change7d:  Number.isFinite(change7d)  ? change7d  : Number.NaN,
      })
    }

    if (result.size === 0) throw new Error("CoinPaprika tickers: no tracked assets matched")
    return result
  } catch (err) {
    console.warn("[CoinPaprika] tickers failed:", err instanceof Error ? err.message : String(err))
    return new Map()
  }
}

type CPPlain = Record<string, CoinPaprikaMetrics>

const fetchCPTickersCached = unstable_cache(
  async (): Promise<CPPlain> => {
    const map = await fetchCPTickersImpl()
    if (map.size === 0) throw new Error("CoinPaprika tickers unavailable")
    const plain = Object.fromEntries(map) as CPPlain
    cpWriteStale("cp:tickers", plain)
    await writeSharedStale("cp:tickers", plain, Math.ceil(CP_STALE_MAX_AGE_MS / 1000), "CoinGecko")
    return plain
  },
  ["coinpaprika-tickers-v1"],
  { revalidate: CP_REVALIDATE_SECONDS, tags: ["market:coinpaprika:tickers"] }
)

export const fetchCoinPaprikaTickers = cache(
  async (): Promise<Map<string, CoinPaprikaMetrics>> => {
    try {
      const plain = await fetchCPTickersCached()
      return new Map(Object.entries(plain))
    } catch {
      const stale = await cpReadBestStale<CPPlain>("cp:tickers")
      if (stale) {
        console.info("[CoinPaprika] serving stale ticker data")
        return new Map(Object.entries(stale))
      }
      return new Map()
    }
  }
)

import { unstable_cache } from "next/cache"
import { cache } from "react"
import {
  getCryptoCategories as getUniverseCryptoCategories,
  getTrackedCryptoUniverse,
  normalizeTrackedSymbol,
} from "@/lib/crypto-universe"
import { fetchKrakenTickers, type KrakenTicker } from "@/lib/kraken"

export interface CryptoPrice {
  id: string
  symbol: string
  name: string
  price: number
  change1h: number
  change24h: number
  change7d: number
  marketCap: number
  volume24h: number
  image: string
  sparkline7d: number[]
  categories?: string[]
  source?: "Kraken" | "CoinGecko" | "fallback"
  pair?: string | null
}

export interface MarketGlobal {
  totalMarketCapUsd: number
  btcDominance: number
  change24h: number
}

export interface MarketSnapshot {
  prices: CryptoPrice[]
  global: MarketGlobal | null
  fetchedAt: number
  stale?: boolean
  summary?: {
    trackedAssets: number
    positiveAssets: number
    negativeAssets: number
    avgVolatility24h: number | null
    krakenAssets: number
    coinGeckoAssets: number
    fallbackAssets: number
    unavailableAssets: string[]
    primarySource: string
  }
}

export interface MarketChartPoint {
  timestamp: number
  price: number
}

export interface MarketSeriesPoint extends MarketChartPoint {
  volume: number | null
}

export interface PortfolioAssetHistory {
  symbol: string
  prices: MarketChartPoint[]
}

type MarketStaleStore = Map<string, { value: unknown; updatedAt: number }>

const MARKET_STALE_MAX_AGE_MS = 6 * 60 * 60 * 1000
const MARKET_GLOBAL_REVALIDATE_SECONDS = 300
const MARKET_PRICES_REVALIDATE_SECONDS = 300
const MARKET_SERIES_REVALIDATE_SECONDS = 900
const MARKET_SNAPSHOT_REVALIDATE_SECONDS = 60
const HOUR_MS = 60 * 60 * 1000

const marketStaleStore = (
  globalThis as typeof globalThis & { __axiomMarketStaleStore?: MarketStaleStore }
).__axiomMarketStaleStore ?? new Map<string, { value: unknown; updatedAt: number }>()

if (!(globalThis as typeof globalThis & { __axiomMarketStaleStore?: MarketStaleStore }).__axiomMarketStaleStore) {
  ;(globalThis as typeof globalThis & { __axiomMarketStaleStore?: MarketStaleStore }).__axiomMarketStaleStore = marketStaleStore
}

export function getCryptoCategories(symbol: string): string[] {
  return getUniverseCryptoCategories(symbol)
}

function cgHeaders(): HeadersInit {
  const key = process.env.COINGECKO_API_KEY
  return {
    Accept: "application/json",
    ...(key ? { "x-cg-demo-api-key": key } : {}),
  }
}

function withTimeout(ms: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), ms)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeout),
  }
}

function readStale<T>(key: string): T | null {
  const entry = marketStaleStore.get(key)
  if (!entry) return null
  if (Date.now() - entry.updatedAt > MARKET_STALE_MAX_AGE_MS) {
    marketStaleStore.delete(key)
    return null
  }
  return entry.value as T
}

function writeStale<T>(key: string, value: T) {
  marketStaleStore.set(key, { value, updatedAt: Date.now() })
}

function downsample(data: number[], target: number): number[] {
  if (data.length <= target) return data
  const step = data.length / target
  return Array.from({ length: target }, (_, i) => data[Math.floor(i * step)])
}

function mapCoin(coin: {
  id: string
  symbol: string
  name: string
  current_price: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h?: number
  price_change_percentage_7d_in_currency?: number
  market_cap: number
  total_volume?: number
  image: string
  sparkline_in_7d?: { price: number[] }
}): CryptoPrice {
  return {
    id: coin.id,
    symbol: normalizeTrackedSymbol(coin.symbol.toUpperCase()),
    name: coin.name,
    price: coin.current_price,
    change1h: coin.price_change_percentage_1h_in_currency ?? 0,
    change24h: coin.price_change_percentage_24h ?? 0,
    change7d: coin.price_change_percentage_7d_in_currency ?? 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume ?? 0,
    image: coin.image,
    sparkline7d: downsample(coin.sparkline_in_7d?.price ?? [], 40),
    categories: getUniverseCryptoCategories(coin.symbol.toUpperCase()),
    source: "CoinGecko",
    pair: null,
  }
}

async function fetchSpecificCryptoPricesImpl(ids: string[]): Promise<CryptoPrice[]> {
  if (!ids.length) return []

  try {
    const controller = withTimeout(8000)
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&sparkline=true&price_change_percentage=1h,24h,7d`,
      {
        cache: "no-store",
        headers: cgHeaders(),
        signal: controller.signal,
      }
    ).finally(controller.clear)

    if (!res.ok) {
      console.warn("[CoinGecko] fetchSpecificCryptoPrices non-ok response", {
        ids,
        status: res.status,
        statusText: res.statusText,
      })
      return []
    }

    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map(mapCoin)
  } catch (err) {
    console.error("[CoinGecko] fetchSpecificCryptoPrices error:", err)
    return []
  }
}

function mergePriceMaps(primary: CryptoPrice[], secondary: CryptoPrice[]) {
  const byId = new Map<string, CryptoPrice>()
  const bySymbol = new Map<string, CryptoPrice>()

  for (const coin of [...primary, ...secondary]) {
    if (!byId.has(coin.id)) byId.set(coin.id, coin)
    if (!bySymbol.has(coin.symbol)) bySymbol.set(coin.symbol, coin)
  }

  return { byId, bySymbol }
}

function resolveCoinForAsset(
  assetSymbol: string,
  coinById: Map<string, CryptoPrice>,
  coinBySymbol: Map<string, CryptoPrice>
) {
  const universeAsset = getTrackedCryptoUniverse().find((asset) => asset.symbol === assetSymbol)
  if (!universeAsset) return null

  const byId = coinById.get(universeAsset.coingeckoId)
  if (byId) return byId

  return coinBySymbol.get(universeAsset.symbol)
    ?? (universeAsset.aliases ?? []).map((alias) => coinBySymbol.get(alias)).find(Boolean)
    ?? null
}

function buildTrackedMarketPrices(
  coinGeckoPrices: CryptoPrice[],
  krakenTickers: KrakenTicker[]
) {
  const universe = getTrackedCryptoUniverse()
  const { byId, bySymbol } = mergePriceMaps(coinGeckoPrices, [])
  const krakenBySymbol = new Map(
    krakenTickers.map((ticker) => [normalizeTrackedSymbol(ticker.symbol), ticker] as const)
  )
  const krakenAvailable = krakenTickers.length > 0
  const unavailableAssets: string[] = []

  const priceCandidates: Array<CryptoPrice | null> = universe
    .map((asset) => {
      const coin = resolveCoinForAsset(asset.symbol, byId, bySymbol)
      const krakenTicker = krakenBySymbol.get(asset.symbol)

      if (!coin && !krakenTicker) {
        unavailableAssets.push(asset.symbol)
        return null
      }

      const price = krakenTicker?.price ?? coin?.price ?? null
      if (price === null || !Number.isFinite(price) || price <= 0) {
        unavailableAssets.push(asset.symbol)
        return null
      }

      const source: CryptoPrice["source"] = krakenTicker
        ? "Kraken"
        : krakenAvailable
          ? "fallback"
          : "CoinGecko"

      return {
        id: coin?.id ?? asset.coingeckoId,
        symbol: asset.symbol,
        name: coin?.name ?? asset.name,
        price,
        change1h: coin?.change1h ?? Number.NaN,
        change24h: coin?.change24h ?? Number.NaN,
        change7d: coin?.change7d ?? Number.NaN,
        marketCap: coin?.marketCap ?? Number.NaN,
        volume24h: coin?.volume24h ?? Number.NaN,
        image: coin?.image ?? "",
        sparkline7d: coin?.sparkline7d ?? [],
        categories: asset.categories,
        source,
        pair: krakenTicker?.pair ?? null,
      }
    })

  const prices = priceCandidates
    .filter((price): price is CryptoPrice => Boolean(price))
    .sort((left, right) => {
      if (left.marketCap && right.marketCap) return right.marketCap - left.marketCap
      return left.symbol.localeCompare(right.symbol)
    })

  const pricesWithChange = prices.filter((price) => Number.isFinite(price.change24h))
  const positiveAssets = pricesWithChange.filter((price) => price.change24h > 0).length
  const negativeAssets = pricesWithChange.filter((price) => price.change24h < 0).length
  const avgVolatility24h = pricesWithChange.length
    ? pricesWithChange.reduce((sum, price) => sum + Math.abs(price.change24h), 0) / pricesWithChange.length
    : null
  const krakenAssets = prices.filter((price) => price.source === "Kraken").length
  const fallbackAssets = prices.filter((price) => price.source === "fallback").length
  const coinGeckoAssets = prices.filter((price) => price.source === "CoinGecko").length

  return {
    prices,
    summary: {
      trackedAssets: prices.length,
      positiveAssets,
      negativeAssets,
      avgVolatility24h,
      krakenAssets,
      coinGeckoAssets,
      fallbackAssets,
      unavailableAssets,
      primarySource: krakenAssets > 0 ? "Kraken + CoinGecko fallback" : "CoinGecko",
    },
  }
}

async function fetchCryptoPricesImpl(): Promise<CryptoPrice[]> {
  try {
    const controller = withTimeout(8000)
    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d",
      {
        cache: "no-store",
        headers: cgHeaders(),
        signal: controller.signal,
      }
    ).finally(controller.clear)

    if (!res.ok) {
      console.warn("[CoinGecko] fetchCryptoPrices non-ok response", {
        status: res.status,
        statusText: res.statusText,
      })
      return []
    }
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map(mapCoin)
  } catch (err) {
    console.error("[CoinGecko] fetchCryptoPrices error:", err)
    return []
  }
}

async function fetchMarketsDataImpl(count = 50): Promise<CryptoPrice[]> {
  try {
    const controller = withTimeout(12000)
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&sparkline=true&price_change_percentage=1h,24h,7d`,
      {
        cache: "no-store",
        headers: cgHeaders(),
        signal: controller.signal,
      }
    ).finally(controller.clear)

    if (!res.ok) {
      console.warn("[CoinGecko] fetchMarketsData non-ok response", {
        count,
        status: res.status,
        statusText: res.statusText,
      })
      return []
    }
    const data = await res.json()
    if (!Array.isArray(data)) return []
    return data.map(mapCoin)
  } catch (err) {
    console.error("[CoinGecko] fetchMarketsData error:", err)
    return []
  }
}

async function fetchMarketGlobalImpl(): Promise<MarketGlobal | null> {
  try {
    const controller = withTimeout(5000)
    const res = await fetch(
      "https://api.coingecko.com/api/v3/global",
      {
        cache: "no-store",
        headers: cgHeaders(),
        signal: controller.signal,
      }
    ).finally(controller.clear)

    if (!res.ok) {
      console.warn("[CoinGecko] fetchMarketGlobal non-ok response", {
        status: res.status,
        statusText: res.statusText,
      })
      return null
    }
    const json = await res.json()
    const data = json?.data
    if (!data) return null
    return {
      totalMarketCapUsd: data.total_market_cap?.usd ?? 0,
      btcDominance: data.market_cap_percentage?.btc ?? 0,
      change24h: data.market_cap_change_percentage_24h_usd ?? 0,
    }
  } catch (err) {
    console.error("[CoinGecko] fetchMarketGlobal error:", err)
    return null
  }
}

async function fetchCoinMarketChartImpl(coinId: string, days = 7): Promise<MarketChartPoint[]> {
  try {
    const controller = withTimeout(8000)
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      {
        cache: "no-store",
        headers: cgHeaders(),
        signal: controller.signal,
      }
    ).finally(controller.clear)

    if (!res.ok) {
      console.warn("[CoinGecko] fetchCoinMarketChart non-ok response", {
        coinId,
        days,
        status: res.status,
        statusText: res.statusText,
      })
      return []
    }

    const data = await res.json()
    const rawPrices: unknown[] = Array.isArray(data?.prices) ? data.prices : []

    return rawPrices
      .filter((point: unknown): point is [number, number] => (
        Array.isArray(point)
        && point.length >= 2
        && Number.isFinite(point[0])
        && Number.isFinite(point[1])
      ))
      .sort((a, b) => a[0] - b[0])
      .map((point) => ({ timestamp: point[0], price: point[1] }))
  } catch (err) {
    console.error(`[CoinGecko] fetchCoinMarketChart error for ${coinId}:`, err)
    return []
  }
}

async function fetchCoinMarketSeriesImpl(
  coinId: string,
  days: number | "max" = 90
): Promise<MarketSeriesPoint[]> {
  try {
    const controller = withTimeout(9000)
    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      {
        cache: "no-store",
        headers: cgHeaders(),
        signal: controller.signal,
      }
    ).finally(controller.clear)

    if (!res.ok) {
      console.warn("[CoinGecko] fetchCoinMarketSeries non-ok response", {
        coinId,
        days,
        status: res.status,
        statusText: res.statusText,
      })
      return []
    }

    const data = await res.json()
    const rawPrices: unknown[] = Array.isArray(data?.prices) ? data.prices : []
    const rawVolumes: unknown[] = Array.isArray(data?.total_volumes) ? data.total_volumes : []

    const prices = rawPrices
      .filter((point: unknown): point is [number, number] => (
        Array.isArray(point)
        && point.length >= 2
        && Number.isFinite(point[0])
        && Number.isFinite(point[1])
      ))
      .sort((a, b) => a[0] - b[0])

    const volumes = rawVolumes
      .filter((point: unknown): point is [number, number] => (
        Array.isArray(point)
        && point.length >= 2
        && Number.isFinite(point[0])
        && Number.isFinite(point[1])
      ))
      .sort((a, b) => a[0] - b[0])

    if (prices.length <= 1) return []

    return prices.map(([timestamp, price], index) => {
      const indexedVolume = volumes[index]
      const matchedVolume = indexedVolume && Math.abs(indexedVolume[0] - timestamp) <= HOUR_MS
        ? indexedVolume[1]
        : null

      return {
        timestamp,
        price,
        volume: matchedVolume !== null && Number.isFinite(matchedVolume) ? matchedVolume : null,
      }
    })
  } catch (err) {
    console.error(`[CoinGecko] fetchCoinMarketSeries error for ${coinId}:`, err)
    return []
  }
}

function buildEmptyMarketSnapshot(stale = false): MarketSnapshot {
  return {
    prices: [],
    global: null,
    fetchedAt: Date.now(),
    stale,
    summary: {
      trackedAssets: 0,
      positiveAssets: 0,
      negativeAssets: 0,
      avgVolatility24h: null,
      krakenAssets: 0,
      coinGeckoAssets: 0,
      fallbackAssets: 0,
      unavailableAssets: [],
      primarySource: "CoinGecko",
    },
  }
}

const fetchSpecificCryptoPricesCached = unstable_cache(
  async (ids: string[]) => {
    const prices = await fetchSpecificCryptoPricesImpl(ids)
    if (!prices.length) {
      throw new Error(`CoinGecko specific prices unavailable for ids=${ids.join(",")}`)
    }
    writeStale(`cg:specific:${ids.join(",")}`, prices)
    return prices
  },
  ["cg-specific-prices-v1"],
  {
    revalidate: MARKET_PRICES_REVALIDATE_SECONDS,
    tags: ["market:coingecko:specific"],
  }
)

const fetchCryptoPricesCached = unstable_cache(
  async () => {
    const prices = await fetchCryptoPricesImpl()
    if (!prices.length) {
      throw new Error("CoinGecko top market prices unavailable")
    }
    writeStale("cg:top50", prices)
    return prices
  },
  ["cg-top50-prices-v1"],
  {
    revalidate: MARKET_PRICES_REVALIDATE_SECONDS,
    tags: ["market:coingecko:top50"],
  }
)

const fetchMarketsDataCached = unstable_cache(
  async (count: number) => {
    const prices = await fetchMarketsDataImpl(count)
    if (!prices.length) {
      throw new Error(`CoinGecko markets data unavailable for count=${count}`)
    }
    writeStale(`cg:markets:${count}`, prices)
    return prices
  },
  ["cg-markets-data-v1"],
  {
    revalidate: MARKET_PRICES_REVALIDATE_SECONDS,
    tags: ["market:coingecko:markets"],
  }
)

const fetchMarketGlobalCached = unstable_cache(
  async () => {
    const global = await fetchMarketGlobalImpl()
    if (!global) {
      throw new Error("CoinGecko global market data unavailable")
    }
    writeStale("cg:global", global)
    return global
  },
  ["cg-market-global-v1"],
  {
    revalidate: MARKET_GLOBAL_REVALIDATE_SECONDS,
    tags: ["market:coingecko:global"],
  }
)

const fetchCoinMarketChartCached = unstable_cache(
  async (coinId: string, days: number) => {
    const chart = await fetchCoinMarketChartImpl(coinId, days)
    if (chart.length <= 1) {
      throw new Error(`CoinGecko market chart unavailable for ${coinId}:${days}`)
    }
    writeStale(`cg:chart:${coinId}:${days}`, chart)
    return chart
  },
  ["cg-market-chart-v1"],
  {
    revalidate: MARKET_SERIES_REVALIDATE_SECONDS,
    tags: ["market:coingecko:chart"],
  }
)

const fetchCoinMarketSeriesCached = unstable_cache(
  async (coinId: string, days: number | "max") => {
    const series = await fetchCoinMarketSeriesImpl(coinId, days)
    if (series.length <= 1) {
      throw new Error(`CoinGecko market series unavailable for ${coinId}:${days}`)
    }
    writeStale(`cg:series:${coinId}:${days}`, series)
    return series
  },
  ["cg-market-series-v1"],
  {
    revalidate: MARKET_SERIES_REVALIDATE_SECONDS,
    tags: ["market:coingecko:series"],
  }
)

const fetchMarketSnapshotCached = unstable_cache(
  async () => {
    const [rankedMarkets, global, krakenTickers] = await Promise.all([
      fetchMarketsData(100),
      fetchMarketGlobal(),
      fetchKrakenTickers().catch((error) => {
        console.warn("[Kraken] fetchMarketSnapshot fallback to CoinGecko only", error)
        return [] as KrakenTicker[]
      }),
    ])

    const trackedIds = getTrackedCryptoUniverse().map((asset) => asset.coingeckoId)
    const presentIds = new Set(rankedMarkets.map((coin) => coin.id))
    const missingIds = trackedIds.filter((id) => !presentIds.has(id))
    const specificPrices = missingIds.length > 0
      ? await fetchSpecificCryptoPrices(missingIds)
      : []
    const { prices, summary } = buildTrackedMarketPrices(
      [...rankedMarkets, ...specificPrices],
      krakenTickers
    )

    if (!prices.length) {
      throw new Error("Market snapshot unavailable")
    }

    const snapshot: MarketSnapshot = {
      prices,
      global,
      fetchedAt: Date.now(),
      stale: false,
      summary,
    }

    writeStale("market:snapshot", snapshot)
    return snapshot
  },
  ["market-snapshot-v2"],
  {
    revalidate: MARKET_SNAPSHOT_REVALIDATE_SECONDS,
    tags: ["market:snapshot"],
  }
)

export const fetchSpecificCryptoPrices = cache(async (ids: string[]): Promise<CryptoPrice[]> => {
  const normalizedIds = Array.from(new Set(ids)).sort()
  if (!normalizedIds.length) return []

  try {
    return await fetchSpecificCryptoPricesCached(normalizedIds)
  } catch (error) {
    const stale = readStale<CryptoPrice[]>(`cg:specific:${normalizedIds.join(",")}`)
    if (stale?.length) {
      console.warn("[CoinGecko] serving stale specific prices", {
        ids: normalizedIds,
        reason: error instanceof Error ? error.message : String(error),
      })
      return stale
    }

    console.warn("[CoinGecko] specific prices unavailable and no stale cache exists", {
      ids: normalizedIds,
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
})

export const fetchCryptoPrices = cache(async (): Promise<CryptoPrice[]> => {
  try {
    return await fetchCryptoPricesCached()
  } catch (error) {
    const stale = readStale<CryptoPrice[]>("cg:top50")
    if (stale?.length) {
      console.warn("[CoinGecko] serving stale top market prices", {
        reason: error instanceof Error ? error.message : String(error),
      })
      return stale
    }

    console.warn("[CoinGecko] top market prices unavailable and no stale cache exists", error)
    return []
  }
})

export const fetchMarketsData = cache(async (count = 50): Promise<CryptoPrice[]> => {
  try {
    return await fetchMarketsDataCached(count)
  } catch (error) {
    const stale = readStale<CryptoPrice[]>(`cg:markets:${count}`)
    if (stale?.length) {
      console.warn("[CoinGecko] serving stale market list", {
        count,
        reason: error instanceof Error ? error.message : String(error),
      })
      return stale
    }

    console.warn("[CoinGecko] market list unavailable and no stale cache exists", {
      count,
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
})

export const fetchMarketGlobal = cache(async (): Promise<MarketGlobal | null> => {
  try {
    return await fetchMarketGlobalCached()
  } catch (error) {
    const stale = readStale<MarketGlobal>("cg:global")
    if (stale) {
      console.warn("[CoinGecko] serving stale global market data", {
        reason: error instanceof Error ? error.message : String(error),
      })
      return stale
    }

    console.warn("[CoinGecko] global market data unavailable and no stale cache exists", error)
    return null
  }
})

export const fetchCoinMarketChart = cache(async (coinId: string, days = 7): Promise<MarketChartPoint[]> => {
  try {
    return await fetchCoinMarketChartCached(coinId, days)
  } catch (error) {
    const stale = readStale<MarketChartPoint[]>(`cg:chart:${coinId}:${days}`)
    if (stale?.length) {
      console.warn("[CoinGecko] serving stale market chart", {
        coinId,
        days,
        reason: error instanceof Error ? error.message : String(error),
      })
      return stale
    }

    console.warn("[CoinGecko] market chart unavailable and no stale cache exists", {
      coinId,
      days,
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
})

export const fetchCoinMarketSeries = cache(async (
  coinId: string,
  days: number | "max" = 90
): Promise<MarketSeriesPoint[]> => {
  try {
    return await fetchCoinMarketSeriesCached(coinId, days)
  } catch (error) {
    const stale = readStale<MarketSeriesPoint[]>(`cg:series:${coinId}:${days}`)
    if (stale?.length) {
      console.warn("[CoinGecko] serving stale market series", {
        coinId,
        days,
        reason: error instanceof Error ? error.message : String(error),
      })
      return stale
    }

    console.warn("[CoinGecko] market series unavailable and no stale cache exists", {
      coinId,
      days,
      reason: error instanceof Error ? error.message : String(error),
    })
    return []
  }
})

export async function fetchPortfolioMarketHistory(
  allocations: Array<{ symbol: string; percentage: number }>,
  prices: CryptoPrice[],
  days = 7
): Promise<PortfolioAssetHistory[]> {
  if (!allocations.length || !prices.length) return []

  const symbols = Array.from(new Set(allocations.map((alloc) => alloc.symbol)))
  let universe = prices
  const missingSymbols = symbols.filter((symbol) => !universe.some((price) => price.symbol === symbol))

  if (missingSymbols.length > 0) {
    console.info("[CoinGecko] portfolio history missing from dashboard universe", {
      symbols,
      missingSymbols,
    })
    const extendedMarkets = await fetchMarketsData(100)
    if (extendedMarkets.length > 0) {
      const bySymbol = new Map<string, CryptoPrice>()
      for (const coin of [...universe, ...extendedMarkets]) {
        if (!bySymbol.has(coin.symbol)) bySymbol.set(coin.symbol, coin)
      }
      universe = Array.from(bySymbol.values())
    }
  }

  const histories = await Promise.all(symbols.map(async (symbol) => {
    const coin = universe.find((price) => price.symbol === symbol)
    if (!coin) {
      console.warn("[CoinGecko] portfolio asset unresolved", { symbol })
      return null
    }

    const chart = await fetchCoinMarketChart(coin.id, days)
    if (chart.length <= 1) {
      console.warn("[CoinGecko] market_chart unavailable for portfolio asset", {
        symbol,
        coinId: coin.id,
        points: chart.length,
        days,
      })
      return null
    }

    return { symbol, prices: chart }
  }))

  if (histories.some((history) => history === null)) {
    console.warn("[CoinGecko] portfolio history incomplete", {
      symbols,
      resolvedSymbols: histories
        .filter((history): history is PortfolioAssetHistory => history !== null)
        .map((history) => history.symbol),
    })
    return []
  }

  return histories as PortfolioAssetHistory[]
}

export const fetchMarketSnapshot = cache(async (): Promise<MarketSnapshot> => {
  try {
    return await fetchMarketSnapshotCached()
  } catch (error) {
    const stale = readStale<MarketSnapshot>("market:snapshot")
    if (stale?.prices.length) {
      console.warn("[market] serving stale market snapshot", {
        reason: error instanceof Error ? error.message : String(error),
        fetchedAt: stale.fetchedAt,
      })
      return {
        ...stale,
        stale: true,
      }
    }

    console.warn("[market] market snapshot unavailable and no stale cache exists", error)
    return buildEmptyMarketSnapshot(false)
  }
})

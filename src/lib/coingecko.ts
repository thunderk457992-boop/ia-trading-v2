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

export interface PortfolioAssetHistory {
  symbol: string
  prices: MarketChartPoint[]
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

function downsample(data: number[], target: number): number[] {
  if (data.length <= target) return data
  const step = data.length / target
  return Array.from({ length: target }, (_, i) => data[Math.floor(i * step)])
}

function mapCoin(coin: {
  id: string; symbol: string; name: string; current_price: number
  price_change_percentage_1h_in_currency?: number
  price_change_percentage_24h?: number
  price_change_percentage_7d_in_currency?: number
  market_cap: number; total_volume?: number; image: string
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

async function fetchSpecificCryptoPrices(ids: string[]): Promise<CryptoPrice[]> {
  if (!ids.length) return []

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids.join(","))}&sparkline=true&price_change_percentage=1h,24h,7d`,
      { next: { revalidate: 45 }, headers: cgHeaders(), signal: controller.signal }
    ).finally(() => clearTimeout(timeout))

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

export async function fetchCryptoPrices(): Promise<CryptoPrice[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&sparkline=true&price_change_percentage=1h,24h,7d",
      { next: { revalidate: 30 }, headers: cgHeaders(), signal: controller.signal }
    ).finally(() => clearTimeout(timeout))

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

export async function fetchMarketsData(count = 50): Promise<CryptoPrice[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${count}&sparkline=true&price_change_percentage=1h,24h,7d`,
      { next: { revalidate: 60 }, headers: cgHeaders(), signal: controller.signal }
    ).finally(() => clearTimeout(timeout))

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

export async function fetchMarketGlobal(): Promise<MarketGlobal | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(
      "https://api.coingecko.com/api/v3/global",
      { next: { revalidate: 60 }, headers: cgHeaders(), signal: controller.signal }
    ).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      console.warn("[CoinGecko] fetchMarketGlobal non-ok response", {
        status: res.status,
        statusText: res.statusText,
      })
      return null
    }
    const json = await res.json()
    const d = json?.data
    if (!d) return null
    return {
      totalMarketCapUsd: d.total_market_cap?.usd ?? 0,
      btcDominance: d.market_cap_percentage?.btc ?? 0,
      change24h: d.market_cap_change_percentage_24h_usd ?? 0,
    }
  } catch (err) {
    console.error("[CoinGecko] fetchMarketGlobal error:", err)
    return null
  }
}

export async function fetchCoinMarketChart(coinId: string, days = 7): Promise<MarketChartPoint[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`,
      { next: { revalidate: 60 }, headers: cgHeaders(), signal: controller.signal }
    ).finally(() => clearTimeout(timeout))

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

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
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
  const specificPrices = missingIds.length > 0 ? await fetchSpecificCryptoPrices(missingIds) : []
  const { prices, summary } = buildTrackedMarketPrices(
    [...rankedMarkets, ...specificPrices],
    krakenTickers
  )

  return {
    prices,
    global,
    fetchedAt: Date.now(),
    summary,
  }
}

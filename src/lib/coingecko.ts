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
}

export interface MarketChartPoint {
  timestamp: number
  price: number
}

export interface PortfolioAssetHistory {
  symbol: string
  prices: MarketChartPoint[]
}

export const CRYPTO_CATEGORY_MAP: Record<string, string[]> = {
  BTC: ["Large cap", "Reserve"],
  ETH: ["Large cap", "Layer 1", "DeFi", "Infrastructure"],
  SOL: ["Layer 1", "Large cap"],
  XRP: ["Large cap", "Payments"],
  BNB: ["Large cap", "Exchange", "Infrastructure"],
  AVAX: ["Layer 1"],
  SUI: ["Layer 1"],
  SEI: ["Layer 1", "Trading"],
  ADA: ["Layer 1"],
  LINK: ["Infrastructure", "Oracle"],
  ONDO: ["RWA", "DeFi"],
  AAVE: ["DeFi"],
  ARB: ["Layer 2", "DeFi"],
  OP: ["Layer 2", "Infrastructure"],
  RENDER: ["AI", "Infrastructure"],
  RNDR: ["AI", "Infrastructure"],
  TAO: ["AI"],
  FET: ["AI"],
  INJ: ["DeFi", "Infrastructure"],
  HBAR: ["Infrastructure"],
  DOGE: ["Memecoin"],
  PEPE: ["Memecoin"],
  WIF: ["Memecoin"],
  BONK: ["Memecoin"],
  KAS: ["Infrastructure"],
  ATOM: ["Infrastructure", "Layer 1"],
  IMX: ["Gaming", "Layer 2"],
  GALA: ["Gaming"],
  NEAR: ["AI", "Layer 1"],
  POL: ["Infrastructure", "Layer 2"],
  MATIC: ["Infrastructure", "Layer 2"],
  UNI: ["DeFi"],
  LTC: ["Payments", "Large cap"],
  BCH: ["Payments"],
  TRX: ["Infrastructure"],
  TON: ["Infrastructure", "Layer 1"],
  XLM: ["Payments"],
  FIL: ["Infrastructure"],
  ICP: ["Infrastructure"],
  HYPE: ["Layer 1"],
}

export function getCryptoCategories(symbol: string): string[] {
  const normalized = symbol.toUpperCase()
  return CRYPTO_CATEGORY_MAP[normalized] ?? ["Large cap"]
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
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    change1h: coin.price_change_percentage_1h_in_currency ?? 0,
    change24h: coin.price_change_percentage_24h ?? 0,
    change7d: coin.price_change_percentage_7d_in_currency ?? 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume ?? 0,
    image: coin.image,
    sparkline7d: downsample(coin.sparkline_in_7d?.price ?? [], 40),
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
  const [prices, global] = await Promise.all([fetchCryptoPrices(), fetchMarketGlobal()])
  return { prices, global, fetchedAt: Date.now() }
}

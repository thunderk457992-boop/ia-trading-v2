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
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,cardano,avalanche-2,polkadot&order=market_cap_desc&per_page=8&sparkline=true&price_change_percentage=1h,24h,7d",
      { next: { revalidate: 30 }, headers: cgHeaders(), signal: controller.signal }
    ).finally(() => clearTimeout(timeout))

    if (!res.ok) return []
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

    if (!res.ok) return []
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

    if (!res.ok) return null
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

export async function fetchMarketSnapshot(): Promise<MarketSnapshot> {
  const [prices, global] = await Promise.all([fetchCryptoPrices(), fetchMarketGlobal()])
  return { prices, global, fetchedAt: Date.now() }
}

export type KrakenTicker = {
  symbol: string
  price: number
  ask: number
  bid: number
  volume24h: number
}

type KrakenApiResponse = {
  error: string[]
  result: Record<
    string,
    {
      a: string[] // ask
      b: string[] // bid
      c: string[] // last trade closed
      v: string[] // volume
    }
  >
}

const KRAKEN_URL =
  "https://api.kraken.com/0/public/Ticker?pair=XBTUSD,ETHUSD,SOLUSD,XRPUSD"

const SYMBOL_MAP: Record<string, string> = {
  XXBTZUSD: "BTC",
  XETHZUSD: "ETH",
  SOLUSD: "SOL",
  XXRPZUSD: "XRP",
  XRPUSD: "XRP",
}

export async function fetchKrakenTickers(): Promise<KrakenTicker[]> {
  const res = await fetch(KRAKEN_URL, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    next: { revalidate: 2 },
  })

  if (!res.ok) {
    throw new Error(`Kraken HTTP ${res.status}`)
  }

  const data = (await res.json()) as KrakenApiResponse

  if (data.error?.length) {
    throw new Error(`Kraken API error: ${data.error.join(", ")}`)
  }

  return Object.entries(data.result).map(([pair, value]) => ({
    symbol: SYMBOL_MAP[pair] ?? pair,
    price: Number(value.c?.[0] ?? 0),
    ask: Number(value.a?.[0] ?? 0),
    bid: Number(value.b?.[0] ?? 0),
    volume24h: Number(value.v?.[1] ?? 0),
  }))
}
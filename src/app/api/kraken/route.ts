import { NextResponse } from "next/server"
import { fetchMarketSnapshot } from "@/lib/coingecko"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const market = await fetchMarketSnapshot()
    const hasData = market.prices.length > 0

    return NextResponse.json(
      {
        source: market.summary?.primarySource ?? "CoinGecko",
        updatedAt: market.fetchedAt,
        stale: market.stale ?? false,
        tickers: market.prices,
        summary: market.summary,
        marketGlobal: market.global,
        error: hasData ? undefined : "Impossible de recuperer les donnees de marche",
      },
      { status: hasData ? 200 : 503 }
    )
  } catch (error) {
    console.error("Kraken route error:", error)

    return NextResponse.json(
      {
        source: "CoinGecko",
        updatedAt: Date.now(),
        stale: false,
        tickers: [],
        error: "Impossible de recuperer les prix de marche",
      },
      { status: 503 }
    )
  }
}

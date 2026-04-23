import { NextResponse } from "next/server"
import { fetchKrakenTickers } from "@/lib/kraken"

export const runtime = "nodejs"

export async function GET() {
  try {
    const tickers = await fetchKrakenTickers()

    return NextResponse.json({
      source: "Kraken",
      updatedAt: Date.now(),
      tickers,
    })
  } catch (error) {
    console.error("Kraken route error:", error)

    return NextResponse.json(
      {
        source: "Kraken",
        updatedAt: Date.now(),
        tickers: [],
        error: "Impossible de récupérer les prix Kraken",
      },
      { status: 500 }
    )
  }
}
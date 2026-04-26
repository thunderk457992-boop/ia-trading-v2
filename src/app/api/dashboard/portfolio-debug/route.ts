import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()

    console.info("[dashboard] selectedTimeframe", {
      timeframe: payload?.timeframe ?? null,
      source: payload?.source ?? null,
      available: payload?.available ?? null,
    })
    console.info("[dashboard] filteredPortfolioPoints", {
      timeframe: payload?.timeframe ?? null,
      source: payload?.source ?? null,
      pointCount: payload?.pointCount ?? null,
      firstValue: payload?.firstValue ?? null,
      lastValue: payload?.lastValue ?? null,
      performancePercent: payload?.performancePercent ?? null,
      valueChange: payload?.valueChange ?? null,
    })
    console.info("[dashboard] chartSeries", {
      timeframe: payload?.timeframe ?? null,
      source: payload?.source ?? null,
      pointCount: payload?.pointCount ?? null,
      firstValue: payload?.firstValue ?? null,
      lastValue: payload?.lastValue ?? null,
    })
    console.info("[dashboard] portfolio timeframe selected", {
      timeframe: payload?.timeframe ?? null,
      source: payload?.source ?? null,
      pointCount: payload?.pointCount ?? null,
      firstValue: payload?.firstValue ?? null,
      lastValue: payload?.lastValue ?? null,
      performancePercent: payload?.performancePercent ?? null,
      valueChange: payload?.valueChange ?? null,
      available: payload?.available ?? null,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[dashboard] portfolio timeframe debug failed", error)
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}

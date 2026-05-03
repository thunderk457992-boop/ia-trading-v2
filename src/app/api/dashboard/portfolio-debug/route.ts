import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  // ── Security gate ── must be the very first block, no exceptions ──────────
  if (process.env.DEBUG_DASHBOARD_ENABLED !== "true") {
    let authenticated = false
    try {
      const supabase = await createClient()
      const { data } = await supabase.auth.getUser()
      authenticated = data.user !== null
    } catch {
      authenticated = false
    }
    if (!authenticated) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const p = payload as Record<string, unknown>

  console.info("[dashboard] selectedTimeframe", {
    timeframe: p?.timeframe ?? null,
    source: p?.source ?? null,
    available: p?.available ?? null,
  })
  console.info("[dashboard] filteredPortfolioPoints", {
    timeframe: p?.timeframe ?? null,
    source: p?.source ?? null,
    pointCount: p?.pointCount ?? null,
    firstValue: p?.firstValue ?? null,
    lastValue: p?.lastValue ?? null,
    performancePercent: p?.performancePercent ?? null,
    valueChange: p?.valueChange ?? null,
    livePortfolioValue: p?.livePortfolioValue ?? null,
    livePriceSource: p?.livePriceSource ?? null,
  })
  console.info("[dashboard] chartSeries", {
    timeframe: p?.timeframe ?? null,
    source: p?.source ?? null,
    pointCount: p?.pointCount ?? null,
    firstValue: p?.firstValue ?? null,
    lastValue: p?.lastValue ?? null,
    livePortfolioValue: p?.livePortfolioValue ?? null,
    livePriceSource: p?.livePriceSource ?? null,
  })
  console.info("[dashboard] portfolio timeframe selected", {
    timeframe: p?.timeframe ?? null,
    source: p?.source ?? null,
    pointCount: p?.pointCount ?? null,
    firstValue: p?.firstValue ?? null,
    lastValue: p?.lastValue ?? null,
    performancePercent: p?.performancePercent ?? null,
    valueChange: p?.valueChange ?? null,
    livePortfolioValue: p?.livePortfolioValue ?? null,
    livePriceSource: p?.livePriceSource ?? null,
    available: p?.available ?? null,
  })

  return NextResponse.json({ ok: true })
}

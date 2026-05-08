import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function canUseDebugRoute() {
  if (process.env.DEBUG_DASHBOARD_ENABLED !== "true") return false

  try {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return !error && !!user
  } catch {
    return false
  }
}

export async function POST(request: NextRequest) {
  if (!(await canUseDebugRoute())) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

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

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import { fetchKrakenTickers } from "@/lib/kraken"
import {
  computePortfolioSnapshotValue,
  normalizePortfolioAllocations,
  type PortfolioSnapshotAllocation,
} from "@/lib/portfolio-history"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const SNAPSHOT_INTERVAL_MS = 24 * 60 * 60 * 1000

type PortfolioHistorySeed = {
  user_id: string
  analysis_id: string | null
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
  allocations: PortfolioSnapshotAllocation[] | null
}

function getAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get("authorization") === `Bearer ${secret}`
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getAdmin()
  const market = await fetchMarketSnapshot()
  let krakenTickers = [] as Awaited<ReturnType<typeof fetchKrakenTickers>>
  try {
    krakenTickers = await fetchKrakenTickers()
  } catch (error) {
    console.warn("[cron] kraken live prices unavailable", error)
  }

  if (!market.prices.length) {
    console.error("[cron] portfolio snapshot aborted: CoinGecko unavailable")
    return NextResponse.json({ error: "Market data unavailable" }, { status: 503 })
  }

  const { data: rows, error: rowsError } = await admin
    .from("portfolio_history")
    .select("user_id, analysis_id, created_at, portfolio_value, invested_amount, allocations")
    .order("created_at", { ascending: false })
    .limit(5000)

  if (rowsError) {
    console.error("[cron] portfolio snapshot load failed", rowsError)
    return NextResponse.json({ error: "Failed to load portfolio snapshots" }, { status: 500 })
  }

  const latestByUser = new Map<string, PortfolioHistorySeed>()
  for (const row of (rows ?? []) as PortfolioHistorySeed[]) {
    if (!row.user_id || latestByUser.has(row.user_id)) continue
    latestByUser.set(row.user_id, row)
  }

  const nowMs = Date.now()
  const inserts: Array<{
    user_id: string
    analysis_id: string | null
    portfolio_value: number
    invested_amount: number
    performance_percent: number
    allocations: PortfolioSnapshotAllocation[]
  }> = []

  const skipped: Array<{ userId: string; reason: string }> = []

  for (const snapshot of latestByUser.values()) {
    const createdAtMs = Date.parse(snapshot.created_at)
    if (Number.isFinite(createdAtMs) && nowMs - createdAtMs < SNAPSHOT_INTERVAL_MS - 60_000) {
      skipped.push({ userId: snapshot.user_id, reason: "snapshot récent" })
      continue
    }

    const allocations = normalizePortfolioAllocations(snapshot.allocations)
    const investedAmount = typeof snapshot.invested_amount === "number"
      ? snapshot.invested_amount
      : typeof snapshot.invested_amount === "string"
      ? Number(snapshot.invested_amount)
      : null

    if (!allocations.length) {
      skipped.push({ userId: snapshot.user_id, reason: "allocations absentes" })
      continue
    }

    if (typeof investedAmount !== "number" || !Number.isFinite(investedAmount) || investedAmount <= 0) {
      skipped.push({ userId: snapshot.user_id, reason: "capital investi invalide" })
      continue
    }

    const computed = await computePortfolioSnapshotValue({
      latestSnapshot: snapshot,
      investedAmount,
      marketPrices: market.prices,
      marketFetchedAt: market.fetchedAt,
      krakenTickers,
    })
    if (!computed) {
      skipped.push({ userId: snapshot.user_id, reason: "revalorisation impossible" })
      continue
    }

    inserts.push({
      user_id: snapshot.user_id,
      analysis_id: snapshot.analysis_id,
      portfolio_value: computed.portfolioValue,
      invested_amount: computed.investedAmount,
      performance_percent: computed.performancePercent,
      allocations: computed.allocations.length ? computed.allocations : allocations,
    })
  }

  if (!inserts.length) {
    console.info("[cron] no portfolio snapshot inserted", {
      usersConsidered: latestByUser.size,
      skipped,
    })
    return NextResponse.json({
      ok: true,
      inserted: 0,
      usersConsidered: latestByUser.size,
      skipped,
      priceSource: krakenTickers.length > 0 ? "Kraken + CoinGecko" : "CoinGecko",
    })
  }

  const { error: insertError } = await admin.from("portfolio_history").insert(inserts)

  if (insertError) {
    console.error("[cron] portfolio snapshot insert failed", insertError)
    return NextResponse.json({ error: "Failed to insert portfolio snapshots" }, { status: 500 })
  }

  console.info("[cron] portfolio snapshot inserted", {
    inserted: inserts.length,
    usersConsidered: latestByUser.size,
    skipped,
    priceSource: krakenTickers.length > 0 ? "Kraken + CoinGecko" : "CoinGecko",
  })

  return NextResponse.json({
    ok: true,
    inserted: inserts.length,
    usersConsidered: latestByUser.size,
    skipped,
    priceSource: krakenTickers.length > 0 ? "Kraken + CoinGecko" : "CoinGecko",
  })
}

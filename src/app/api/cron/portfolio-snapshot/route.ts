import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import type { CryptoPrice } from "@/lib/coingecko"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const SNAPSHOT_INTERVAL_MS = 30 * 60 * 1000

type PortfolioAllocation = {
  symbol: string
  percentage: number
}

type PortfolioHistorySeed = {
  user_id: string
  analysis_id: string | null
  created_at: string
  invested_amount: number | null
  allocations: PortfolioAllocation[] | null
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
  if (!secret) return process.env.NODE_ENV !== "production"
  return request.headers.get("authorization") === `Bearer ${secret}`
}

function normalizeAllocations(value: unknown): PortfolioAllocation[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      symbol: String(item.symbol ?? "").toUpperCase().trim(),
      percentage: Number(item.percentage ?? 0),
    }))
    .filter((item) => item.symbol && Number.isFinite(item.percentage) && item.percentage > 0)
}

function computePortfolioSnapshot(
  allocations: PortfolioAllocation[],
  prices: CryptoPrice[],
  investedAmount: number
) {
  if (!investedAmount || investedAmount <= 0) return null

  const unresolved = allocations.filter((allocation) => !prices.some((price) => price.symbol === allocation.symbol))
  if (unresolved.length > 0) return null

  const weightedChange = allocations.reduce((sum, allocation) => {
    const price = prices.find((item) => item.symbol === allocation.symbol)
    if (!price) return sum
    return sum + (allocation.percentage / 100) * price.change24h
  }, 0)

  return {
    portfolioValue: Number((investedAmount * (1 + weightedChange / 100)).toFixed(2)),
    performancePercent: Number(weightedChange.toFixed(4)),
  }
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = getAdmin()
  const { prices } = await fetchMarketSnapshot()

  if (!prices.length) {
    console.error("[cron] portfolio snapshot aborted: CoinGecko unavailable")
    return NextResponse.json({ error: "Market data unavailable" }, { status: 503 })
  }

  const { data: rows, error: rowsError } = await admin
    .from("portfolio_history")
    .select("user_id, analysis_id, created_at, invested_amount, allocations")
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
    allocations: PortfolioAllocation[]
  }> = []

  const skipped: Array<{ userId: string; reason: string }> = []

  for (const snapshot of latestByUser.values()) {
    const createdAtMs = Date.parse(snapshot.created_at)
    if (Number.isFinite(createdAtMs) && nowMs - createdAtMs < SNAPSHOT_INTERVAL_MS - 60_000) {
      skipped.push({ userId: snapshot.user_id, reason: "snapshot récent" })
      continue
    }

    const allocations = normalizeAllocations(snapshot.allocations)
    const investedAmount = snapshot.invested_amount

    if (!allocations.length) {
      skipped.push({ userId: snapshot.user_id, reason: "allocations absentes" })
      continue
    }

    if (typeof investedAmount !== "number" || !Number.isFinite(investedAmount) || investedAmount <= 0) {
      skipped.push({ userId: snapshot.user_id, reason: "capital investi invalide" })
      continue
    }

    const computed = computePortfolioSnapshot(allocations, prices, investedAmount)
    if (!computed) {
      skipped.push({ userId: snapshot.user_id, reason: "prix marché incomplets" })
      continue
    }

    inserts.push({
      user_id: snapshot.user_id,
      analysis_id: snapshot.analysis_id,
      portfolio_value: computed.portfolioValue,
      invested_amount: investedAmount,
      performance_percent: computed.performancePercent,
      allocations,
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
      priceSource: "CoinGecko",
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
  })

  return NextResponse.json({
    ok: true,
    inserted: inserts.length,
    usersConsidered: latestByUser.size,
    skipped,
    priceSource: "CoinGecko",
  })
}

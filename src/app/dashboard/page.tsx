import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import {
  fetchMarketSnapshot,
  fetchPortfolioMarketHistory,
  fetchMarketsData,
  type CryptoPrice,
  type MarketChartPoint,
} from "@/lib/coingecko"
import { buildMarketDecision } from "@/lib/market-agent"
import { stripe } from "@/lib/stripe"
import { fetchKrakenTickers } from "@/lib/kraken"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type StripeSub = Record<string, any>
const HISTORY_LIMIT: Record<string, number> = { free: 3, pro: 10, premium: 20 }

interface PortfolioHistoryRow {
  analysis_id: string | null
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
  performance_percent: number | string | null
  allocations: Array<{ symbol: string; percentage: number }> | null
}

interface LivePortfolioPoint {
  timestamp: number
  created_at: string
  portfolio_value: number
  invested_amount: number | null
  price_source: "kraken" | "coingecko"
}

const TIMEFRAME_WINDOWS_MS = {
  "1H": 60 * 60 * 1000,
  "1D": 24 * 60 * 60 * 1000,
  "7D": 7 * 24 * 60 * 60 * 1000,
} as const
const DAY_MS = 24 * 60 * 60 * 1000

function parseFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeAllocations(value: Array<{ symbol: string; percentage: number }> | null | undefined) {
  if (!Array.isArray(value)) return []

  return value
    .map((allocation) => ({
      symbol: String(allocation.symbol ?? "").toUpperCase().trim(),
      percentage: Number(allocation.percentage ?? 0),
    }))
    .filter((allocation) => allocation.symbol && Number.isFinite(allocation.percentage) && allocation.percentage > 0)
}

function getPriceAtOrBefore(points: MarketChartPoint[], timestamp: number) {
  let price: number | null = null
  for (const point of points) {
    if (point.timestamp > timestamp) break
    price = point.price
  }
  return price
}

function mergeMarketUniverse(primary: CryptoPrice[], secondary: CryptoPrice[]) {
  const bySymbol = new Map<string, CryptoPrice>()
  for (const coin of [...primary, ...secondary]) {
    if (!bySymbol.has(coin.symbol)) bySymbol.set(coin.symbol, coin)
  }
  return Array.from(bySymbol.values())
}

function normalizePortfolioSnapshots(rows: PortfolioHistoryRow[]) {
  return rows
    .map((row) => {
      const timestamp = Date.parse(row.created_at)
      const portfolioValue = parseFiniteNumber(row.portfolio_value)
      const investedAmount = parseFiniteNumber(row.invested_amount)
      const allocations = normalizeAllocations(row.allocations)

      if (!Number.isFinite(timestamp) || portfolioValue === null || portfolioValue <= 0) {
        return null
      }

      return {
        timestamp,
        portfolioValue,
        investedAmount,
        allocations,
      }
    })
    .filter((row): row is { timestamp: number; portfolioValue: number; investedAmount: number | null; allocations: Array<{ symbol: string; percentage: number }> } => row !== null)
    .sort((left, right) => left.timestamp - right.timestamp)
}

function summarizePortfolioSnapshots(rows: PortfolioHistoryRow[], anchorMs: number) {
  const normalized = normalizePortfolioSnapshots(rows)

  return {
    normalizedCount: normalized.length,
    byTimeframe: {
      "1H": summarizePortfolioWindow(normalized, TIMEFRAME_WINDOWS_MS["1H"], anchorMs),
      "1D": summarizePortfolioWindow(normalized, TIMEFRAME_WINDOWS_MS["1D"], anchorMs),
      "7D": summarizePortfolioWindow(normalized, TIMEFRAME_WINDOWS_MS["7D"], anchorMs),
      "ALL": summarizePortfolioWindow(normalized, null, anchorMs),
    },
  }
}

function summarizePortfolioWindow(
  rows: Array<{ timestamp: number; portfolioValue: number }>,
  windowMs: number | null,
  anchorMs: number
) {
  const filtered = windowMs === null
    ? rows.filter((row) => row.timestamp <= anchorMs)
    : rows.filter((row) => row.timestamp >= anchorMs - windowMs && row.timestamp <= anchorMs)

  if (filtered.length < 2) {
    return {
      pointCount: filtered.length,
      firstValue: filtered[0]?.portfolioValue ?? null,
      lastValue: filtered[filtered.length - 1]?.portfolioValue ?? null,
      performancePercent: null,
    }
  }

  const firstValue = filtered[0].portfolioValue
  const lastValue = filtered[filtered.length - 1].portfolioValue
  const performancePercent = firstValue > 0
    ? Number((((lastValue - firstValue) / firstValue) * 100).toFixed(3))
    : null

  return {
    pointCount: filtered.length,
    firstValue,
    lastValue,
    performancePercent,
  }
}

async function buildLivePortfolioPoint(
  rows: PortfolioHistoryRow[],
  market: Awaited<ReturnType<typeof fetchMarketSnapshot>>
): Promise<{ point: LivePortfolioPoint | null; debug: Record<string, unknown> }> {
  const normalized = normalizePortfolioSnapshots(rows)
  const latestSnapshot = normalized[normalized.length - 1]

  if (!latestSnapshot) {
    return { point: null, debug: { reason: "no_valid_snapshot" } }
  }

  if (!latestSnapshot.allocations.length) {
    return { point: null, debug: { reason: "missing_allocations", snapshotAt: latestSnapshot.timestamp } }
  }

  let marketUniverse = market.prices
  const missingSymbols = latestSnapshot.allocations
    .map((allocation) => allocation.symbol)
    .filter((symbol) => !marketUniverse.some((coin) => coin.symbol === symbol))

  if (missingSymbols.length > 0) {
    const extendedMarkets = await fetchMarketsData(100)
    marketUniverse = mergeMarketUniverse(marketUniverse, extendedMarkets)
  }

  let krakenTickers: Awaited<ReturnType<typeof fetchKrakenTickers>> = []
  try {
    krakenTickers = await fetchKrakenTickers()
  } catch (error) {
    console.warn("[dashboard] kraken live prices unavailable", error)
  }

  const krakenPriceMap = new Map(krakenTickers.map((ticker) => [ticker.symbol, ticker.price]))
  const daysNeeded = Math.max(1, Math.ceil((market.fetchedAt - latestSnapshot.timestamp) / DAY_MS) + 1)
  const histories = await fetchPortfolioMarketHistory(latestSnapshot.allocations, marketUniverse, daysNeeded)

  if (!histories.length) {
    return {
      point: null,
      debug: {
        reason: "historical_prices_unavailable",
        snapshotAt: latestSnapshot.timestamp,
        daysNeeded,
      },
    }
  }

  let livePortfolioValue = 0
  let usedKraken = false
  const assetDebug = latestSnapshot.allocations.map((allocation) => {
    const history = histories.find((item) => item.symbol === allocation.symbol)
    const baselinePrice = history ? getPriceAtOrBefore(history.prices, latestSnapshot.timestamp) : null
    const krakenPrice = krakenPriceMap.get(allocation.symbol) ?? null
    const coinGeckoPrice = marketUniverse.find((coin) => coin.symbol === allocation.symbol)?.price ?? history?.prices[history.prices.length - 1]?.price ?? null
    const livePrice = krakenPrice ?? coinGeckoPrice

    if (!baselinePrice || !livePrice || latestSnapshot.portfolioValue <= 0) {
      return {
        symbol: allocation.symbol,
        percentage: allocation.percentage,
        baselinePrice,
        livePrice,
        liveSource: krakenPrice ? "kraken" : coinGeckoPrice ? "coingecko" : null,
        quantity: null,
        currentValue: null,
      }
    }

    const quantity = (latestSnapshot.portfolioValue * (allocation.percentage / 100)) / baselinePrice
    const currentValue = quantity * livePrice
    if (krakenPrice) usedKraken = true
    livePortfolioValue += currentValue

    return {
      symbol: allocation.symbol,
      percentage: allocation.percentage,
      baselinePrice,
      livePrice,
      liveSource: krakenPrice ? "kraken" : "coingecko",
      quantity: Number(quantity.toFixed(8)),
      currentValue: Number(currentValue.toFixed(2)),
    }
  })

  if (assetDebug.some((asset) => asset.currentValue === null)) {
    return {
      point: null,
      debug: {
        reason: "live_value_incomplete",
        snapshotAt: latestSnapshot.timestamp,
        daysNeeded,
        assetDebug,
      },
    }
  }

  return {
    point: {
      timestamp: market.fetchedAt,
      created_at: new Date(market.fetchedAt).toISOString(),
      portfolio_value: Number(livePortfolioValue.toFixed(2)),
      invested_amount: latestSnapshot.investedAmount,
      price_source: usedKraken ? "kraken" : "coingecko",
    },
    debug: {
      reason: "ok",
      snapshotAt: latestSnapshot.timestamp,
      daysNeeded,
      livePriceSource: usedKraken ? "kraken" : "coingecko",
      livePortfolioValue: Number(livePortfolioValue.toFixed(2)),
      assetDebug,
    },
  }
}

const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  [
    [process.env.STRIPE_PRICE_PRO_MONTHLY,     "pro"],
    [process.env.STRIPE_PRICE_PRO_YEARLY,      "pro"],
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY, "premium"],
    [process.env.STRIPE_PRICE_PREMIUM_YEARLY,  "premium"],
  ].filter(([k]) => k) as [string, string][]
)

// Always uses service role — bypasses RLS for guaranteed writes
function getAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; plan?: string; upgraded?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const params = await searchParams

  // ── Checkout return: sync Stripe → Supabase, then redirect for fresh render ─
  if (params.success === "true") {
    const syncedPlan = await syncStripeSubscription(user.id, params.plan)
    redirect(`/dashboard?upgraded=true&plan=${syncedPlan}`)
  }

  // ── Normal render with fresh data ─────────────────────────────────────────
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [{ data: profile }, { data: analyses }, { data: subscription }, { count: monthlyCount }, market, portfolioHistoryResult] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("ai_analyses")
      .select("id, created_at, allocations, total_score, recommendations, market_context, investor_profile, warnings, model_used")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("subscriptions")
      .select("plan, status, current_period_end, cancel_at_period_end")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
    fetchMarketSnapshot(),
    getAdmin()
      .from("portfolio_history")
      .select("analysis_id, created_at, portfolio_value, invested_amount, performance_percent, allocations")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true }),
  ])

  const portfolioSnapshots = portfolioHistoryResult.data ?? []
  if (portfolioHistoryResult.error) {
    console.error("[dashboard] portfolio_history query failed", {
      userId: user.id,
      error: portfolioHistoryResult.error,
    })
  }

  const plan = (subscription?.status === "active" || subscription?.status === "trialing")
    ? subscription.plan
    : profile?.plan ?? "free"
  const lastAnalysis = (analyses ?? []).slice(0, HISTORY_LIMIT[plan] ?? 3)[0] ?? null
  const hasPortfolioSnapshots = (portfolioSnapshots?.length ?? 0) > 0
  const portfolioHistory = !hasPortfolioSnapshots && lastAnalysis
    ? await fetchPortfolioMarketHistory(lastAnalysis.allocations ?? [], market.prices, 8)
    : []
  const marketDecision = buildMarketDecision(market.prices, market.global, lastAnalysis?.allocations ?? null)
  const snapshotSummary = summarizePortfolioSnapshots(portfolioSnapshots as PortfolioHistoryRow[], market.fetchedAt)
  const portfolioSource = hasPortfolioSnapshots ? "portfolio_history" : lastAnalysis ? "coingecko" : "none"
  const { point: livePortfolioPoint, debug: livePortfolioDebug } = hasPortfolioSnapshots
    ? await buildLivePortfolioPoint(portfolioSnapshots as PortfolioHistoryRow[], market)
    : { point: null, debug: { reason: "no_portfolio_history" } }

  console.info("[dashboard] portfolioHistory received", {
    userId: user.id,
    source: portfolioSource,
    rawCount: portfolioSnapshots.length,
    normalizedCount: snapshotSummary.normalizedCount,
    sample: portfolioSnapshots.slice(0, 3).map((snapshot) => ({
      createdAt: snapshot.created_at,
      portfolioValue: snapshot.portfolio_value,
      investedAmount: snapshot.invested_amount,
    })),
  })

  console.info("[dashboard] portfolio history summary", {
    userId: user.id,
    lastAnalysisCreatedAt: lastAnalysis?.created_at ?? null,
    allocationCount: lastAnalysis?.allocations?.length ?? 0,
    allocationSymbols: (lastAnalysis?.allocations ?? []).map((allocation: { symbol: string }) => allocation.symbol),
    marketPriceCount: market.prices.length,
    portfolioSnapshotCount: portfolioSnapshots?.length ?? 0,
    portfolioSnapshotNormalizedCount: snapshotSummary.normalizedCount,
    portfolioSnapshotValueTypesSample: portfolioSnapshots.slice(0, 3).map((snapshot) => ({
      createdAt: snapshot.created_at,
      portfolioValueType: typeof snapshot.portfolio_value,
      investedAmountType: typeof snapshot.invested_amount,
    })),
    sourceUsed: portfolioSource,
    livePriceSource: livePortfolioPoint?.price_source ?? null,
    livePortfolioValue: livePortfolioPoint?.portfolio_value ?? null,
    livePortfolioDebug,
    timeframeSummaries: snapshotSummary.byTimeframe,
    portfolioHistoryAssets: portfolioHistory.map((asset) => ({
      symbol: asset.symbol,
      points: asset.prices.length,
    })),
    marketFetchedAt: market.fetchedAt,
  })

  return (
    <DashboardOverview
      user={user}
      profile={profile}
      analyses={analyses ?? []}
      subscription={subscription}
      justUpgraded={params.upgraded === "true" ? (params.plan ?? null) : null}
      monthlyCount={monthlyCount ?? 0}
      cryptoPrices={market.prices}
      portfolioHistory={portfolioHistory}
      portfolioSnapshots={(portfolioSnapshots ?? []) as PortfolioHistoryRow[]}
      livePortfolioPoint={livePortfolioPoint}
      marketGlobal={market.global}
      marketDecision={marketDecision}
      marketFetchedAt={market.fetchedAt}
    />
  )
}

// ── Sync active Stripe subscription into Supabase via service role ────────────
async function syncStripeSubscription(userId: string, fallbackPlan?: string): Promise<string> {
  try {
    const db = getAdmin()

    // Get stripe_customer_id — use service role to bypass RLS
    const { data: profile } = await db
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      console.warn(`[sync] user ${userId} has no stripe_customer_id`)
      // Fallback: update plan from URL param with service role
      if (fallbackPlan && fallbackPlan !== "free") {
        const { error } = await db
          .from("profiles")
          .upsert({ id: userId, plan: fallbackPlan, updated_at: new Date().toISOString() }, { onConflict: "id" })
        if (error) console.error("[sync] profile upsert error:", error)
      }
      return fallbackPlan ?? "free"
    }

    // Fetch from Stripe: active → trialing → incomplete
    const [activeSubs, trialSubs, incompleteSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "active",     limit: 1 }),
      stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "trialing",   limit: 1 }),
      stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: "incomplete", limit: 1 }),
    ])

    const sub: StripeSub | null = activeSubs.data[0] ?? trialSubs.data[0] ?? incompleteSubs.data[0] ?? null

    if (!sub) {
      console.warn(`[sync] no subscription found for customer ${profile.stripe_customer_id}`)
      // Still apply fallback plan from URL if paid
      if (fallbackPlan && fallbackPlan !== "free") {
        await db
          .from("profiles")
          .upsert({ id: userId, plan: fallbackPlan, updated_at: new Date().toISOString() }, { onConflict: "id" })
      }
      return fallbackPlan ?? "free"
    }

    const plan: string = sub.metadata?.plan
      ?? PRICE_TO_PLAN[sub.items?.data?.[0]?.price?.id ?? ""]
      ?? fallbackPlan
      ?? "pro"

    console.log(`[sync] userId=${userId} plan=${plan} sub=${sub.id} status=${sub.status}`)

    // 1. UPSERT profile (creates row if missing, updates if exists)
    const { error: profileErr } = await db
      .from("profiles")
      .upsert(
        {
          id:                     userId,
          plan,
          stripe_subscription_id: sub.id,
          updated_at:             new Date().toISOString(),
        },
        { onConflict: "id" }
      )
    if (profileErr) console.error("[sync] profiles upsert error:", profileErr)

    // 2. UPSERT subscription row
    const { error: subErr } = await db
      .from("subscriptions")
      .upsert(
        {
          id:                   sub.id,
          user_id:              userId,
          status:               sub.status,
          plan,
          price_id:             sub.items?.data?.[0]?.price?.id ?? null,
          quantity:             sub.items?.data?.[0]?.quantity ?? 1,
          cancel_at_period_end: sub.cancel_at_period_end ?? false,
          current_period_start: sub.current_period_start
            ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end:   sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()   : null,
          metadata:   sub.metadata ?? {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      )
    if (subErr) console.error("[sync] subscriptions upsert error:", subErr)

    return plan
  } catch (err) {
    console.error("[sync] unexpected error:", err)
    return fallbackPlan ?? "free"
  }
}

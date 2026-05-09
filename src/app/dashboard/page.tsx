import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { redirect } from "next/navigation"
import { DashboardOverview } from "@/components/dashboard/DashboardOverview"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import { buildMarketDecision } from "@/lib/market-agent"
import { stripe } from "@/lib/stripe"

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

function isMissingStripeCustomerError(error: unknown) {
  return error instanceof Error && /No such customer/i.test(error.message)
}

async function clearStoredStripeCustomer(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  userId: string
) {
  const { error } = await db
    .from("profiles")
    .update({
      stripe_customer_id: null,
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    console.error("[sync] failed to clear stale stripe customer:", error)
  }
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
  const marketDecision = buildMarketDecision(market.prices, market.global, lastAnalysis?.allocations ?? null)


  return (
    <DashboardOverview
      user={user}
      profile={profile}
      analyses={analyses ?? []}
      subscription={subscription}
      justUpgraded={params.upgraded === "true" ? (params.plan ?? null) : null}
      monthlyCount={monthlyCount ?? 0}
      cryptoPrices={market.prices}
      portfolioSnapshots={(portfolioSnapshots ?? []) as PortfolioHistoryRow[]}
      marketGlobal={market.global}
      marketDecision={marketDecision}
      marketFetchedAt={market.fetchedAt}
    />
  )
}

// ── Sync active Stripe subscription into Supabase via service role ────────────
async function syncStripeSubscription(userId: string, fallbackPlan?: string): Promise<string> {
  const db = getAdmin()

  try {

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

    console.info("[sync] stripe subscription resolved", { userId, plan, status: sub.status })

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
    if (isMissingStripeCustomerError(err)) {
      console.warn(`[sync] stale stripe customer detected for user ${userId}`)
      await clearStoredStripeCustomer(db, userId)

      if (fallbackPlan && fallbackPlan !== "free") {
        const { error } = await db
          .from("profiles")
          .upsert({ id: userId, plan: fallbackPlan, updated_at: new Date().toISOString() }, { onConflict: "id" })
        if (error) console.error("[sync] profile upsert error after stale customer clear:", error)
      }

      return fallbackPlan ?? "free"
    }

    console.error("[sync] unexpected error:", err)
    return fallbackPlan ?? "free"
  }
}

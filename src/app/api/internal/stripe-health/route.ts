import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── Auth ──────────────────────────────────────────────────────────────────────

function isAuthorized(request: Request): boolean {
  const configured = process.env.MARKET_DEBUG_TOKEN ?? process.env.CRON_SECRET
  if (!configured) return false
  const auth = request.headers.get("authorization") ?? ""
  if (!auth.startsWith("Bearer ")) return false
  const token = auth.slice("Bearer ".length).trim()
  return token.length > 0 && token === configured
}

// ── Admin client ──────────────────────────────────────────────────────────────

function getAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured")
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const db = getAdmin()
  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const since7d  = new Date(now.getTime() - 7  * 24 * 60 * 60 * 1000).toISOString()

  // ── 1. Recent payments ────────────────────────────────────────────────────
  const { data: recentPayments, error: payErr } = await db
    .from("payments")
    .select("id, user_id, amount, currency, status, description, paid_at, created_at")
    .order("created_at", { ascending: false })
    .limit(20)

  // ── 2. Recent subscriptions ───────────────────────────────────────────────
  const { data: recentSubs, error: subErr } = await db
    .from("subscriptions")
    .select("id, user_id, status, plan, updated_at, cancel_at_period_end, current_period_end")
    .order("updated_at", { ascending: false })
    .limit(20)

  // ── 3. Plan distribution ──────────────────────────────────────────────────
  const { data: allProfiles } = await db
    .from("profiles")
    .select("plan")

  const planDist: Record<string, number> = {}
  for (const p of allProfiles ?? []) {
    const plan = (p.plan as string | null) ?? "free"
    planDist[plan] = (planDist[plan] ?? 0) + 1
  }

  // ── 4. Recent webhook events (optional table) ─────────────────────────────
  let webhookEvents: unknown[] | null = null
  let webhookEventsAvailable = false
  let upgradesSinceYesterday = 0
  let failuresSinceYesterday = 0
  let noUserSinceYesterday = 0
  let upgradesSince7d = 0

  try {
    const { data: evts, error: evtErr } = await db
      .from("webhook_events")
      .select("id, type, status, user_id, plan, error_message, processed_at")
      .order("processed_at", { ascending: false })
      .limit(50)

    if (!evtErr && evts) {
      webhookEventsAvailable = true
      webhookEvents = evts

      for (const evt of evts) {
        const e = evt as {
          type: string
          status: string
          processed_at: string
        }
        const isRecent24h = e.processed_at >= since24h
        const isRecent7d  = e.processed_at >= since7d

        if (isRecent24h) {
          if (e.status === "failed") failuresSinceYesterday++
          if (e.status === "no_user") noUserSinceYesterday++
          if (
            e.status === "processed" &&
            (e.type === "checkout.session.completed" || e.type === "customer.subscription.updated")
          ) upgradesSinceYesterday++
        }

        if (
          isRecent7d &&
          e.status === "processed" &&
          (e.type === "checkout.session.completed" || e.type === "customer.subscription.updated")
        ) upgradesSince7d++
      }
    }
  } catch {
    // webhook_events table not created yet — run supabase-webhook-events.sql
  }

  // ── 5. Payments health ────────────────────────────────────────────────────
  const payments24h = (recentPayments ?? []).filter(
    (p) => ((p as { created_at: string }).created_at ?? "") >= since24h
  )
  const successfulPayments24h = payments24h.filter(
    (p) => (p as { status: string }).status === "succeeded"
  ).length
  const failedPayments24h = payments24h.filter(
    (p) => (p as { status: string }).status === "failed"
  ).length

  // ── 6. Active subscriptions health ───────────────────────────────────────
  const activeSubs = (recentSubs ?? []).filter(
    (s) => (s as { status: string }).status === "active" || (s as { status: string }).status === "trialing"
  ).length
  const pastDueSubs = (recentSubs ?? []).filter(
    (s) => (s as { status: string }).status === "past_due"
  ).length

  // ── Response ──────────────────────────────────────────────────────────────
  return NextResponse.json(
    {
      generatedAt: now.toISOString(),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",

      config: {
        stripeWebhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET,
        supabaseServiceRoleKeyConfigured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        webhookEventsTableAvailable: webhookEventsAvailable,
        sentryConfigured: !!process.env.SENTRY_DSN,
      },

      planDistribution: planDist,

      payments: {
        queryError: payErr ? payErr.message : null,
        last24h: {
          total:     payments24h.length,
          succeeded: successfulPayments24h,
          failed:    failedPayments24h,
        },
        recentList: (recentPayments ?? []).slice(0, 10).map((p) => {
          const pay = p as {
            id: string
            user_id: string
            amount: number
            currency: string
            status: string
            description: string | null
            paid_at: string | null
            created_at: string
          }
          return {
            id:          pay.id,
            userId:      pay.user_id,
            amount:      pay.amount,
            currency:    pay.currency,
            status:      pay.status,
            description: pay.description,
            paidAt:      pay.paid_at,
            createdAt:   pay.created_at,
          }
        }),
      },

      subscriptions: {
        queryError: subErr ? subErr.message : null,
        summary: {
          active:   activeSubs,
          pastDue:  pastDueSubs,
        },
        recentList: (recentSubs ?? []).slice(0, 10).map((s) => {
          const sub = s as {
            id: string
            user_id: string
            status: string
            plan: string
            updated_at: string
            cancel_at_period_end: boolean
            current_period_end: string | null
          }
          return {
            id:                 sub.id,
            userId:             sub.user_id,
            status:             sub.status,
            plan:               sub.plan,
            updatedAt:          sub.updated_at,
            cancelAtPeriodEnd:  sub.cancel_at_period_end,
            currentPeriodEnd:   sub.current_period_end,
          }
        }),
      },

      webhookEvents: webhookEventsAvailable
        ? {
            available: true,
            last24h: {
              upgrades: upgradesSinceYesterday,
              failures: failuresSinceYesterday,
              noUser:   noUserSinceYesterday,
            },
            last7d: {
              upgrades: upgradesSince7d,
            },
            recentList: (webhookEvents ?? []).slice(0, 20).map((e) => {
              const evt = e as {
                id: string
                type: string
                status: string
                user_id: string | null
                plan: string | null
                error_message: string | null
                processed_at: string
              }
              return {
                id:          evt.id,
                type:        evt.type,
                status:      evt.status,
                userId:      evt.user_id,
                plan:        evt.plan,
                error:       evt.error_message,
                processedAt: evt.processed_at,
              }
            }),
          }
        : {
            available: false,
            note: "Run supabase-webhook-events.sql to enable cross-instance idempotency and this dashboard.",
          },
    },
    {
      status: 200,
      headers: { "Cache-Control": "private, no-store" },
    }
  )
}

import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"
import type Stripe from "stripe"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sub = Stripe.Subscription & Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Inv = Stripe.Invoice & Record<string, any>

// ── Structured logger ─────────────────────────────────────────────────────────

interface WlogEntry {
  level: "info" | "warn" | "error"
  ts: string
  source: "stripe-webhook"
  event: string
  eventId: string
  [key: string]: unknown
}

function wlog(
  level: WlogEntry["level"],
  event: string,
  eventId: string,
  data: Record<string, unknown> = {}
) {
  const entry: WlogEntry = {
    level,
    ts: new Date().toISOString(),
    source: "stripe-webhook",
    event,
    eventId,
    ...data,
  }
  const line = JSON.stringify(entry)
  if (level === "error") console.error(line)
  else if (level === "warn") console.warn(line)
  else console.log(line)
}

// ── Admin Supabase client ─────────────────────────────────────────────────────

function getAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured — webhook DB writes disabled")
  }
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// ── PRICE_ID → plan name ──────────────────────────────────────────────────────

const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  [
    [process.env.STRIPE_PRICE_PRO_MONTHLY,     "pro"],
    [process.env.STRIPE_PRICE_PRO_YEARLY,      "pro"],
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY, "premium"],
    [process.env.STRIPE_PRICE_PREMIUM_YEARLY,  "premium"],
  ].filter(([k]) => k) as [string, string][]
)

// ── Idempotency: check & record webhook events ────────────────────────────────

type WebhookStatus = "processed" | "failed" | "skipped" | "no_user"

async function isAlreadyProcessed(eventId: string): Promise<boolean> {
  try {
    const db = getAdmin()
    const { data } = await db
      .from("webhook_events")
      .select("id, status")
      .eq("id", eventId)
      .maybeSingle()
    return data?.status === "processed"
  } catch {
    // Table may not exist yet — proceed with processing
    return false
  }
}

async function recordWebhookEvent(params: {
  id: string
  type: string
  status: WebhookStatus
  userId?: string | null
  stripeCustomer?: string | null
  stripeObjectId?: string | null
  plan?: string | null
  errorMessage?: string | null
  metadata?: Record<string, unknown>
}) {
  try {
    const db = getAdmin()
    await db.from("webhook_events").upsert(
      {
        id:               params.id,
        type:             params.type,
        status:           params.status,
        user_id:          params.userId ?? null,
        stripe_customer:  params.stripeCustomer ?? null,
        stripe_object_id: params.stripeObjectId ?? null,
        plan:             params.plan ?? null,
        error_message:    params.errorMessage ?? null,
        processed_at:     new Date().toISOString(),
        metadata:         params.metadata ?? {},
      },
      { onConflict: "id", ignoreDuplicates: false }
    )
  } catch {
    // webhook_events table may not exist — idempotency falls back to DB upserts
  }
}

// ── DB helpers ────────────────────────────────────────────────────────────────

async function upsertSubscription(sub: Sub, userId: string, plan: string, eventId: string) {
  const db = getAdmin()

  const isActive = sub.status === "active" || sub.status === "trialing"
  const customerId = typeof sub.customer === "string"
    ? sub.customer
    : (sub.customer as { id: string } | null)?.id

  // 1. Upsert profile (plan + customer ID)
  const { error: profileErr } = await db
    .from("profiles")
    .upsert(
      {
        id:                     userId,
        plan:                   isActive ? plan : "free",
        ...(customerId ? { stripe_customer_id: customerId } : {}),
        stripe_subscription_id: isActive ? sub.id : null,
        updated_at:             new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileErr) {
    wlog("error", sub.status === "canceled" ? "subscription.deleted" : "subscription.updated", eventId, {
      step: "profiles_upsert",
      userId,
      plan,
      subId: sub.id,
      error: profileErr.message,
    })
    Sentry.captureMessage(`[webhook] profiles upsert failed for user ${userId}`, {
      level: "error",
      tags: { route: "stripe-webhook", step: "profiles_upsert" },
      extra: { userId, plan, subId: sub.id, error: profileErr },
    })
  } else {
    wlog("info", "subscription.upserted", eventId, {
      step: "profiles_upsert",
      userId,
      plan: isActive ? plan : "free",
      subId: sub.id,
      subStatus: sub.status,
    })
  }

  // 2. Upsert subscription row
  const { error: subErr } = await db.from("subscriptions").upsert(
    {
      id:                   sub.id,
      user_id:              userId,
      status:               sub.status,
      plan,
      price_id:             sub.items.data[0]?.price.id ?? null,
      quantity:             sub.items.data[0]?.quantity ?? 1,
      cancel_at_period_end: sub.cancel_at_period_end,
      current_period_start: sub.current_period_start
        ? new Date(sub.current_period_start * 1000).toISOString()
        : null,
      current_period_end:   sub.current_period_end
        ? new Date(sub.current_period_end * 1000).toISOString()
        : null,
      cancel_at:   sub.cancel_at   ? new Date(sub.cancel_at * 1000).toISOString()   : null,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
      trial_end:   sub.trial_end   ? new Date(sub.trial_end * 1000).toISOString()   : null,
      metadata:    sub.metadata ?? {},
      updated_at:  new Date().toISOString(),
    },
    { onConflict: "id" }
  )

  if (subErr) {
    wlog("error", "subscription.upserted", eventId, {
      step: "subscriptions_upsert",
      userId,
      subId: sub.id,
      error: subErr.message,
    })
    Sentry.captureMessage(`[webhook] subscriptions upsert failed for ${sub.id}`, {
      level: "error",
      tags: { route: "stripe-webhook", step: "subscriptions_upsert" },
      extra: { userId, subId: sub.id, error: subErr },
    })
  }
}

async function recordPayment(invoice: Inv, userId: string, eventId: string) {
  const paymentIntent = invoice.payment_intent
  if (!paymentIntent || invoice.status !== "paid") return

  const db = getAdmin()
  const piId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id
  if (!piId) return

  const { error: payErr } = await db.from("payments").upsert(
    {
      id:              piId,
      user_id:         userId,
      subscription_id: typeof invoice.subscription === "string" ? invoice.subscription : null,
      amount:          invoice.amount_paid,
      currency:        invoice.currency,
      status:          "succeeded",
      description:     invoice.description ?? `Paiement ${invoice.number}`,
      invoice_url:     invoice.hosted_invoice_url ?? null,
      receipt_url:     invoice.invoice_pdf ?? null,
      paid_at:         invoice.status_transitions?.paid_at
                         ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
                         : new Date().toISOString(),
      metadata:        { invoice_number: invoice.number },
    },
    { onConflict: "id" }
  )

  if (payErr) {
    wlog("error", "invoice.paid", eventId, {
      step: "payments_upsert",
      userId,
      piId,
      error: payErr.message,
    })
    Sentry.captureMessage(`[webhook] payment record failed for ${piId}`, {
      level: "error",
      tags: { route: "stripe-webhook", step: "payments_upsert" },
      extra: { userId, piId, error: payErr },
    })
  } else {
    wlog("info", "invoice.paid", eventId, {
      step: "payments_upsert",
      userId,
      piId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
    })
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error(JSON.stringify({
      level: "error",
      source: "stripe-webhook",
      event: "init",
      message: "STRIPE_WEBHOOK_SECRET is not set — webhook disabled",
    }))
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get("stripe-signature")

  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      source: "stripe-webhook",
      event: "signature_check",
      error: err instanceof Error ? err.message : "Unknown",
    }))
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const eventId = event.id
  const eventType = event.type

  // ── Idempotency check ────────────────────────────────────────────────────────
  const alreadyDone = await isAlreadyProcessed(eventId)
  if (alreadyDone) {
    wlog("info", eventType, eventId, { action: "skipped", reason: "already_processed" })
    return NextResponse.json({ received: true, skipped: true })
  }

  wlog("info", eventType, eventId, { action: "received" })

  // ── Missing service role key — critical alert ─────────────────────────────
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    wlog("error", eventType, eventId, {
      action: "aborted",
      reason: "SUPABASE_SERVICE_ROLE_KEY_missing",
      critical: true,
      impact: "upgrade_lost",
    })
    Sentry.captureMessage("[webhook] SUPABASE_SERVICE_ROLE_KEY missing — upgrade silently dropped", {
      level: "fatal",
      tags: { route: "stripe-webhook", eventType },
      extra: { eventId, eventType },
    })
    // Return 200 to stop Stripe from retrying (retries won't help — it's a config error)
    // The dashboard sync endpoint compensates on user return
    return NextResponse.json({
      received: true,
      warning: "DB sync skipped — SUPABASE_SERVICE_ROLE_KEY missing. Add to env vars immediately.",
    })
  }

  try {
    switch (eventType) {

      // ── checkout.session.completed ────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id

        wlog("info", eventType, eventId, {
          sessionId: session.id,
          userId: userId ?? null,
          hasSubscription: !!session.subscription,
          metadataKeys: Object.keys(session.metadata ?? {}),
        })

        if (!userId) {
          wlog("warn", eventType, eventId, {
            step: "user_lookup",
            sessionId: session.id,
            reason: "supabase_user_id_missing_from_metadata",
          })
          Sentry.captureMessage("[webhook] checkout.session.completed — supabase_user_id missing from metadata", {
            level: "warning",
            tags: { route: "stripe-webhook", eventType },
            extra: { eventId, sessionId: session.id, metadata: session.metadata },
          })
          await recordWebhookEvent({ id: eventId, type: eventType, status: "no_user", stripeObjectId: session.id })
          break
        }

        if (!session.subscription) {
          wlog("warn", eventType, eventId, {
            step: "subscription_lookup",
            userId,
            reason: "no_subscription_on_session",
          })
          await recordWebhookEvent({ id: eventId, type: eventType, status: "skipped", userId, stripeObjectId: session.id })
          break
        }

        const sub = await stripe.subscriptions.retrieve(session.subscription as string) as Sub
        const plan = sub.metadata?.plan
          ?? PRICE_TO_PLAN[sub.items.data[0]?.price.id ?? ""]
          ?? "pro"

        wlog("info", eventType, eventId, {
          step: "upgrade_start",
          userId,
          plan,
          subId: sub.id,
          subStatus: sub.status,
          priceId: sub.items.data[0]?.price.id ?? null,
        })

        await upsertSubscription(sub, userId, plan, eventId)

        wlog("info", eventType, eventId, {
          step: "upgrade_done",
          userId,
          plan,
          subId: sub.id,
        })

        await recordWebhookEvent({
          id: eventId, type: eventType, status: "processed",
          userId, stripeObjectId: sub.id, plan,
          metadata: { sessionId: session.id, subStatus: sub.status },
        })
        break
      }

      // ── customer.subscription.created / updated ───────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Sub
        const userId = sub.metadata?.supabase_user_id
        const plan = sub.metadata?.plan
          ?? PRICE_TO_PLAN[sub.items.data[0]?.price.id ?? ""]
          ?? "pro"

        const customerId = typeof sub.customer === "string"
          ? sub.customer
          : (sub.customer as { id: string } | null)?.id

        wlog("info", eventType, eventId, {
          subId: sub.id,
          subStatus: sub.status,
          userId: userId ?? null,
          plan,
          customerId: customerId ?? null,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        })

        if (!userId) {
          wlog("warn", eventType, eventId, {
            step: "user_lookup",
            subId: sub.id,
            reason: "supabase_user_id_missing_from_sub_metadata",
          })
          Sentry.captureMessage(`[webhook] ${eventType} — supabase_user_id missing from subscription metadata`, {
            level: "warning",
            tags: { route: "stripe-webhook", eventType },
            extra: { eventId, subId: sub.id, metadata: sub.metadata },
          })
          await recordWebhookEvent({
            id: eventId, type: eventType, status: "no_user",
            stripeCustomer: customerId, stripeObjectId: sub.id, plan,
          })
          break
        }

        await upsertSubscription(sub, userId, plan, eventId)

        wlog("info", eventType, eventId, {
          step: "subscription_synced",
          userId,
          plan,
          subId: sub.id,
          subStatus: sub.status,
        })

        await recordWebhookEvent({
          id: eventId, type: eventType, status: "processed",
          userId, stripeCustomer: customerId, stripeObjectId: sub.id, plan,
          metadata: { subStatus: sub.status, cancelAtPeriodEnd: sub.cancel_at_period_end },
        })
        break
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Sub
        const userId = sub.metadata?.supabase_user_id
        const customerId = typeof sub.customer === "string"
          ? sub.customer
          : (sub.customer as { id: string } | null)?.id

        wlog("info", eventType, eventId, {
          subId: sub.id,
          userId: userId ?? null,
          customerId: customerId ?? null,
        })

        if (!userId) {
          wlog("warn", eventType, eventId, {
            step: "user_lookup",
            subId: sub.id,
            reason: "supabase_user_id_missing_from_deleted_sub_metadata",
          })
          await recordWebhookEvent({
            id: eventId, type: eventType, status: "no_user",
            stripeCustomer: customerId, stripeObjectId: sub.id,
          })
          break
        }

        const db = getAdmin()

        const { error: subDelErr } = await db.from("subscriptions").update({
          status:     "canceled",
          canceled_at: new Date().toISOString(),
          updated_at:  new Date().toISOString(),
        }).eq("id", sub.id)

        if (subDelErr) {
          wlog("error", eventType, eventId, {
            step: "subscriptions_update",
            userId,
            subId: sub.id,
            error: subDelErr.message,
          })
        }

        const { error: profileDelErr } = await db.from("profiles").update({
          plan:                   "free",
          stripe_subscription_id: null,
          updated_at:             new Date().toISOString(),
        }).eq("id", userId)

        if (profileDelErr) {
          wlog("error", eventType, eventId, {
            step: "profiles_downgrade",
            userId,
            error: profileDelErr.message,
          })
          Sentry.captureMessage(`[webhook] subscription.deleted — profiles downgrade failed for ${userId}`, {
            level: "error",
            tags: { route: "stripe-webhook", eventType },
            extra: { eventId, userId, subId: sub.id, error: profileDelErr },
          })
        } else {
          wlog("info", eventType, eventId, {
            step: "downgrade_done",
            userId,
            subId: sub.id,
          })
        }

        await recordWebhookEvent({
          id: eventId, type: eventType, status: profileDelErr ? "failed" : "processed",
          userId, stripeCustomer: customerId, stripeObjectId: sub.id, plan: "free",
          errorMessage: profileDelErr?.message ?? null,
        })
        break
      }

      // ── invoice.paid ──────────────────────────────────────────────────────
      case "invoice.paid": {
        const invoice = event.data.object as Inv
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id

        wlog("info", eventType, eventId, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          customerId: customerId ?? null,
        })

        if (!customerId) {
          wlog("warn", eventType, eventId, {
            step: "customer_lookup",
            reason: "no_customer_id_on_invoice",
            invoiceId: invoice.id,
          })
          await recordWebhookEvent({ id: eventId, type: eventType, status: "no_user", stripeObjectId: invoice.id })
          break
        }

        const db = getAdmin()
        const { data: profile, error: lookupErr } = await db
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (lookupErr || !profile) {
          wlog("warn", eventType, eventId, {
            step: "user_lookup_by_customer",
            customerId,
            invoiceId: invoice.id,
            reason: lookupErr ? lookupErr.message : "no_profile_for_customer",
          })
          await recordWebhookEvent({
            id: eventId, type: eventType, status: "no_user",
            stripeCustomer: customerId, stripeObjectId: invoice.id,
            errorMessage: lookupErr?.message ?? "no_profile_for_customer",
          })
          break
        }

        await recordPayment(invoice, profile.id, eventId)

        await recordWebhookEvent({
          id: eventId, type: eventType, status: "processed",
          userId: profile.id, stripeCustomer: customerId, stripeObjectId: invoice.id,
          metadata: { amount: invoice.amount_paid, currency: invoice.currency, invoiceNumber: invoice.number },
        })
        break
      }

      // ── invoice.payment_failed ────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Inv
        const customerId = typeof invoice.customer === "string"
          ? invoice.customer
          : invoice.customer?.id
        const invoiceSubId = typeof invoice.subscription === "string" ? invoice.subscription : null

        wlog("warn", eventType, eventId, {
          invoiceId: invoice.id,
          invoiceNumber: invoice.number,
          amount: invoice.amount_due,
          currency: invoice.currency,
          customerId: customerId ?? null,
          subId: invoiceSubId,
        })

        Sentry.captureMessage(`[webhook] invoice.payment_failed — customer ${customerId}`, {
          level: "warning",
          tags: { route: "stripe-webhook", eventType },
          extra: { eventId, customerId, invoiceId: invoice.id, amount: invoice.amount_due },
        })

        if (!customerId) {
          await recordWebhookEvent({ id: eventId, type: eventType, status: "no_user", stripeObjectId: invoice.id })
          break
        }

        const db = getAdmin()
        const { data: profile } = await db
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", customerId)
          .single()

        if (!profile) {
          await recordWebhookEvent({
            id: eventId, type: eventType, status: "no_user",
            stripeCustomer: customerId, stripeObjectId: invoice.id,
          })
          break
        }

        if (invoiceSubId) {
          await db.from("subscriptions").update({
            status:     "past_due",
            updated_at: new Date().toISOString(),
          }).eq("id", invoiceSubId)
        }

        await db.from("payments").upsert(
          {
            id:              `failed_${invoice.id}`,
            user_id:         profile.id,
            subscription_id: invoiceSubId,
            amount:          invoice.amount_due,
            currency:        invoice.currency,
            status:          "failed",
            description:     `Paiement échoué — ${invoice.number}`,
            created_at:      new Date().toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: true }
        )

        wlog("warn", eventType, eventId, {
          step: "payment_failure_recorded",
          userId: profile.id,
          subId: invoiceSubId,
          amount: invoice.amount_due,
        })

        await recordWebhookEvent({
          id: eventId, type: eventType, status: "processed",
          userId: profile.id, stripeCustomer: customerId, stripeObjectId: invoice.id,
          errorMessage: "payment_failed",
          metadata: { amount: invoice.amount_due, invoiceNumber: invoice.number },
        })
        break
      }

      default:
        wlog("info", eventType, eventId, { action: "unhandled_event_type" })
        break
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"

    wlog("error", eventType, eventId, {
      action: "handler_crash",
      error: msg,
    })

    Sentry.captureException(err, {
      tags: { route: "stripe-webhook", eventType },
      extra: { eventId, eventType },
    })

    // Record failed event for observability
    try {
      await recordWebhookEvent({
        id: eventId, type: eventType, status: "failed",
        errorMessage: msg,
      })
    } catch {
      // Ignore — already in error state
    }

    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

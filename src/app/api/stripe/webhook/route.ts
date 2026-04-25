import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"
import type Stripe from "stripe"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Sub = Stripe.Subscription & Record<string, any>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Inv = Stripe.Invoice & Record<string, any>

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

// Resolve plan from price ID → plan name
const PRICE_TO_PLAN: Record<string, string> = Object.fromEntries(
  [
    [process.env.STRIPE_PRICE_PRO_MONTHLY,     "pro"],
    [process.env.STRIPE_PRICE_PRO_YEARLY,      "pro"],
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY, "premium"],
    [process.env.STRIPE_PRICE_PREMIUM_YEARLY,  "premium"],
  ].filter(([k]) => k) as [string, string][]
)

async function upsertSubscription(sub: Sub, userId: string, plan: string) {
  const db = getAdmin()

  const isActive = sub.status === "active" || sub.status === "trialing"
  // Stripe customer field can be a string ID or an expanded Customer object
  const customerId = typeof sub.customer === "string"
    ? sub.customer
    : (sub.customer as { id: string } | null)?.id

  // 1. Ensure profile row exists (UPSERT) — critical if trigger never fired
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
    console.error("[webhook] profiles upsert error:", profileErr)
  }

  // 2. Upsert subscription row (FK to profiles — must run after profile upsert)
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
    console.error("[webhook] subscriptions upsert error:", subErr)
  }
}

async function recordPayment(invoice: Inv, userId: string) {
  const paymentIntent = invoice.payment_intent
  if (!paymentIntent || invoice.status !== "paid") return

  const db = getAdmin()
  const piId = typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id
  if (!piId) return

  await db.from("payments").upsert(
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
}

export async function POST(request: Request) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
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
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        // metadata is set on the session itself via subscription_data.metadata at checkout creation
        const userId = session.metadata?.supabase_user_id

        if (userId && session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string) as Sub
          const plan = sub.metadata?.plan
            ?? PRICE_TO_PLAN[sub.items.data[0]?.price.id ?? ""]
            ?? "pro"
          await upsertSubscription(sub, userId, plan)
        }
        break
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Sub
        const userId = sub.metadata?.supabase_user_id
        const plan = sub.metadata?.plan
          ?? PRICE_TO_PLAN[sub.items.data[0]?.price.id ?? ""]
          ?? "pro"
        if (userId) await upsertSubscription(sub, userId, plan)
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Sub
        const userId = sub.metadata?.supabase_user_id
        if (userId) {
          const db = getAdmin()
          await db.from("subscriptions").update({
            status: "canceled",
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", sub.id)
          await db.from("profiles").update({
            plan: "free",
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq("id", userId)
        }
        break
      }

      case "invoice.paid": {
        const invoice = event.data.object as Inv
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
        if (customerId) {
          const db = getAdmin()
          const { data: profile } = await db
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single()
          if (profile) await recordPayment(invoice, profile.id)
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Inv
        const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
        const invoiceSubId = typeof invoice.subscription === "string" ? invoice.subscription : null
        if (customerId) {
          const db = getAdmin()
          const { data: profile } = await db
            .from("profiles")
            .select("id")
            .eq("stripe_customer_id", customerId)
            .single()
          if (profile) {
            // Mark subscription past_due (Stripe also fires customer.subscription.updated but being explicit is safer)
            if (invoiceSubId) {
              await db.from("subscriptions").update({
                status: "past_due",
                updated_at: new Date().toISOString(),
              }).eq("id", invoiceSubId)
            }
            await db.from("payments").upsert(
              {
                id: `failed_${invoice.id}`,
                user_id: profile.id,
                subscription_id: invoiceSubId,
                amount: invoice.amount_due,
                currency: invoice.currency,
                status: "failed",
                description: `Paiement échoué — ${invoice.number}`,
                created_at: new Date().toISOString(),
              },
              { onConflict: "id", ignoreDuplicates: true }
            )
          }
        }
        break
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error(`Webhook handler error [${event.type}]:`, msg)
    // If service role key is missing, return 200 to avoid Stripe retries
    // The dashboard sync endpoint handles this case on user return
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      console.warn("Webhook received but DB writes skipped — add SUPABASE_SERVICE_ROLE_KEY to env")
      return NextResponse.json({ received: true, warning: "DB sync skipped — missing service key" })
    }
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

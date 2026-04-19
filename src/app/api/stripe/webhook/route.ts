import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createServerClient } from "@supabase/ssr"
import type Stripe from "stripe"

function getSupabaseAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

async function updateUserPlan(userId: string, plan: string, subscriptionId: string) {
  const supabase = getSupabaseAdmin()
  await supabase
    .from("profiles")
    .update({
      plan,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error("Webhook signature failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.supabase_user_id
      const plan = session.metadata?.plan
      if (userId && plan && session.subscription) {
        await updateUserPlan(userId, plan, session.subscription as string)
      }
      break
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      const plan = sub.metadata?.plan
      if (userId && plan) {
        const isActive = sub.status === "active" || sub.status === "trialing"
        await updateUserPlan(userId, isActive ? plan : "free", sub.id)
      }
      break
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.supabase_user_id
      if (userId) {
        const supabase = getSupabaseAdmin()
        await supabase
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", userId)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}

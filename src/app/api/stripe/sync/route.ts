import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"

const PRICE_TO_PLAN: Record<string, string> = {
  [process.env.STRIPE_PRICE_PRO_MONTHLY ?? ""]:     "pro",
  [process.env.STRIPE_PRICE_PRO_YEARLY ?? ""]:      "pro",
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? ""]: "premium",
  [process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? ""]:  "premium",
}

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile?.stripe_customer_id) {
      return NextResponse.json({ synced: false, plan: "free", reason: "no_customer" })
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: profile.stripe_customer_id,
      status: "active",
      limit: 1,
      expand: ["data.default_payment_method"],
    })

    const activeSub = subscriptions.data[0] ?? null

    if (!activeSub) {
      // Check trialing
      const trialSubs = await stripe.subscriptions.list({
        customer: profile.stripe_customer_id,
        status: "trialing",
        limit: 1,
      })
      const trialSub = trialSubs.data[0] ?? null

      if (!trialSub) {
        // No active subscription — ensure profile is free
        await supabase
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null, updated_at: new Date().toISOString() })
          .eq("id", user.id)
        return NextResponse.json({ synced: true, plan: "free" })
      }

      const plan = trialSub.metadata?.plan
        ?? PRICE_TO_PLAN[trialSub.items.data[0]?.price.id ?? ""]
        ?? "pro"

      await syncSubscription(supabase, user.id, trialSub, plan)
      return NextResponse.json({ synced: true, plan })
    }

    const plan = activeSub.metadata?.plan
      ?? PRICE_TO_PLAN[activeSub.items.data[0]?.price.id ?? ""]
      ?? "pro"

    await syncSubscription(supabase, user.id, activeSub, plan)
    return NextResponse.json({ synced: true, plan })
  } catch (error) {
    console.error("Stripe sync error:", error)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}

async function syncSubscription(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sub: any,
  plan: string
) {
  // Update profile.plan (user can always update own profile row)
  await supabase
    .from("profiles")
    .update({
      plan,
      stripe_subscription_id: sub.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  // Upsert subscription row — requires write RLS or service role
  // Will silently fail if RLS blocks it; profile.plan update above is the fallback
  await supabase
    .from("subscriptions")
    .upsert(
      {
        id:                   sub.id,
        user_id:              userId,
        status:               sub.status,
        plan,
        price_id:             sub.items.data[0]?.price.id ?? null,
        quantity:             sub.items.data[0]?.quantity ?? 1,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        current_period_start: sub.current_period_start
          ? new Date(sub.current_period_start * 1000).toISOString()
          : null,
        current_period_end:   sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
        cancel_at:   sub.cancel_at   ? new Date(sub.cancel_at * 1000).toISOString()   : null,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        metadata:    sub.metadata ?? {},
        updated_at:  new Date().toISOString(),
      },
      { onConflict: "id" }
    )
}

import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { resolveAppUrl } from "@/lib/app-url"

type StripePlan = "pro" | "premium"
type BillingCycle = "monthly" | "yearly"

const PRICE_CATALOG = [
  { plan: "pro", billing: "monthly", priceId: process.env.STRIPE_PRICE_PRO_MONTHLY },
  { plan: "pro", billing: "yearly", priceId: process.env.STRIPE_PRICE_PRO_YEARLY },
  { plan: "premium", billing: "monthly", priceId: process.env.STRIPE_PRICE_PREMIUM_MONTHLY },
  { plan: "premium", billing: "yearly", priceId: process.env.STRIPE_PRICE_PREMIUM_YEARLY },
] as const satisfies Array<{ plan: StripePlan; billing: BillingCycle; priceId: string | undefined }>

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { priceId, plan } = await request.json()
    if (!priceId || !plan) {
      return NextResponse.json({ error: "priceId et plan requis" }, { status: 400 })
    }

    const selectedPrice = PRICE_CATALOG.find((entry) => entry.priceId === priceId)
    if (!selectedPrice) {
      console.error("[checkout] unknown price id", {
        userId: user.id,
        plan,
        priceId,
        configuredPrices: PRICE_CATALOG.filter((entry) => entry.priceId).map((entry) => ({
          plan: entry.plan,
          billing: entry.billing,
          priceId: entry.priceId,
        })),
      })
      return NextResponse.json(
        { error: "Le prix Stripe demandé n'est pas configuré côté serveur." },
        { status: 400 }
      )
    }

    if (selectedPrice.plan !== plan) {
      console.error("[checkout] plan mismatch", {
        userId: user.id,
        requestedPlan: plan,
        resolvedPlan: selectedPrice.plan,
        billing: selectedPrice.billing,
        priceId,
      })
      return NextResponse.json(
        { error: "Le plan demandé ne correspond pas au prix Stripe sélectionné." },
        { status: 400 }
      )
    }

    const appUrl = resolveAppUrl(request)
    console.info("[checkout] creating session", {
      userId: user.id,
      plan: selectedPrice.plan,
      billing: selectedPrice.billing,
      priceId,
      appUrl,
      requestUrl: request.url,
      host: request.headers.get("host"),
      forwardedHost: request.headers.get("x-forwarded-host"),
      forwardedProto: request.headers.get("x-forwarded-proto"),
    })

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      locale: "fr",
      success_url: `${appUrl}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
      // metadata on the SESSION itself — read by checkout.session.completed webhook
      metadata: { supabase_user_id: user.id, plan },
      // metadata on the subscription — read by customer.subscription.* webhooks
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: { address: "auto" },
    })

    console.info("[checkout] session created", {
      userId: user.id,
      plan: selectedPrice.plan,
      billing: selectedPrice.billing,
      priceId,
      sessionId: session.id,
      hasUrl: Boolean(session.url),
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[checkout] error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la création du paiement" },
      { status: 500 }
    )
  }
}

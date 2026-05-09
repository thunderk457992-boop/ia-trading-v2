import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { resolveAppUrl } from "@/lib/app-url"

function isMissingStripeCustomerError(error: unknown) {
  return error instanceof Error && /No such customer/i.test(error.message)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifie" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 })
  }

  const appUrl = resolveAppUrl(request)

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${appUrl}/settings`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    if (isMissingStripeCustomerError(error)) {
      const { error: clearError } = await supabase
        .from("profiles")
        .update({
          stripe_customer_id: null,
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (clearError) {
        console.error("[portal] failed to clear stale stripe customer:", clearError)
      }

      console.warn("[portal] stale stripe customer cleared", {
        userId: user.id,
        previousCustomerId: profile.stripe_customer_id,
      })

      return NextResponse.json(
        { error: "Aucun customer Stripe live valide n'est relie a ce compte." },
        { status: 400 }
      )
    }

    const message = error instanceof Error ? error.message : "Erreur serveur"
    console.error("[portal] error:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

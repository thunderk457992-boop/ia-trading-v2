import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"

function getAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

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

    // Use service role to bypass RLS for reliable reads/writes
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? getAdmin() : supabase

    const { data: profile } = await db
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name,
        metadata: { supabase_user_id: user.id },
      })
      customerId = customer.id

      // Upsert profile — creates row if missing, updates if exists
      const { error: upsertError } = await db
        .from("profiles")
        .upsert(
          {
            id: user.id,
            stripe_customer_id: customerId,
            plan: "free",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" }
        )

      if (upsertError) {
        console.error("[checkout] profile upsert error:", upsertError)
      }
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL
      ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
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

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[checkout] error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur lors de la création du paiement" },
      { status: 500 }
    )
  }
}

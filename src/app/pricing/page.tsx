import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PricingClient } from "@/components/PricingClient"

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, stripe_subscription_id")
    .eq("id", user.id)
    .single()

  return (
    <PricingClient
      currentPlan={profile?.plan ?? "free"}
      hasSubscription={!!profile?.stripe_subscription_id}
    />
  )
}

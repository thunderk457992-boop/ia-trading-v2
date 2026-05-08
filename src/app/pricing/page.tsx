import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PricingClient } from "@/components/PricingClient"

export default async function PricingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/pricing")

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, stripe_subscription_id")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const hasActiveSubscription = subscription?.status === "active" || subscription?.status === "trialing"
  const currentPlan = hasActiveSubscription
    ? (subscription.plan ?? profile?.plan ?? "free")
    : (profile?.plan ?? "free")

  return (
    <PricingClient
      currentPlan={currentPlan}
      hasSubscription={hasActiveSubscription || !!profile?.stripe_subscription_id}
    />
  )
}

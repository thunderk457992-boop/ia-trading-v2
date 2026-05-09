import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PricingClient } from "@/components/PricingClient"

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string; success?: string; plan?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login?next=/pricing")
  const params = await searchParams

  const [{ data: profile }, { data: subscription }] = await Promise.all([
    supabase
      .from("profiles")
      .select("plan, stripe_subscription_id, stripe_customer_id")
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
  const hasStripeCustomer = Boolean(profile?.stripe_customer_id)
  const canManageBilling = hasActiveSubscription && hasStripeCustomer
  const currentPlan = canManageBilling
    ? (subscription.plan ?? profile?.plan ?? "free")
    : (profile?.plan ?? "free")

  return (
    <PricingClient
      currentPlan={currentPlan}
      hasSubscription={canManageBilling}
      canManageBilling={canManageBilling}
      showCancelledNotice={params.cancelled === "true"}
      showSuccessNotice={params.success === "true"}
      successPlan={typeof params.plan === "string" ? params.plan : null}
    />
  )
}

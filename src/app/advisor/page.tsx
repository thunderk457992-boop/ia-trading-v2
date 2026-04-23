import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdvisorClient } from "@/components/advisor/AdvisorClient"

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [{ data: profile }, { data: subscription }, { count: monthlyCount }, { data: lastAnalysis }] = await Promise.all([
    supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("ai_analyses")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
    supabase
      .from("ai_analyses")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const plan = subscription?.status === "active" || subscription?.status === "trialing"
    ? (subscription.plan ?? profile?.plan ?? "free")
    : (profile?.plan ?? "free")

  return (
    <AdvisorClient
      userId={user.id}
      plan={plan}
      monthlyCount={monthlyCount ?? 0}
      lastAnalysis={lastAnalysis}
    />
  )
}

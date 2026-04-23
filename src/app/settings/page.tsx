import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/SettingsClient"

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: subscription }, { data: payments }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ])

  return (
    <SettingsClient
      user={user}
      profile={profile}
      subscription={subscription}
      payments={payments ?? []}
    />
  )
}

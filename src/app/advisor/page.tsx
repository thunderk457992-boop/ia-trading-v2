import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdvisorClient } from "@/components/advisor/AdvisorClient"

export default async function AdvisorPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  const { data: lastAnalysis } = await supabase
    .from("ai_analyses")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  return (
    <AdvisorClient
      userId={user.id}
      plan={profile?.plan ?? "free"}
      lastAnalysis={lastAnalysis}
    />
  )
}

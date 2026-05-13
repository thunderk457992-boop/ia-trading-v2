import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export default async function PostLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: latestAnalysis, error } = await supabase
    .from("ai_analyses")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[auth/post-login] failed to inspect analyses", error)
    redirect("/dashboard")
  }

  redirect(latestAnalysis ? "/dashboard" : "/advisor")
}

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/email/templates"

const NEW_USER_WINDOW_MS = 10 * 60 * 1000 // 10 minutes — window to detect fresh signup

export default async function PostLoginPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const [{ data: latestAnalysis, error }, { data: profile }] = await Promise.all([
    supabase
      .from("ai_analyses")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("full_name, welcome_email_sent")
      .eq("id", user.id)
      .maybeSingle(),
  ])

  if (error) {
    console.error("[auth/post-login] failed to inspect analyses", error)
    redirect("/dashboard")
  }

  // Detect fresh signup: email confirmed within the last 10 minutes
  // and no prior analyses (avoids re-sending on subsequent logins)
  const emailConfirmedAt = user.email_confirmed_at
    ? new Date(user.email_confirmed_at).getTime()
    : null

  const isFreshSignup =
    emailConfirmedAt !== null &&
    Date.now() - emailConfirmedAt < NEW_USER_WINDOW_MS &&
    !latestAnalysis &&
    !profile?.welcome_email_sent

  if (isFreshSignup && user.email) {
    const firstName = profile?.full_name?.split(" ")[0] ?? undefined
    try {
      await sendWelcomeEmail(user.email, firstName)
      // Mark as sent so we never resend
      await supabase
        .from("profiles")
        .update({ welcome_email_sent: true, updated_at: new Date().toISOString() })
        .eq("id", user.id)
      console.info("[auth/post-login] welcome email sent to", user.email)
    } catch (err) {
      console.warn("[auth/post-login] welcome email failed (silent):", err)
    }
  }

  redirect(latestAnalysis ? "/dashboard" : "/advisor")
}

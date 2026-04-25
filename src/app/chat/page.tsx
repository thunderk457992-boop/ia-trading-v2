import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ChatClient } from "@/components/chat/ChatClient"
import { buildChatUsage, getChatUsage, resolveChatPlan } from "@/lib/chat"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import { buildMarketDecision } from "@/lib/market-agent"

async function loadPersistentChatUsageCount(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startOfMonth.toISOString())

  if (error) return null
  return count ?? 0
}

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: profile }, { data: subscription }, { data: lastAnalysis }, marketSnapshot] = await Promise.all([
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
      .select("created_at, allocations")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    fetchMarketSnapshot(),
  ])

  const plan = resolveChatPlan(
    subscription?.status === "active" || subscription?.status === "trialing"
      ? subscription.plan
      : profile?.plan
  )
  const persistentCount = await loadPersistentChatUsageCount(supabase, user.id)
  const initialUsage = persistentCount === null ? getChatUsage(user.id, plan) : buildChatUsage(plan, persistentCount)

  return (
    <ChatClient
      plan={plan}
      initialUsage={initialUsage}
      latestAnalysisAt={lastAnalysis?.created_at ?? null}
      initialMarketDecision={buildMarketDecision(
        marketSnapshot.prices,
        marketSnapshot.global,
        lastAnalysis?.allocations ?? null
      )}
    />
  )
}

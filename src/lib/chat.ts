export type ChatPlan = "free" | "pro" | "premium"

export interface ChatPlanConfig {
  label: string
  monthlyLimit: number | null
  analysisContextCount: number
  marketContextDepth: "none" | "basic" | "advanced"
  features: string[]
  locked: string[]
  upgradeMessage: string | null
  suggestions: string[]
}

export interface ChatUsage {
  used: number
  limit: number | null
  remaining: number | null
}

interface UsageRecord {
  monthKey: string
  count: number
}

declare global {
  var __axiomChatUsageStore: Map<string, UsageRecord> | undefined
  var __axiomChatCooldownStore: Map<string, number> | undefined
}

export const CHAT_REQUEST_COOLDOWN_MS = 2500

export const CHAT_PLAN_CONFIG: Record<ChatPlan, ChatPlanConfig> = {
  free: {
    label: "Free",
    monthlyLimit: 12,
    analysisContextCount: 0,
    marketContextDepth: "none",
    features: [
      "12 messages / mois",
      "Réponses pédagogiques simples",
      "Explications crypto et stratégie de base",
    ],
    locked: [
      "Pas de reprise des analyses personnelles",
      "Pas de lecture marché contextuelle",
      "Pas d'aide avancée sur l'allocation",
    ],
    upgradeMessage: "Passez au Pro pour relier le chat à vos analyses récentes.",
    suggestions: [
      "Je débute, par où commencer ?",
      "C'est quoi le DCA et comment l'utiliser ?",
      "Quelles sont les erreurs à éviter au début ?",
      "Explique-moi BTC et ETH simplement.",
    ],
  },
  pro: {
    label: "Pro",
    monthlyLimit: 120,
    analysisContextCount: 2,
    marketContextDepth: "basic",
    features: [
      "120 messages / mois",
      "Réponses plus détaillées",
      "Contexte des 2 dernières analyses",
      "Lecture marché synthétique",
    ],
    locked: [
      "Pas de contexte étendu sur l'historique complet",
      "Pas de lecture marché approfondie Premium",
    ],
    upgradeMessage: "Passez au Premium pour une lecture de marché plus poussée et plus de contexte.",
    suggestions: [
      "Mon plan est-il trop risqué ?",
      "Fais-moi un plan DCA simple.",
      "Que vérifier cette semaine sur ma stratégie ?",
      "Je veux limiter mes pertes.",
    ],
  },
  premium: {
    label: "Premium",
    monthlyLimit: null,
    analysisContextCount: 5,
    marketContextDepth: "advanced",
    features: [
      "Usage étendu sans quota mensuel dur",
      "Contexte des 5 dernières analyses",
      "Lecture marché enrichie",
      "Aide avancée sur stratégie, allocation et risques",
    ],
    locked: [],
    upgradeMessage: null,
    suggestions: [
      "Mon plan tient-il face au marché actuel ?",
      "Qu'est-ce que j'ajusterais maintenant ?",
      "Points faibles de ma stratégie actuelle.",
      "Comment réduire le risque sans tout vendre ?",
    ],
  },
}

const usageStore = globalThis.__axiomChatUsageStore ?? new Map<string, UsageRecord>()
const cooldownStore = globalThis.__axiomChatCooldownStore ?? new Map<string, number>()

globalThis.__axiomChatUsageStore = usageStore
globalThis.__axiomChatCooldownStore = cooldownStore

export function resolveChatPlan(plan: string | null | undefined): ChatPlan {
  if (plan === "pro" || plan === "premium") return plan
  return "free"
}

function getMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}`
}

function getUsageRecord(userId: string): UsageRecord {
  const monthKey = getMonthKey()
  const existing = usageStore.get(userId)

  if (!existing || existing.monthKey !== monthKey) {
    return { monthKey, count: 0 }
  }

  return existing
}

export function getChatUsage(userId: string, plan: ChatPlan): ChatUsage {
  const record = getUsageRecord(userId)
  return buildChatUsage(plan, record.count)
}

export function buildChatUsage(plan: ChatPlan, used: number): ChatUsage {
  const limit = CHAT_PLAN_CONFIG[plan].monthlyLimit

  return {
    used,
    limit,
    remaining: limit === null ? null : Math.max(limit - used, 0),
  }
}

export function getChatRetryAfterSeconds(userId: string): number {
  const lastCall = cooldownStore.get(userId) ?? 0
  const remainingMs = CHAT_REQUEST_COOLDOWN_MS - (Date.now() - lastCall)
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0
}

export function canUseChat(userId: string, plan: ChatPlan) {
  const usage = getChatUsage(userId, plan)
  const retryAfter = getChatRetryAfterSeconds(userId)

  if (retryAfter > 0) {
    return {
      ok: false,
      status: 429,
      usage,
      upgradeRequired: false,
      error: `Attendez encore ${retryAfter} seconde(s) avant d'envoyer un nouveau message.`,
    }
  }

  if (usage.limit !== null && usage.used >= usage.limit) {
    return {
      ok: false,
      status: 429,
      usage,
      upgradeRequired: plan !== "premium",
      error: `Vous avez atteint la limite de ${usage.limit} message(s) ce mois-ci sur le plan ${CHAT_PLAN_CONFIG[plan].label}.`,
    }
  }

  return {
    ok: true,
    status: 200,
    usage,
    upgradeRequired: false,
    error: null,
  }
}

export function startChatRequest(userId: string) {
  cooldownStore.set(userId, Date.now())
}

export function recordChatUsage(userId: string, plan: ChatPlan): ChatUsage {
  const record = getUsageRecord(userId)

  usageStore.set(userId, {
    monthKey: record.monthKey,
    count: record.count + 1,
  })

  return getChatUsage(userId, plan)
}

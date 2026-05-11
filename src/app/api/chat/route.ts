import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import { buildMarketDecision } from "@/lib/market-agent"
import { fetchKrakenTickers, type KrakenTicker } from "@/lib/kraken"
import {
  CHAT_PLAN_CONFIG,
  buildChatUsage,
  canUseChat,
  recordChatUsage,
  resolveChatPlan,
  startChatRequest,
  type ChatPlan,
} from "@/lib/chat"

export const maxDuration = 45

const MODEL_CONFIG: Record<ChatPlan, { model: string; maxTokens: number }> = {
  free: { model: "claude-haiku-4-5-20251001", maxTokens: 850 },
  pro: { model: "claude-sonnet-4-6", maxTokens: 1500 },
  premium: { model: "claude-opus-4-7", maxTokens: 2400 },
}

interface ChatHistoryMessage {
  role: "user" | "assistant"
  content: string
}

interface AnalysisContextRow {
  created_at: string
  total_score: number | null
  allocations: Array<{ symbol?: string; percentage?: number }> | null
  market_context: string | null
  recommendations: string[] | null
  investor_profile: Record<string, unknown> | null
}

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error("Configuration IA indisponible.")
  return new Anthropic({ apiKey })
}

function sanitizeText(value: unknown, maxLen: number): string {
  return String(value ?? "")
    .replace(/\r/g, "")
    .trim()
    .slice(0, maxLen)
}

function sanitizeHistory(history: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(history)) return []

  return history
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const role = item.role === "assistant" ? "assistant" : "user"
      const content = sanitizeText(item.content, 1200)
      return content ? { role, content } : null
    })
    .filter((item): item is ChatHistoryMessage => item !== null)
    .slice(-8)
}

function formatProfileValue(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value : fallback
}

function formatUsd(value: number): string {
  return value >= 1000
    ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
    : `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
}

function formatCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}

function formatKrakenPrice(value: number): string {
  if (!Number.isFinite(value)) return "n/a"
  return value >= 1000
    ? `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
    : `$${value.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
}

function formatKrakenVolume(value: number): string {
  if (!Number.isFinite(value)) return "n/a"
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`
  return value.toFixed(2)
}

function summarizeAllocations(allocations: AnalysisContextRow["allocations"]): string {
  if (!Array.isArray(allocations) || allocations.length === 0) {
    return "Allocation non disponible"
  }

  return allocations
    .filter((item) => item?.symbol && Number.isFinite(item?.percentage))
    .slice(0, 4)
    .map((item) => `${String(item.symbol).toUpperCase()} ${Number(item.percentage).toFixed(0)}%`)
    .join(", ")
}

function summarizeRecommendations(recommendations: AnalysisContextRow["recommendations"]): string {
  if (!Array.isArray(recommendations) || recommendations.length === 0) {
    return "Pas de recommandation detaillee disponible."
  }

  return recommendations
    .slice(0, 2)
    .map((item) => String(item).trim())
    .filter(Boolean)
    .join(" | ")
}

function summarizeAnalyses(analyses: AnalysisContextRow[]): string {
  if (!analyses.length) return "Aucune analyse personnelle disponible."

  return analyses.map((analysis, index) => {
    const date = new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(analysis.created_at))

    const profile = analysis.investor_profile ?? {}
    const risk = formatProfileValue(profile.riskTolerance, "non precise")
    const horizon = formatProfileValue(profile.horizon, "non precise")
    const objective = formatProfileValue(profile.preciseObjective, "non precise")
    const explanation = sanitizeText(analysis.market_context, 220) || "Contexte non detaille."

    return [
      `Analyse ${index + 1} - ${date}`,
      `- Score: ${analysis.total_score ?? "n/a"}`,
      `- Risque: ${risk}, horizon: ${horizon}`,
      `- Objectif: ${objective}`,
      `- Allocation: ${summarizeAllocations(analysis.allocations)}`,
      `- Synthese: ${explanation}`,
      `- Recommandations: ${summarizeRecommendations(analysis.recommendations)}`,
    ].join("\n")
  }).join("\n\n")
}

function buildMarketContext(plan: ChatPlan, snapshot: Awaited<ReturnType<typeof fetchMarketSnapshot>>): string {
  if (!snapshot.prices.length) return "Donnees de marche temps reel indisponibles pour le moment."

  const btc = snapshot.prices.find((price) => price.symbol === "BTC")
  const eth = snapshot.prices.find((price) => price.symbol === "ETH")
  const leaders = snapshot.prices
    .slice(0, Math.min(plan === "premium" ? 5 : 3, snapshot.prices.length))
    .map((asset) => `${asset.symbol}: ${asset.change24h >= 0 ? "+" : ""}${asset.change24h.toFixed(1)}% 24h`)
    .join(", ")

  const lines = [
    "Contexte marche reel (CoinGecko):",
    btc ? `- BTC: ${formatUsd(btc.price)} | 24h ${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(1)}% | cap ${formatCap(btc.marketCap)} | volume ${formatCap(btc.volume24h)}` : null,
    eth ? `- ETH: ${formatUsd(eth.price)} | 24h ${eth.change24h >= 0 ? "+" : ""}${eth.change24h.toFixed(1)}% | cap ${formatCap(eth.marketCap)} | volume ${formatCap(eth.volume24h)}` : null,
    snapshot.global ? `- Dominance BTC: ${snapshot.global.btcDominance.toFixed(1)}%` : null,
    snapshot.global ? `- Capitalisation totale: ${formatCap(snapshot.global.totalMarketCapUsd)}` : null,
    snapshot.global ? `- Variation marche 24h: ${snapshot.global.change24h >= 0 ? "+" : ""}${snapshot.global.change24h.toFixed(1)}%` : null,
    leaders ? `- Leaders suivis: ${leaders}` : null,
  ].filter(Boolean)

  return lines.join("\n")
}

function buildKrakenContext(tickers: KrakenTicker[]): string {
  if (!tickers.length) return "Flux Kraken indisponible pour le moment."

  return [
    "Flux spot Kraken:",
    ...tickers.slice(0, 4).map((ticker) => {
      const spread = ticker.ask - ticker.bid
      const spreadPct = ticker.bid > 0 ? (spread / ticker.bid) * 100 : 0
      return `- ${ticker.symbol}: spot ${formatKrakenPrice(ticker.price)} | bid ${formatKrakenPrice(ticker.bid)} | ask ${formatKrakenPrice(ticker.ask)} | volume 24h ${formatKrakenVolume(ticker.volume24h)} | spread ${spreadPct.toFixed(3)}%`
    }),
  ].join("\n")
}

function buildProductContext(plan: ChatPlan): string {
  const config = CHAT_PLAN_CONFIG[plan]

  return [
    "Produit disponible dans l'application:",
    "- Dashboard: capital, performance, graph portfolio, statut marche, table CoinGecko.",
    "- Advisor: analyse IA et allocation personnalisee.",
    "- Chat IA: questions libres sur crypto, strategie, produit et plans.",
    "- Kraken Live: prix et mouvements en direct.",
    "- Pricing, Guide et Settings accessibles.",
    `Plan actif: ${config.label}.`,
    `Inclus: ${config.features.join(" ; ")}.`,
    config.locked.length ? `Bloque sur ce plan: ${config.locked.join(" ; ")}.` : "Aucune limitation premium supplementaire.",
  ].join("\n")
}

async function loadPersistentChatUsageCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number | null> {
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", startOfMonth.toISOString())

  if (error) {
    console.warn("Chat persistent usage unavailable:", error.message)
    return null
  }

  return count ?? 0
}

async function persistChatMessages(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userMessage: string,
  assistantReply: string
) {
  const { error } = await supabase
    .from("chat_messages")
    .insert([
      { user_id: userId, role: "user", content: userMessage },
      { user_id: userId, role: "assistant", content: assistantReply },
    ])

  if (error) {
    console.warn("Chat persistence unavailable:", error.message)
    return false
  }

  return true
}

function normalizeAssistantReply(reply: string): string {
  return reply
    .replace(/Non,\s*je ne vais pas vous orienter l[àa]-dessus\.?/gi, "Je peux vous aider a cadrer cela de facon prudente et utile.")
    .replace(/Je ne peux pas donner de conseil financier personnalise\.?/gi, "Je ne donne pas d'ordre d'achat personnalise, mais je peux vous aider a lire le contexte, les risques et les options prudentes.")
    .trim()
}

function buildSystemPrompt(
  plan: ChatPlan,
  analysesSummary: string,
  marketContext: string,
  krakenContext: string,
  productContext: string,
  marketDecisionJson: string,
  marketDataAvailable: boolean,
  advanced: boolean,
  userMemory: string
): string {
  const planNote = plan === "free"
    ? "Plan Free : réponds sans t'appuyer sur l'historique personnel. Si la question nécessite les analyses passées, mentionne que c'est disponible à partir du plan Pro."
    : plan === "pro"
    ? "Plan Pro : tu peux t'appuyer sur les 2 dernières analyses pour personnaliser ta réponse."
    : "Plan Premium : tu peux croiser les analyses récentes avec le contexte de marché pour proposer des pistes concrètes."

  const availabilityNote = marketDataAvailable
    ? "Données de marché disponibles. Utilise les prix et tendances si utile, mais ne les liste pas en bloc brut."
    : "Données de marché indisponibles. Dis-le si nécessaire, n'invente aucun prix."

  const modeRules = advanced
    ? [
        "— MODE AVANCÉ ACTIVÉ —",
        "L'utilisateur veut plus de profondeur. Tu peux :",
        "- Mentionner la dominance BTC, les phases de marché, les risques corrélation",
        "- Proposer jusqu'à 6 actifs dans une répartition",
        "- Expliquer DeFi, Layer 2, cycles de marché si pertinent",
        "- Réponses jusqu'à 250 mots si nécessaire",
        "Garde quand même un style humain et lisible, pas un rapport d'analyste.",
      ]
    : [
        "— MODE SIMPLE (défaut) —",
        "Réponds en 120 à 180 mots maximum. Va à l'essentiel.",
        "Maximum 3 à 4 actifs dans un plan. Priorité à BTC et ETH.",
        "Pas de jargon sans explication. Pas de tableau. Pas de liste interminable.",
      ]

  const memorySection = userMemory
    ? ["— CE QUE TU SAIS DE L'UTILISATEUR (mémoire de session) —", userMemory, "Utilise ces infos naturellement : 'Comme tu investis progressivement…', 'Vu ton objectif long terme…', 'Tu voulais limiter le risque…'", ""]
    : []

  return [
    "Tu es l'assistant crypto d'Axiom AI. Tu aides des débutants à comprendre et structurer leurs investissements crypto.",
    "",
    ...modeRules,
    "",
    "— TON —",
    "Direct, chaleureux, rassurant. Jamais robotique, jamais professoral.",
    "Style : 'Voilà ce que je ferais.', 'Le plus important ici, c'est…', 'À éviter pour l'instant…'",
    "Parfois, une phrase humaine simple fait toute la différence.",
    "Exemple : 'Le plus dur en crypto, c'est souvent de garder son plan.', 'Éviter les décisions impulsives, c'est déjà un énorme avantage.'",
    "",
    "— VOCABULAIRE —",
    "- 'allocation' → 'répartition'",
    "- 'volatilité' → 'ça peut monter ou baisser fort'",
    "- 'liquidité' → 'facile à acheter ou revendre'",
    "- 'exposition' → 'la part de ton argent sur cet actif'",
    "- 'market cap' → 'taille du projet'",
    "- 'momentum' → 'tendance récente'",
    "BTC, ETH, SOL, DCA sont OK. Le reste, explique-le simplement.",
    "",
    "— BLOCS STRUCTURÉS (très important) —",
    "Quand tu proposes une répartition concrète, place ce bloc EXACTEMENT à la fin de ta réponse texte :",
    '[PORTFOLIO]{"assets":[{"symbol":"BTC","pct":60,"role":"Base stable","why":"Bitcoin est la plus grande crypto, la plus liquide et la moins volatile des grandes."},{"symbol":"ETH","pct":30,"role":"Écosystème","why":"Ethereum est incontournable — des milliers de projets reposent dessus."},{"symbol":"SOL","pct":10,"role":"Part dynamique","why":"Solana peut monter fort, mais aussi baisser vite. Part limitée."}],"avoid":["memecoins","plus de 5 actifs différents au début"],"profile":"débutant prudent"}[/PORTFOLIO]',
    "",
    "Quand tu proposes un plan DCA concret, place ce bloc EXACTEMENT à la fin :",
    '[DCA]{"total":50,"frequency":"weekly","breakdown":[{"symbol":"BTC","amount":35},{"symbol":"ETH","amount":15}],"note":"Étale tes achats pour réduire l\'impact des variations de prix."}[/DCA]',
    "",
    "Règles blocs :",
    "- Un seul bloc par réponse maximum (PORTFOLIO OU DCA, pas les deux).",
    "- JSON sur une seule ligne, valide, sans commentaires.",
    "- Mets le bloc APRÈS le texte explicatif, jamais au milieu.",
    "- N'utilise ces blocs QUE quand tu proposes une répartition ou un plan concret.",
    "- Si tu expliques juste un concept, ne mets aucun bloc.",
    "- Les pourcentages des assets doivent totaliser exactement 100.",
    "",
    "— ACTION CONCRÈTE —",
    "Chaque réponse se termine par une action claire.",
    "Ex : 'Commence par 70% BTC/ETH.', 'Mets 20€ par semaine plutôt que 100€ d'un coup.', 'Évite les memecoins si tu débutes.'",
    "",
    "— INTERDIT ABSOLU —",
    "Ne jamais répondre 'Non, je ne vais pas vous orienter là-dessus.'",
    "Ne jamais promettre des gains ou des rendements.",
    "Ne jamais inventer de données ou de prix.",
    "",
    ...memorySection,
    planNote,
    availabilityNote,
    "",
    "CONTEXTE PERSONNEL (analyses récentes) :",
    analysesSummary,
    "",
    "CONTEXTE MARCHÉ :",
    marketContext,
    "",
    "SIGNAL KRAKEN :",
    krakenContext,
    "",
    "MOTEUR DE DÉCISION :",
    marketDecisionJson,
    "",
    "PRODUIT :",
    productContext,
  ].join("\n")
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifie." }, { status: 401 })
    }

    const body = await request.json()
    const message     = sanitizeText(body?.message, 1500)
    const history     = sanitizeHistory(body?.history)
    const advanced    = body?.advanced === true
    const userMemory  = sanitizeText(body?.userMemory, 400)

    if (!message) {
      return NextResponse.json({ error: "Le message est vide." }, { status: 400 })
    }

    const [{ data: profile }, { data: activeSubscription }] = await Promise.all([
      supabase.from("profiles").select("plan").eq("id", user.id).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .in("status", ["active", "trialing"])
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    const plan = resolveChatPlan(
      activeSubscription?.status === "active" || activeSubscription?.status === "trialing"
        ? activeSubscription.plan
        : profile?.plan
    )

    const access = canUseChat(user.id, plan)
    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.error,
          upgradeRequired: access.upgradeRequired,
          usage: access.usage,
          plan,
        },
        { status: access.status }
      )
    }

    const persistentCount = await loadPersistentChatUsageCount(supabase, user.id)
    const persistentUsage = persistentCount === null ? null : buildChatUsage(plan, persistentCount)

    if (persistentUsage && persistentUsage.limit !== null && persistentUsage.used >= persistentUsage.limit) {
      return NextResponse.json(
        {
          error: `Quota de ${persistentUsage.limit} message(s) atteint pour ce mois sur le plan ${CHAT_PLAN_CONFIG[plan].label}.`,
          upgradeRequired: plan !== "premium",
          usage: persistentUsage,
          plan,
        },
        { status: 429 }
      )
    }

    startChatRequest(user.id)

    const planConfig = CHAT_PLAN_CONFIG[plan]
    const [{ data: recentAnalyses }, marketSnapshot, krakenTickers] = await Promise.all([
      planConfig.analysisContextCount > 0
        ? supabase
            .from("ai_analyses")
            .select("created_at, total_score, allocations, market_context, recommendations, investor_profile")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(planConfig.analysisContextCount)
        : Promise.resolve({ data: [] as AnalysisContextRow[] }),
      fetchMarketSnapshot(),
      fetchKrakenTickers().catch(() => [] as KrakenTicker[]),
    ])

    const latestAllocations = recentAnalyses?.[0]?.allocations ?? null
    const marketDecision = buildMarketDecision(marketSnapshot.prices, marketSnapshot.global, latestAllocations)
    const coinGeckoAvailable = marketSnapshot.prices.length > 0
    const krakenAvailable = krakenTickers.length > 0
    const marketDataAvailable = coinGeckoAvailable || krakenAvailable
    const analysesSummary = recentAnalyses?.length
      ? summarizeAnalyses(recentAnalyses as AnalysisContextRow[])
      : "Aucune analyse personnelle disponible."

    const baseMaxTokens = MODEL_CONFIG[plan].maxTokens
    const response = await getAnthropic().messages.create({
      model: MODEL_CONFIG[plan].model,
      max_tokens: advanced ? Math.min(baseMaxTokens + 400, 3000) : baseMaxTokens,
      system: buildSystemPrompt(
        plan,
        analysesSummary,
        buildMarketContext(plan, marketSnapshot),
        buildKrakenContext(krakenTickers),
        buildProductContext(plan),
        JSON.stringify(marketDecision, null, 2),
        marketDataAvailable,
        advanced,
        userMemory
      ),
      messages: [
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        {
          role: "user" as const,
          content: message,
        },
      ],
    })

    const textBlock = response.content.find((block) => block.type === "text")
    if (!textBlock || textBlock.type !== "text" || !textBlock.text.trim()) {
      throw new Error("Reponse IA vide.")
    }

    const reply = normalizeAssistantReply(textBlock.text)
    const persisted = await persistChatMessages(supabase, user.id, message, reply)

    const fallbackUsage = recordChatUsage(user.id, plan)
    const usage = persistentUsage && persisted ? buildChatUsage(plan, persistentUsage.used + 1) : fallbackUsage

    return NextResponse.json({
      reply,
      plan,
      usage,
      context: {
        analyses: recentAnalyses?.length ?? 0,
        market: marketDataAvailable,
      },
      marketDecision,
      marketDataAvailable,
      marketSources: { coinGecko: coinGeckoAvailable, kraken: krakenAvailable },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur IA inattendue." },
      { status: 500 }
    )
  }
}

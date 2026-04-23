import { NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import type { CryptoPrice, MarketGlobal } from "@/lib/coingecko"

export const maxDuration = 60

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  pro: 20,
  premium: -1,
}

const MODEL_CONFIG: Record<string, { model: string; maxTokens: number; thinking: boolean }> = {
  free:    { model: "claude-haiku-4-5-20251001", maxTokens: 1600, thinking: false },
  pro:     { model: "claude-sonnet-4-6",         maxTokens: 3500, thinking: false },
  premium: { model: "claude-opus-4-7",           maxTokens: 6000, thinking: true  },
}

const cooldowns = new Map<string, number>()
const COOLDOWN_MS = 20_000

interface AllocationItem {
  asset: string
  percentage: number
  note?: string
}

interface ExecutionItem  { crypto: string; amount: string }
interface LaterItem     { crypto: string; condition: string }
interface TimePlanItem  { period: string; action: string }
interface ProjectionItem { scenario: string; outcome: string }

interface AnalysisResult {
  score: number
  risk: "faible" | "modéré" | "élevé"
  allocation: AllocationItem[]
  plan: string[]
  explanation: string
  marketSignal?: string
  entryStrategy?: string
  rebalanceNote?: string
  pedagogy?: string
  executionNow?: ExecutionItem[]
  executionLater?: LaterItem[]
  nextReview?: string
  marketVerdict?: "favorable" | "neutre" | "risqué"
  marketVerdictNote?: string
  marketInsight?: string
  errorsToAvoid?: string[]
  timePlan?: TimePlanItem[]
  aiSignature?: string
  projection?: ProjectionItem[]
  disclaimer: string
}

function sanitize(s: unknown, maxLen = 300): string {
  return String(s ?? "").replace(/[<>{}$\\]/g, "").slice(0, maxLen).trim()
}

function fmtPrice(price: number): string {
  if (price >= 1000) return `$${Math.round(price).toLocaleString("en-US")}`
  if (price >= 1) return `$${price.toFixed(2)}`
  return `$${price.toFixed(4)}`
}

function buildMarketContext(
  prices: CryptoPrice[],
  global: MarketGlobal | null,
  level: "basic" | "standard" | "full"
): string {
  if (!prices.length) return "Données de marché indisponibles."

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
  const btc = prices.find(p => p.symbol === "BTC")
  const eth = prices.find(p => p.symbol === "ETH")
  const sol = prices.find(p => p.symbol === "SOL")

  const avgChange = prices.reduce((s, p) => s + p.change24h, 0) / prices.length
  const sentiment = avgChange > 3 ? "très haussier"
    : avgChange > 0.5 ? "haussier"
    : avgChange > -0.5 ? "neutre"
    : avgChange > -3 ? "baissier"
    : "très baissier"

  const topGainers = [...prices].sort((a, b) => b.change24h - a.change24h).slice(0, 2)
  const topLoser = [...prices].sort((a, b) => a.change24h - b.change24h)[0]

  if (level === "basic") {
    return [
      `DONNÉES MARCHÉ (${date}):`,
      btc ? `BTC: ${fmtPrice(btc.price)} (${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(1)}% 24h)` : "",
      eth ? `ETH: ${fmtPrice(eth.price)} (${eth.change24h >= 0 ? "+" : ""}${eth.change24h.toFixed(1)}% 24h)` : "",
      `Sentiment global: ${sentiment}`,
    ].filter(Boolean).join("\n")
  }

  if (level === "standard") {
    const domCtx = !global ? "" :
      global.btcDominance > 55 ? ` → marché risk-off, privilégier BTC/ETH` :
      global.btcDominance < 45 ? ` → potentiel alt season, vigilance altcoins` :
      ` → équilibré`
    return [
      `MARCHÉ EN TEMPS RÉEL (${date}):`,
      btc ? `- BTC: ${fmtPrice(btc.price)} (24h: ${btc.change24h >= 0 ? "+" : ""}${btc.change24h.toFixed(1)}%, 7j: ${btc.change7d >= 0 ? "+" : ""}${btc.change7d.toFixed(1)}%)` : "",
      eth ? `- ETH: ${fmtPrice(eth.price)} (24h: ${eth.change24h >= 0 ? "+" : ""}${eth.change24h.toFixed(1)}%, 7j: ${eth.change7d >= 0 ? "+" : ""}${eth.change7d.toFixed(1)}%)` : "",
      sol ? `- SOL: ${fmtPrice(sol.price)} (24h: ${sol.change24h >= 0 ? "+" : ""}${sol.change24h.toFixed(1)}%)` : "",
      `- Sentiment 24h: ${sentiment} (moyenne: ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(1)}%)`,
      `- Meilleurs actifs 24h: ${topGainers.map(p => `${p.symbol} ${p.change24h >= 0 ? "+" : ""}${p.change24h.toFixed(1)}%`).join(", ")}`,
      global ? `- Cap. totale: $${(global.totalMarketCapUsd / 1e12).toFixed(2)}T (${global.change24h >= 0 ? "+" : ""}${global.change24h.toFixed(1)}% 24h)` : "",
      global ? `- Dominance BTC: ${global.btcDominance.toFixed(1)}%${domCtx}` : "",
    ].filter(Boolean).join("\n")
  }

  // full
  const phase = avgChange > 5 ? "expansion rapide (risque de correction à court terme)"
    : avgChange > 1.5 ? "tendance haussière modérée (conditions favorables)"
    : avgChange > -1.5 ? "consolidation (accumulation stratégique possible)"
    : avgChange > -5 ? "correction (entrées progressives conseillées)"
    : "baisse intense (DCA strict, position défensive)"

  const btcDomNote = !global ? "" :
    global.btcDominance > 58 ? "Dominance BTC élevée — capital en risk-off, altcoins sous pression significative" :
    global.btcDominance > 52 ? "Dominance BTC haute — préférer BTC/ETH, altcoins sélectifs" :
    global.btcDominance > 46 ? "Dominance BTC modérée — fenêtre pour Layer 1 de qualité" :
    "Dominance BTC basse — alt season probable, risque accru sur micro-caps"

  return [
    `ANALYSE DE MARCHÉ COMPLÈTE (${date}):`,
    "",
    "PRIX ET MOMENTUM:",
    ...prices.slice(0, 7).map(p =>
      `  ${p.symbol}: ${fmtPrice(p.price)} | 24h: ${p.change24h >= 0 ? "+" : ""}${p.change24h.toFixed(1)}% | 7j: ${p.change7d >= 0 ? "+" : ""}${p.change7d.toFixed(1)}%`
    ),
    "",
    "LECTURE MARCHÉ:",
    `  Phase: ${phase}`,
    `  Sentiment 24h: ${sentiment} (moy: ${avgChange >= 0 ? "+" : ""}${avgChange.toFixed(1)}%)`,
    global ? `  Cap. totale: $${(global.totalMarketCapUsd / 1e12).toFixed(2)}T (${global.change24h >= 0 ? "+" : ""}${global.change24h.toFixed(1)}% 24h)` : "",
    global ? `  Dominance BTC: ${global.btcDominance.toFixed(1)}%` : "",
    btcDomNote ? `  → ${btcDomNote}` : "",
    "",
    "MOMENTUM RELATIF:",
    `  Surperformance: ${topGainers.map(p => `${p.symbol} +${p.change24h.toFixed(1)}%`).join(", ")}`,
    topLoser.change24h < -1 ? `  Sous-performance: ${topLoser.symbol} ${topLoser.change24h.toFixed(1)}%` : "",
  ].filter(Boolean).join("\n")
}

const STYLE_RULES = `
STYLE D'ÉCRITURE OBLIGATOIRE — à respecter impérativement:
× Interdits: "il est recommandé de", "il convient de", "dans ce contexte", "il est important", "la volatilité inhérente", "il faut noter que", "comme mentionné", "en conclusion", "en résumé", "il est essentiel"
× Interdits: formules vagues applicables à n'importe quel profil
× Interdits: phrases débutant par "L'investissement en cryptomonnaies présente..."
✓ Style direct, court, chiffré — comme un analyste senior
✓ Citer les prix ou variations réelles fournis dans les données de marché quand pertinent
✓ Justifications spécifiques au profil ET au contexte de marché du moment
✓ Chaque phrase doit apporter une information que l'autre n'apporte pas`

const MARKET_LOGIC = `
LOGIQUE MARCHÉ OBLIGATOIRE — chaque décision repose sur ces principes:
× Dominance BTC: > 55% → risk-off, capitaux concentrés sur BTC/ETH, altcoins sous pression; < 45% → rotation possible vers altcoins
× Capitalisation: BTC/ETH = socle de portefeuille (liquidité + résilience); altcoins = rendement supplémentaire + risque accru
× Volatilité: inversement proportionnelle à la cap. — petite cap = risque élevé, position réduite
× Corrélation: en phase de correction, tout converge vers 1 — la diversification ne protège pas en crash brutal
× Cycle marché: adapter l'exposition à la phase (expansion → offensif; consolidation → neutre; correction → défensif)
× Liquidité: top 20 CoinGecko uniquement — garantit la sortie de position sans slippage
× Adoption: projets à utilité réelle (L1 établis, infrastructure DeFi) > spéculation pure

Ces principes DOIVENT justifier chaque allocation et apparaître dans l'explication.

EXPLICATIONS ORIENTÉES DÉCISION UNIQUEMENT:
✓ Pourquoi CET actif maintenant — lier au contexte marché réel et au profil
✓ Où est le risque — actif précis + condition de marché
✓ Comment agir concrètement — timing, montant, condition
✗ Pas d'explication sur la blockchain, le minage, ou la cryptographie
✗ Pas de théorie sans lien direct avec la décision présente
✗ Zéro formule mathématique complexe`

function buildPrompt(
  plan: string,
  p: {
    riskLabel: string; horizonLabel: string
    cleanCapital: string; cleanMonthly: string
    cleanGoals: string; cleanExcluded: string
    cleanExperience: string; cleanStrategy: string
    cleanExpLevel: string
  },
  marketCtx: string
): string {
  const { riskLabel, horizonLabel, cleanCapital, cleanMonthly, cleanGoals, cleanExcluded, cleanExperience, cleanStrategy, cleanExpLevel } = p

  const pedagogyInstruction = cleanExpLevel === "beginner"
    ? "3-4 phrases simples, zéro jargon: (1) pourquoi CES actifs précisément et pas d'autres, (2) où est le risque pour ce profil, (3) comment agir en pratique. Aucune explication sur la blockchain ou la cryptographie."
    : cleanExpLevel === "expert"
    ? "2-3 lignes techniques: relier la dominance BTC observée au flux de capitaux, justifier la phase de cycle, valider la logique risk-adjusted du portefeuille. Uniquement ce qui est utile à la décision."
    : "3-4 phrases: relier l'allocation au cycle de marché actuel et à la dominance BTC. Expliquer le risque spécifique de ce profil. Terminologie technique permise, théorie inutile exclue."

  const planAdaptation = cleanExpLevel === "beginner"
    ? "ADAPTE le langage du plan pour un débutant: mots simples, actions concrètes (acheter/attendre/revoir), rassurer. Zéro jargon."
    : cleanExpLevel === "expert"
    ? "ADAPTE le plan pour un expert: direct, chiffré, technique. Market bias, execution triggers, risk management."
    : "ADAPTE le plan pour un investisseur intermédiaire: terminologie technique OK, logique claire, chiffres précis."

  if (plan === "free") {
    return `Tu es un analyste crypto. Génère une allocation concise et directement utilisable.

PROFIL:
- Risque: ${riskLabel}
- Horizon: ${horizonLabel}
- Expérience: ${cleanExperience}
- Stratégie: ${cleanStrategy}
- Capital: ${cleanCapital}€
- Objectifs: ${cleanGoals}
${cleanExcluded ? `- Exclusions: ${cleanExcluded}` : ""}

${marketCtx}
${STYLE_RULES}
${MARKET_LOGIC}

${planAdaptation}

RÈGLES D'ALLOCATION:
- 3 à 4 actifs, total = 100% exactement
- Conservateur: BTC+ETH ≥ 75%
- Modéré: BTC+ETH ≥ 55%
- Agressif: BTC+ETH ≥ 35%
- Court terme: BTC, ETH, BNB uniquement
- Exclure: ${cleanExcluded || "rien"}
- Actifs disponibles: BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOT

PLAN OBLIGATOIRE — 4 étapes:
1. Action immédiate: que faire maintenant (actif + montant ou %)
2. Scénario baisse: si le marché baisse de X%, je fais quoi
3. Scénario hausse: si le marché monte de X%, je fais quoi
4. Timing: dans combien de temps revoir ce portefeuille

Réponds UNIQUEMENT avec ce JSON valide, sans texte autour:
{
  "score": <entier 60-88>,
  "risk": "<faible|modéré|élevé>",
  "allocation": [{ "asset": "<SYMBOLE>", "percentage": <entier> }],
  "plan": [
    "<action immédiate: acheter [actif] avec [% ou montant] — maintenant>",
    "<scénario baisse: si [marché] baisse de X%, je [action concrète]>",
    "<scénario hausse: si [marché] monte de X%, je [prise de profit ou maintien]>",
    "<timing: revoir le portefeuille dans [délai précis]>"
  ],
  "explanation": "<2 phrases max, directes, citant les actifs choisis et une donnée marché réelle>",
  "pedagogy": "<${pedagogyInstruction}>",
  "executionNow": [
    { "crypto": "<SYMBOLE>", "amount": "<montant €, calculé depuis le capital total>" },
    { "crypto": "<SYMBOLE>", "amount": "<montant €>" }
  ],
  "executionLater": [
    { "crypto": "<SYMBOLE>", "condition": "<condition d'entrée simple — ex: entrer si baisse de 10%>" }
  ],
  "nextReview": "<délai précis — ex: dans 14 jours>",
  "marketVerdict": "<favorable|neutre|risqué>",
  "marketVerdictNote": "<1 phrase courte expliquant le verdict>",
  "marketInsight": "<1-2 phrases: [donnée réelle observée] → [implication] → [conclusion actionnable]>",
  "errorsToAvoid": [
    "<erreur concrète liée à ce profil et ce marché>",
    "<erreur concrète>",
    "<erreur concrète>"
  ],
  "timePlan": [
    { "period": "Semaine 1", "action": "<action concrète>" },
    { "period": "Semaine 2", "action": "<action concrète>" },
    { "period": "Semaine 3", "action": "<action concrète>" }
  ],
  "aiSignature": "<1 phrase max, format: [indicateur marché observé] → [implication capital] → [décision stratégique]. Ex: BTC domine à 58% → capitaux risk-off → BTC/ETH prioritaires.>",
  "projection": [
    { "scenario": "Marché stable", "outcome": "<ce qui se passe avec cette allocation — 1 phrase courte et claire>" },
    { "scenario": "Marché haussier", "outcome": "<ce qui se passe — 1 phrase courte>" },
    { "scenario": "Marché baissier", "outcome": "<ce qui se passe — 1 phrase courte>" }
  ],
  "disclaimer": "Les cryptomonnaies sont des actifs spéculatifs à risque de perte totale. Ce n'est pas un conseil financier."
}`
  }

  if (plan === "pro") {
    return `Tu es un analyste en gestion de portefeuille crypto. Produis une analyse précise et différenciée selon le profil et le marché actuel.

PROFIL INVESTISSEUR:
- Risque: ${riskLabel}
- Horizon: ${horizonLabel}
- Expérience: ${cleanExperience}
- Stratégie d'achat: ${cleanStrategy}
- Capital: ${cleanCapital}€${cleanMonthly ? `\n- Apport mensuel: ${cleanMonthly}€` : ""}
- Objectifs: ${cleanGoals}
${cleanExcluded ? `- À exclure: ${cleanExcluded}` : ""}

${marketCtx}
${STYLE_RULES}
${MARKET_LOGIC}

${planAdaptation}

INSTRUCTIONS:
- 5 à 6 actifs, total = 100% exactement
- Note par actif (5-8 mots): raison spécifique liée au contexte marché actuel, pas générique
- Signal marché: observation factuelle et actionnable, basée sur les données fournies
- Plan OBLIGATOIRE — 4 étapes: (1) action immédiate chiffrée, (2) scénario si baisse, (3) scénario si hausse, (4) révision avec timing
- Exclure: ${cleanExcluded || "rien"}

Règles d'allocation:
- Conservateur: BTC+ETH ≥ 70%, pas d'actif < 5%
- Modéré: BTC+ETH ≥ 50%, max 2 altcoins
- Agressif: BTC+ETH ≥ 30%, altcoins établis uniquement
- Court terme: BTC, ETH, BNB en priorité

Actifs: BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOT, LINK, NEAR, MATIC

Réponds UNIQUEMENT avec ce JSON valide, sans texte autour:
{
  "score": <entier 60-97>,
  "risk": "<faible|modéré|élevé>",
  "allocation": [{ "asset": "<SYMBOLE>", "percentage": <entier>, "note": "<raison spécifique au contexte actuel, 5-8 mots>" }],
  "plan": [
    "<action immédiate: actif + montant + timing précis>",
    "<scénario baisse: condition de marché + action défensive chiffrée>",
    "<scénario hausse: objectif chiffré + prise de profit ou seuil>",
    "<révision: date ou condition de suivi — indicateur mesurable>"
  ],
  "explanation": "<2-3 phrases directes: logique chiffrée + lecture du marché actuel — citer une variation ou un prix réel>",
  "marketSignal": "<1 phrase factuelle et actionnable basée sur les données du moment>",
  "pedagogy": "<${pedagogyInstruction}>",
  "executionNow": [
    { "crypto": "<SYMBOLE>", "amount": "<montant exact en €, calculé depuis capital + allocation>" },
    { "crypto": "<SYMBOLE>", "amount": "<montant exact en €>" }
  ],
  "executionLater": [
    { "crypto": "<SYMBOLE>", "condition": "<condition précise d'entrée — prix ou variation>" }
  ],
  "nextReview": "<délai ou date de révision — ex: dans 21 jours ou le [date]>",
  "marketVerdict": "<favorable|neutre|risqué>",
  "marketVerdictNote": "<1 phrase factuelle basée sur les données du moment>",
  "marketInsight": "<1-2 phrases: [indicateur observé — prix/dominance/variation] → [implication capital] → [décision]>",
  "errorsToAvoid": [
    "<erreur critique liée à ce profil, ce marché, cette stratégie>",
    "<erreur de gestion du risque>",
    "<erreur comportementale>",
    "<erreur de timing ou de position sizing>"
  ],
  "timePlan": [
    { "period": "Semaine 1", "action": "<action prioritaire avec actif et montant>" },
    { "period": "Semaine 2", "action": "<observation ou ajustement>>" },
    { "period": "Semaine 3", "action": "<point de contrôle avec condition>" },
    { "period": "Mois 2+",  "action": "<stratégie long terme ou rééquilibrage>" }
  ],
  "aiSignature": "<1 phrase technique, format [indicateur] → [implication] → [décision]. Citer un prix ou une dominance observée.>",
  "projection": [
    { "scenario": "Marché stable", "outcome": "<progression attendue avec cette allocation — 1 phrase>" },
    { "scenario": "Marché haussier", "outcome": "<performance probable — 1 phrase avec estimation>" },
    { "scenario": "Marché baissier", "outcome": "<protection offerte — 1 phrase>" }
  ],
  "disclaimer": "Analyse informative, non réglementée. Risque de perte totale du capital."
}`
  }

  // premium
  return `Tu es un gérant de portefeuille crypto senior. Produis une analyse stratégique complète, chiffrée et directement opérationnelle.

PROFIL CLIENT:
- Risque: ${riskLabel}
- Horizon: ${horizonLabel}
- Expérience: ${cleanExperience}
- Stratégie d'achat: ${cleanStrategy}
- Capital: ${cleanCapital}€${cleanMonthly ? `\n- Apports: ${cleanMonthly}€/mois` : ""}
- Objectifs: ${cleanGoals}
${cleanExcluded ? `- Exclusions: ${cleanExcluded}` : ""}

${marketCtx}
${STYLE_RULES}
${MARKET_LOGIC}

${planAdaptation}

INSTRUCTIONS PREMIUM:
- 5 à 7 actifs, total = 100% exactement
- Note analytique par actif (8-12 mots): justification précise selon momentum ET profil, pas de formule générique
- Signal marché: observation factuelle issue des données fournies, 1 phrase directe
- Stratégie d'entrée: lump-sum ou DCA selon la volatilité observée dans les données — chiffrer (%, semaines)
- Rééquilibrage: seuils précis en % ou en conditions de prix/variation — pas de formule vague
- Plan OBLIGATOIRE — 5 étapes: (1) action immédiate chiffrée, (2) scénario baisse avec seuil précis, (3) scénario hausse avec objectif chiffré, (4) gestion du risque, (5) révision datée
- Score: calibré précisément sur l'adéquation profil/marché du moment
- Exclure: ${cleanExcluded || "rien"}

Règles d'allocation:
- Conservateur: BTC+ETH ≥ 70%, pas d'actif < 5%
- Modéré: BTC+ETH ≥ 50%, max 3 altcoins, pas d'actif < 4%
- Agressif: BTC+ETH ≥ 25%, altcoins top 20 CoinGecko, DCA obligatoire

Actifs: BTC, ETH, SOL, BNB, XRP, ADA, AVAX, DOT, LINK, NEAR, MATIC

Réponds UNIQUEMENT avec ce JSON valide, sans texte autour:
{
  "score": <entier 60-97>,
  "risk": "<faible|modéré|élevé>",
  "allocation": [{ "asset": "<SYMBOLE>", "percentage": <entier>, "note": "<justification spécifique 8-12 mots>" }],
  "plan": [
    "<action immédiate: actif + montant exact ou % — exécuter maintenant>",
    "<scénario baisse: seuil précis de déclenchement + action défensive chiffrée>",
    "<scénario hausse: objectif chiffré + prise de profit ou rééquilibrage>",
    "<gestion risque: stop-loss ou condition de sortie avec seuil mesurable>",
    "<révision: date ou condition de suivi — indicateur précis>"
  ],
  "explanation": "<3-4 phrases d'analyse directe: profil → allocation → lecture marché chiffrée — zéro formule générique>",
  "marketSignal": "<1 phrase factuelle citant un prix, une variation ou une dominance observée>",
  "entryStrategy": "<stratégie d'entrée chiffrée: ex: 65% immédiatement sur BTC/ETH, 35% DCA hebdomadaire sur 6 semaines>",
  "rebalanceNote": "<seuils précis: ex: rééquilibrer si BTC dépasse 58% du portfolio OU si SOL gagne > 35% depuis l'entrée>",
  "pedagogy": "<${pedagogyInstruction}>",
  "executionNow": [
    { "crypto": "<SYMBOLE>", "amount": "<montant exact € — capital × % allocation>" },
    { "crypto": "<SYMBOLE>", "amount": "<montant exact €>" }
  ],
  "executionLater": [
    { "crypto": "<SYMBOLE>", "condition": "<trigger précis: prix cible ou variation % ou date>" }
  ],
  "nextReview": "<date ou condition précise de révision>",
  "marketVerdict": "<favorable|neutre|risqué>",
  "marketVerdictNote": "<1 phrase: indicateur clé observé + implication directe>",
  "marketInsight": "<1-2 phrases techniques: dominance BTC → flux capital → implication sur les altcoins + cycle>",
  "errorsToAvoid": [
    "<risque d'exécution spécifique à cette stratégie>",
    "<erreur de sizing ou de levier>",
    "<piège comportemental lié à la phase de marché actuelle>",
    "<erreur de corrélation ou de diversification>"
  ],
  "timePlan": [
    { "period": "Semaine 1",  "action": "<exécution immédiate avec montants>" },
    { "period": "Semaine 2",  "action": "<suivi + condition d'ajustement>" },
    { "period": "Semaine 3",  "action": "<point de contrôle technique>" },
    { "period": "Mois 2",    "action": "<rééquilibrage ou renforcement selon conditions>" },
    { "period": "Mois 3+",   "action": "<stratégie de sortie ou consolidation>" }
  ],
  "aiSignature": "<1 phrase analytique max, format condensé expert: [indicateur précis avec valeur] → [implication capital] → [biais stratégique].>",
  "projection": [
    { "scenario": "Marché stable", "outcome": "<comportement attendu de ce portefeuille — 1 phrase chiffrée si possible>" },
    { "scenario": "Marché haussier", "outcome": "<upside potentiel — 1 phrase avec estimation réaliste>" },
    { "scenario": "Marché baissier", "outcome": "<downside limité comment — 1 phrase avec mécanisme de protection>" }
  ],
  "disclaimer": "Analyse stratégique à titre informatif. Ne constitue pas un conseil en investissement réglementé. Les cryptomonnaies comportent un risque de perte totale du capital investi."
}`
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const lastCall = cooldowns.get(user.id) ?? 0
    if (Date.now() - lastCall < COOLDOWN_MS) {
      const wait = Math.ceil((COOLDOWN_MS - (Date.now() - lastCall)) / 1000)
      return NextResponse.json(
        { error: `Veuillez attendre ${wait} secondes avant de relancer une analyse.` },
        { status: 429 }
      )
    }

    const [{ data: profile }, { data: activeSub }] = await Promise.all([
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

    const plan = activeSub?.plan ?? profile?.plan ?? "free"
    const monthlyLimit = PLAN_LIMITS[plan] ?? 1

    if (monthlyLimit !== -1) {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { count } = await supabase
        .from("ai_analyses")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("created_at", startOfMonth.toISOString())

      if ((count ?? 0) >= monthlyLimit) {
        return NextResponse.json(
          {
            error: `Limite de ${monthlyLimit} analyse(s) par mois atteinte. Passez au plan supérieur pour continuer.`,
            upgradeRequired: true,
          },
          { status: 429 }
        )
      }
    }

    cooldowns.set(user.id, Date.now())

    const body = await request.json()
    const { riskTolerance, horizon, capital, monthlyContribution, goals, excludedCryptos, experience, buyStrategy } = body

    if (!riskTolerance || !horizon || !capital || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
    }

    const cleanCapital    = sanitize(capital, 20)
    const cleanMonthly    = sanitize(monthlyContribution, 20)
    const cleanExcluded   = sanitize(excludedCryptos, 100)
    const cleanGoals      = (goals as unknown[]).map((g) => sanitize(g, 50)).join(", ")
    const cleanRisk       = ["conservative", "moderate", "aggressive"].includes(riskTolerance) ? riskTolerance : "moderate"
    const cleanHorizon    = ["short", "medium", "long"].includes(horizon) ? horizon : "medium"
    const cleanExpLevel   = ["beginner", "intermediate", "expert"].includes(experience) ? experience : "intermediate"
    const cleanBuyStrat   = ["lumpsum", "dca-monthly", "dca-weekly"].includes(buyStrategy) ? buyStrategy : "lumpsum"

    const riskLabel       = cleanRisk === "conservative" ? "conservateur" : cleanRisk === "moderate" ? "modéré" : "agressif"
    const horizonLabel    = cleanHorizon === "short" ? "court terme (< 1 an)" : cleanHorizon === "medium" ? "moyen terme (1-3 ans)" : "long terme (> 3 ans)"
    const cleanExperience = cleanExpLevel === "beginner" ? "débutant (< 1 an)" : cleanExpLevel === "expert" ? "expert (> 3 ans)" : "intermédiaire (1-3 ans)"
    const cleanStrategy   = cleanBuyStrat === "lumpsum" ? "investissement unique (lump-sum)" : cleanBuyStrat === "dca-monthly" ? "DCA mensuel" : "DCA hebdomadaire"

    // Fetch live market data (cached 30s server-side)
    const { prices, global: globalData } = await fetchMarketSnapshot()

    const marketLevel: "basic" | "standard" | "full" =
      plan === "premium" ? "full" : plan === "pro" ? "standard" : "basic"

    const marketCtx = buildMarketContext(prices, globalData, marketLevel)

    const prompt = buildPrompt(
      plan,
      { riskLabel, horizonLabel, cleanCapital, cleanMonthly, cleanGoals, cleanExcluded, cleanExperience, cleanStrategy, cleanExpLevel },
      marketCtx
    )

    const config = MODEL_CONFIG[plan] ?? MODEL_CONFIG.free

    const baseParams = {
      model:      config.model,
      max_tokens: config.maxTokens,
      messages:   [{ role: "user" as const, content: prompt }],
    }

    const message = config.thinking
      ? await getAnthropic().messages.create({ ...baseParams, thinking: { type: "adaptive" as const } })
      : await getAnthropic().messages.create(baseParams)

    const textBlock = message.content.find((c) => c.type === "text")
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Réponse inattendue de l'IA — aucun bloc texte trouvé")
    }

    let raw = textBlock.text.trim()
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()

    let analysisData: AnalysisResult
    try {
      analysisData = JSON.parse(raw)
    } catch {
      const match = raw.match(/\{[\s\S]*\}/)
      if (!match) throw new Error("L'IA n'a pas retourné de JSON valide")
      analysisData = JSON.parse(match[0])
    }

    // ── Robust normalization — defensive against any AI format variance ──────
    // score
    const rawScore = Number(analysisData.score)
    analysisData.score = Number.isFinite(rawScore) && rawScore >= 1 && rawScore <= 100 ? Math.round(rawScore) : 75

    // risk
    if (!["faible", "modéré", "élevé"].includes(analysisData.risk)) analysisData.risk = "modéré"

    // allocation — must be array of {asset, percentage}
    if (!Array.isArray(analysisData.allocation) || analysisData.allocation.length === 0) {
      throw new Error("Allocation invalide reçue de l'IA")
    }
    analysisData.allocation = analysisData.allocation
      .filter((a) => a && typeof a.asset === "string" && a.asset.trim())
      .map((a) => ({
        asset:      String(a.asset).toUpperCase().trim(),
        percentage: Math.round(Number(a.percentage) || 0),
        note:       typeof a.note === "string" ? a.note.trim() || undefined : undefined,
      }))
    if (analysisData.allocation.length === 0) throw new Error("Allocation vide après nettoyage")

    // plan — string | string[] | object → always string[]
    if (typeof analysisData.plan === "string") {
      analysisData.plan = (analysisData.plan as unknown as string)
        .split(/\n|;|(?<=\.)\s+(?=[A-ZÀÂÉÈÊËÎÏÔÙÛÜ])/)
        .map((s) => s.replace(/^\d+[\.\)\-]\s*/, "").trim())
        .filter(Boolean)
    } else if (analysisData.plan && !Array.isArray(analysisData.plan)) {
      // could be an object like {1: "...", 2: "..."}
      try { analysisData.plan = Object.values(analysisData.plan as Record<string, unknown>).map(String).filter(Boolean) }
      catch { analysisData.plan = [] }
    }
    if (!Array.isArray(analysisData.plan) || analysisData.plan.length === 0) {
      analysisData.plan = ["Vérifier les conditions de marché avant d'investir.", "Consulter un professionnel pour des décisions importantes."]
    }
    analysisData.plan = analysisData.plan.map((s) => String(s).trim()).filter(Boolean)

    // text fields
    if (!analysisData.explanation || typeof analysisData.explanation !== "string") analysisData.explanation = ""
    if (analysisData.marketSignal  && typeof analysisData.marketSignal  !== "string") analysisData.marketSignal  = undefined
    if (analysisData.entryStrategy && typeof analysisData.entryStrategy !== "string") analysisData.entryStrategy = undefined
    if (analysisData.rebalanceNote && typeof analysisData.rebalanceNote !== "string") analysisData.rebalanceNote = undefined
    if (analysisData.pedagogy      && typeof analysisData.pedagogy      !== "string") analysisData.pedagogy      = undefined

    // new action blocks
    analysisData.executionNow = Array.isArray(analysisData.executionNow)
      ? analysisData.executionNow
          .filter((e) => e && typeof e === "object" && typeof e.crypto === "string" && e.crypto.trim())
          .map((e) => ({ crypto: String(e.crypto).toUpperCase().trim(), amount: String(e.amount ?? "").trim() }))
      : []
    analysisData.executionLater = Array.isArray(analysisData.executionLater)
      ? analysisData.executionLater
          .filter((e) => e && typeof e === "object" && typeof e.crypto === "string" && e.crypto.trim())
          .map((e) => ({ crypto: String(e.crypto).toUpperCase().trim(), condition: String(e.condition ?? "").trim() }))
      : []
    if (typeof analysisData.nextReview !== "string" || !analysisData.nextReview.trim()) analysisData.nextReview = undefined
    if (!["favorable", "neutre", "risqué"].includes(analysisData.marketVerdict as string)) analysisData.marketVerdict = undefined
    if (typeof analysisData.marketVerdictNote !== "string") analysisData.marketVerdictNote = undefined
    if (typeof analysisData.marketInsight     !== "string") analysisData.marketInsight     = undefined
    analysisData.errorsToAvoid = Array.isArray(analysisData.errorsToAvoid)
      ? analysisData.errorsToAvoid.map(String).filter(Boolean).slice(0, 4)
      : []
    analysisData.timePlan = Array.isArray(analysisData.timePlan)
      ? analysisData.timePlan
          .filter((t) => t && typeof t === "object" && typeof t.period === "string" && t.period.trim())
          .map((t) => ({ period: String(t.period).trim(), action: String(t.action ?? "").trim() }))
          .slice(0, 5)
      : []
    if (typeof analysisData.aiSignature !== "string") analysisData.aiSignature = undefined
    analysisData.projection = Array.isArray(analysisData.projection)
      ? (analysisData.projection as unknown[])
          .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
          .map((p) => ({ scenario: String(p.scenario ?? "").trim(), outcome: String(p.outcome ?? "").trim() }))
          .filter((p) => p.scenario)
          .slice(0, 3)
      : []

    if (!analysisData.disclaimer || typeof analysisData.disclaimer !== "string") {
      analysisData.disclaimer = "Investissement spéculatif — risque de perte totale. Ne pas investir plus que ce que vous pouvez perdre."
    }

    // Normalize percentages to exactly 100
    const total = analysisData.allocation.reduce((s, a) => s + (a.percentage ?? 0), 0)
    if (total === 0) throw new Error("Allocation avec total 0% reçue de l'IA")
    if (Math.abs(total - 100) > 1) {
      analysisData.allocation = analysisData.allocation.map((a) => ({
        ...a,
        percentage: Math.round((a.percentage / total) * 100),
      }))
    }
    const finalTotal = analysisData.allocation.reduce((s, a) => s + a.percentage, 0)
    if (finalTotal !== 100) analysisData.allocation[0].percentage += 100 - finalTotal

    // Save to DB (allocation without notes for compatibility)
    const { data: savedAnalysis, error: dbError } = await supabase
      .from("ai_analyses")
      .insert({
        user_id:          user.id,
        investor_profile: { riskTolerance: cleanRisk, horizon: cleanHorizon, capital: cleanCapital, monthlyContribution: cleanMonthly, goals, excludedCryptos: cleanExcluded, experience: cleanExpLevel, buyStrategy: cleanBuyStrat },
        allocations:      analysisData.allocation.map((a) => ({ symbol: a.asset, percentage: a.percentage })),
        total_score:      analysisData.score,
        market_context:   analysisData.explanation,
        recommendations:  analysisData.plan,
        warnings:         [analysisData.disclaimer],
        model_used:       config.model,
        tokens_used:      (message.usage?.input_tokens ?? 0) + (message.usage?.output_tokens ?? 0),
      })
      .select("id")
      .single()

    if (dbError) {
      console.error("Failed to save analysis:", dbError)
      return NextResponse.json({ ...analysisData, plan, saved: false })
    }

    return NextResponse.json({ ...analysisData, plan, id: savedAnalysis.id, saved: true })
  } catch (error) {
    console.error("Advisor API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur inattendue" },
      { status: 500 }
    )
  }
}

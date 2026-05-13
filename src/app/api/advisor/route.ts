import { NextResponse } from "next/server"
import * as Sentry from "@sentry/nextjs"
import Anthropic from "@anthropic-ai/sdk"
import { createClient } from "@/lib/supabase/server"
import { createServerClient } from "@supabase/ssr"
import { fetchMarketSnapshot, getCryptoCategories } from "@/lib/coingecko"
import type { CryptoPrice, MarketGlobal } from "@/lib/coingecko"
import { fetchKrakenTickers, type KrakenTicker } from "@/lib/kraken"
import { buildMarketDecision } from "@/lib/market-agent"
import { computeAggregatedPortfolioSnapshotFromAnalyses } from "@/lib/portfolio-history"

export const maxDuration = 60

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
}

function getAdmin() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
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

// In-memory cooldown — soft guard against accidental double-submits on the
// SAME serverless instance. Not reliable across instances (use DB monthly
// count as the authoritative rate limit). COOLDOWN_MS must stay short.
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

function parseEuroAmount(value: string): number {
  const normalized = value
    .replace(/\s/g, "")
    .replace(/€/g, "")
    .replace(",", ".")
    .trim()

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

function sanitize(s: unknown, maxLen = 300): string {
  return String(s ?? "").replace(/[<>{}$\\]/g, "").slice(0, maxLen).trim()
}

function fmtPrice(price: number): string {
  if (price >= 1000) return `$${Math.round(price).toLocaleString("en-US")}`
  if (price >= 1) return `$${price.toFixed(2)}`
  return `$${price.toFixed(4)}`
}

function formatKrakenPrice(price: number): string {
  if (!Number.isFinite(price)) return "n/a"
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
  if (price >= 1) return `$${price.toFixed(4)}`
  return `$${price.toFixed(6)}`
}

function formatKrakenVolume(volume: number): string {
  if (!Number.isFinite(volume)) return "n/a"
  if (volume >= 1e6) return `${(volume / 1e6).toFixed(2)}M`
  if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
  return volume.toFixed(2)
}

function buildKrakenContext(tickers: KrakenTicker[]): string {
  if (!tickers.length) return "Flux Kraken indisponible."

  return [
    "FLUX KRAKEN:",
    ...[...tickers]
      .sort((left, right) => right.volume24h - left.volume24h)
      .slice(0, 6)
      .map((ticker) => {
      const spread = ticker.ask - ticker.bid
      const spreadPct = ticker.bid > 0 ? (spread / ticker.bid) * 100 : 0
      return `- ${ticker.symbol}: spot ${formatKrakenPrice(ticker.price)} | bid ${formatKrakenPrice(ticker.bid)} | ask ${formatKrakenPrice(ticker.ask)} | volume 24h ${formatKrakenVolume(ticker.volume24h)} | spread ${spreadPct.toFixed(3)}% | paire ${ticker.pair}`
    }),
  ].join("\n")
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
× Liquidité: rester sur les actifs réellement présents dans le snapshot CoinGecko fourni
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
    cleanCapital: string; cleanMonthly: string; cleanMonthlyIncome: string
    cleanGoals: string; cleanPreciseObjective: string; cleanExcluded: string
    cleanExperience: string; cleanStrategy: string
    cleanExpLevel: string; lossToleranceLabel: string; investmentFrequencyLabel: string
    liquidityNeedLabel: string; portfolioPreferenceLabel: string; currentHoldingsLabel: string
  },
  marketCtx: string,
  krakenCtx: string,
  marketDecisionJson: string,
  availableAssets: string,
  marketDataAvailable: boolean
): string {
  const {
    riskLabel, horizonLabel, cleanCapital, cleanMonthly, cleanMonthlyIncome,
    cleanGoals, cleanPreciseObjective, cleanExcluded, cleanExperience,
    cleanStrategy, cleanExpLevel, lossToleranceLabel, investmentFrequencyLabel,
    liquidityNeedLabel, portfolioPreferenceLabel, currentHoldingsLabel,
  } = p

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

  const profileDetails = [
    `- Revenu mensuel: ${cleanMonthlyIncome}€`,
    cleanMonthly ? `- Apport mensuel: ${cleanMonthly}€` : "",
    `- Tolérance à la perte: ${lossToleranceLabel}`,
    `- Besoin de liquidite: ${liquidityNeedLabel}`,
    `- Preference principale: ${portfolioPreferenceLabel}`,
    `- Objectif précis: ${cleanPreciseObjective}`,
    `- Fréquence d'investissement: ${investmentFrequencyLabel}`,
    currentHoldingsLabel ? `- Actifs deja detenus: ${currentHoldingsLabel}` : "",
  ].filter(Boolean).join("\n")

  const planFeatureRules = plan === "free"
    ? "FREE UNIQUEMENT: répondre avec une allocation de base, une explication courte, une exécution immédiate et une pédagogie simple. Ne pas fournir de signal marché détaillé, de plan dans le temps, de projection, de rééquilibrage ou de stratégie avancée."
    : plan === "pro"
    ? "PRO UNIQUEMENT: inclure le signal marché, le verdict et un plan dans le temps. Ne pas fournir de projection de scénarios, de rééquilibrage ni de stratégie d'entrée premium."
    : "PREMIUM: inclure la lecture de marché approfondie, les alertes de risque, les projections de scénarios, la stratégie d'entrée et le rééquilibrage."

  const marketAvailabilityRule = marketDataAvailable
    ? "DONNÉES LIVE DISPONIBLES: appuie-toi explicitement sur les données CoinGecko et le flux Kraken fournis."
    : "DONNÉES LIVE PARTIELLES OU ABSENTES: dis-le clairement, n'invente aucun prix, aucune variation ni aucun signal live."

  const assetSelectionRules = "UNIVERS D'ACTIFS: rester sur les actifs du top 50 fournis. Justifier chaque selection par la liquidite, la dominance, la volatilite, la diversification ou la categorie de l'actif. Les memecoins ne peuvent etre que des satellites minoritaires, jamais le coeur du portefeuille."
  const answerStructureRule = "STRUCTURE DE FOND: ton resultat doit ressembler a une note d'investissement courte. Format sobre, raisonnement propre, risques explicites, prochaine action concrete. Pas de ton marketing, pas de promesse implicite, pas de formule hype."

  if (plan === "free") {
    return `Tu es un analyste crypto. Génère une allocation concise et directement utilisable.

PROFIL:
- Risque: ${riskLabel}
- Horizon: ${horizonLabel}
- Expérience: ${cleanExperience}
- Stratégie: ${cleanStrategy}
- Capital: ${cleanCapital}€
${profileDetails}
- Objectifs: ${cleanGoals}
${cleanExcluded ? `- Exclusions: ${cleanExcluded}` : ""}

${marketCtx}
${krakenCtx}
${STYLE_RULES}
${MARKET_LOGIC}
${planFeatureRules}
${marketAvailabilityRule}
${assetSelectionRules}
${answerStructureRule}

MOTEUR DE DÉCISION STRUCTURÉ:
${marketDecisionJson}

${planAdaptation}

RÈGLES D'ALLOCATION:
- 3 à 4 actifs, total = 100% exactement
- Conservateur: BTC+ETH ≥ 75%
- Modéré: BTC+ETH ≥ 55%
- Agressif: BTC+ETH ≥ 35%
- Court terme: BTC, ETH, BNB uniquement
- Exclure: ${cleanExcluded || "rien"}
- Actifs disponibles: ${availableAssets}

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
- Capital: ${cleanCapital}€
${profileDetails}
- Objectifs: ${cleanGoals}
${cleanExcluded ? `- À exclure: ${cleanExcluded}` : ""}

${marketCtx}
${krakenCtx}
${STYLE_RULES}
${MARKET_LOGIC}
${planFeatureRules}
${marketAvailabilityRule}
${assetSelectionRules}
${answerStructureRule}

MOTEUR DE DÉCISION STRUCTURÉ:
${marketDecisionJson}

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

Actifs: ${availableAssets}

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
- Capital: ${cleanCapital}€
${profileDetails}
- Objectifs: ${cleanGoals}
${cleanExcluded ? `- Exclusions: ${cleanExcluded}` : ""}

${marketCtx}
${krakenCtx}
${STYLE_RULES}
${MARKET_LOGIC}
${planFeatureRules}
${marketAvailabilityRule}
${assetSelectionRules}
${answerStructureRule}

MOTEUR DE DÉCISION STRUCTURÉ:
${marketDecisionJson}

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
- Agressif: BTC+ETH ≥ 25%, altcoins parmi les actifs fournis, DCA obligatoire

Actifs: ${availableAssets}

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

function cleanJsonEnvelope(raw: string): string {
  return raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim()
}

function extractJsonObject(raw: string): string | null {
  const start = raw.indexOf("{")
  const end = raw.lastIndexOf("}")
  if (start === -1 || end === -1 || end <= start) return null
  return raw.slice(start, end + 1)
}

function tryParseAnalysisResult(raw: string): AnalysisResult | null {
  const normalized = cleanJsonEnvelope(raw)
  const extracted = extractJsonObject(normalized)
  const candidates = Array.from(new Set([
    normalized,
    extracted ?? "",
    normalized.replace(/,\s*([}\]])/g, "$1"),
    extracted ? extracted.replace(/,\s*([}\]])/g, "$1") : "",
  ].filter(Boolean)))

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate) as AnalysisResult
    } catch {
      // continue to next candidate
    }
  }

  return null
}

async function repairAnalysisJson(raw: string, parseError: string): Promise<AnalysisResult> {
  const repairMessage = await getAnthropic().messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2200,
    messages: [
      {
        role: "user",
        content: [
          "Répare ce JSON mal formé pour qu'il soit strictement valide.",
          "Conserve les mêmes clés et le même sens.",
          "Retourne uniquement un objet JSON valide, sans markdown ni commentaire.",
          `Erreur de parsing: ${parseError}`,
          "",
          cleanJsonEnvelope(raw),
        ].join("\n"),
      },
    ],
  })

  const repairedBlock = repairMessage.content.find((c) => c.type === "text")
  if (!repairedBlock || repairedBlock.type !== "text") {
    throw new Error("Réponse inattendue de l'IA lors de la réparation JSON")
  }

  const repaired = tryParseAnalysisResult(repairedBlock.text)
  if (!repaired) {
    throw new Error("L'IA n'a pas retourné de JSON exploitable après réparation")
  }

  return repaired
}

function applyPlanFeatureGate(analysisData: AnalysisResult, plan: string) {
  const isPro = plan === "pro" || plan === "premium"
  const isPremium = plan === "premium"

  if (!isPro) {
    analysisData.allocation = analysisData.allocation.map((item) => ({ ...item, note: undefined }))
    analysisData.marketSignal = undefined
    analysisData.marketVerdict = undefined
    analysisData.marketVerdictNote = undefined
    analysisData.marketInsight = undefined
    analysisData.timePlan = []
  }

  if (!isPremium) {
    analysisData.entryStrategy = undefined
    analysisData.rebalanceNote = undefined
    analysisData.marketInsight = undefined
    analysisData.aiSignature = undefined
    analysisData.errorsToAvoid = []
    analysisData.projection = []
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // ── DB-based cross-instance cooldown (primary rate limit) ──────────────
    // Uses last_analysis_at from profiles — reliable across all serverless
    // instances. The in-memory Map is a supplemental same-instance soft guard.
    const adminRateLimit = getAdmin()
    const { data: profileForCooldown } = await adminRateLimit
      .from("profiles")
      .select("plan, last_analysis_at")
      .eq("id", user.id)
      .maybeSingle()

    if (profileForCooldown?.last_analysis_at) {
      const msSinceLast = Date.now() - new Date(profileForCooldown.last_analysis_at).getTime()
      if (msSinceLast < COOLDOWN_MS) {
        const wait = Math.ceil((COOLDOWN_MS - msSinceLast) / 1000)
        return NextResponse.json(
          { error: `Veuillez attendre ${wait} secondes avant de relancer une analyse.` },
          { status: 429 }
        )
      }
    }

    // Supplemental in-memory guard (same-instance, best-effort)
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

    // Persist the timestamp to DB for cross-instance enforcement
    void adminRateLimit
      .from("profiles")
      .update({ last_analysis_at: new Date().toISOString() })
      .eq("id", user.id)

    const body = await request.json()
    const {
      riskTolerance, horizon, capital, monthlyIncome, monthlyContribution,
      lossTolerance, preciseObjective, investmentFrequency,
      goals, excludedCryptos, experience, buyStrategy,
      liquidityNeed, portfolioPreference, currentHoldings,
    } = body

    if (!riskTolerance || !horizon || !capital || !monthlyIncome || !preciseObjective || !Array.isArray(goals) || goals.length === 0) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    if (!['low', 'medium', 'high'].includes(lossTolerance) || !['once', 'weekly', 'monthly', 'opportunistic'].includes(investmentFrequency)) {
      return NextResponse.json({ error: "Parametres invalides" }, { status: 400 })
    }

    if (!['low', 'medium', 'high'].includes(liquidityNeed) || !['security', 'balance', 'growth'].includes(portfolioPreference)) {
      return NextResponse.json({ error: "Parametres invalides" }, { status: 400 })
    }

    const cleanCapital = sanitize(capital, 20)
    const cleanMonthlyIncome = sanitize(monthlyIncome, 20)
    const cleanMonthly = sanitize(monthlyContribution, 20)
    const cleanPreciseObjective = sanitize(preciseObjective, 160)
    const cleanExcluded = sanitize(excludedCryptos, 100)
    const cleanCurrentHoldings = sanitize(currentHoldings, 140)
    const cleanGoals = (goals as unknown[]).map((g) => sanitize(g, 50)).join(', ')

    if (!cleanMonthlyIncome || !cleanPreciseObjective) {
      return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
    }

    const cleanRisk = ['conservative', 'moderate', 'aggressive'].includes(riskTolerance) ? riskTolerance : 'moderate'
    const cleanHorizon = ['short', 'medium', 'long'].includes(horizon) ? horizon : 'medium'
    const cleanExpLevel = ['beginner', 'intermediate', 'expert'].includes(experience) ? experience : 'intermediate'
    const cleanBuyStrat = ['lumpsum', 'dca-monthly', 'dca-weekly'].includes(buyStrategy) ? buyStrategy : 'lumpsum'
    const cleanLossTolerance = lossTolerance as 'low' | 'medium' | 'high'
    const cleanInvestmentFrequency = investmentFrequency as 'once' | 'weekly' | 'monthly' | 'opportunistic'
    const cleanLiquidityNeed = liquidityNeed as 'low' | 'medium' | 'high'
    const cleanPortfolioPreference = portfolioPreference as 'security' | 'balance' | 'growth'

    const riskLabel = cleanRisk === 'conservative' ? 'conservateur' : cleanRisk === 'moderate' ? 'modere' : 'agressif'
    const horizonLabel = cleanHorizon === 'short' ? 'court terme (< 1 an)' : cleanHorizon === 'medium' ? 'moyen terme (1-3 ans)' : 'long terme (> 3 ans)'
    const cleanExperience = cleanExpLevel === 'beginner' ? 'debutant (< 1 an)' : cleanExpLevel === 'expert' ? 'avance (> 3 ans)' : 'intermediaire (1-3 ans)'
    const cleanStrategy = cleanBuyStrat === 'lumpsum' ? 'investissement unique (lump-sum)' : cleanBuyStrat === 'dca-monthly' ? 'DCA mensuel' : 'DCA hebdomadaire'
    const lossToleranceLabel = cleanLossTolerance === 'low' ? 'faible (perte acceptable autour de 10%)' : cleanLossTolerance === 'medium' ? 'moyenne (perte acceptable autour de 25%)' : 'forte (perte acceptable de 40% ou plus)'
    const investmentFrequencyLabel = cleanInvestmentFrequency === 'once' ? 'une fois' : cleanInvestmentFrequency === 'weekly' ? 'chaque semaine' : cleanInvestmentFrequency === 'monthly' ? 'chaque mois' : 'opportuniste'
    const liquidityNeedLabel = cleanLiquidityNeed === 'low' ? 'faible (capital peu mobilisable a court terme)' : cleanLiquidityNeed === 'medium' ? 'modere (un peu de souplesse utile)' : 'eleve (besoin de liquidite plus rapide)'
    const portfolioPreferenceLabel = cleanPortfolioPreference === 'security' ? 'securite' : cleanPortfolioPreference === 'balance' ? 'equilibre' : 'croissance'

    // Fetch live market data (cached server-side)
    const [{ prices, global: globalData }, krakenTickers] = await Promise.all([
      fetchMarketSnapshot(),
      fetchKrakenTickers().catch(() => [] as KrakenTicker[]),
    ])

    const marketLevel: "basic" | "standard" | "full" =
      plan === "premium" ? "full" : plan === "pro" ? "standard" : "basic"

    const marketCtx = buildMarketContext(prices, globalData, marketLevel)
    const krakenCtx = buildKrakenContext(krakenTickers)
    const marketDecision = buildMarketDecision(prices, globalData, null)
    const availableAssets = prices.length
      ? prices
          .filter((price) => (
            Number.isFinite(price.price)
            && Number.isFinite(price.change24h)
            && Number.isFinite(price.marketCap)
            && Number.isFinite(price.volume24h)
          ))
          .slice(0, 32)
          .map((price) => (
            `${price.symbol} [${getCryptoCategories(price.symbol).join(", ")}] ` +
            `prix ${fmtPrice(price.price)} | 24h ${price.change24h >= 0 ? "+" : ""}${price.change24h.toFixed(1)}% | ` +
            `cap ${price.marketCap >= 1e9 ? `${(price.marketCap / 1e9).toFixed(1)}B` : `${(price.marketCap / 1e6).toFixed(0)}M`} | ` +
            `volume ${price.volume24h >= 1e9 ? `${(price.volume24h / 1e9).toFixed(1)}B` : `${(price.volume24h / 1e6).toFixed(0)}M`} | ` +
            `source ${price.source ?? "CoinGecko"}`
          ))
          .join(", ")
      : "BTC [Large cap, Reserve], ETH [Large cap, Layer 1, DeFi], SOL [Layer 1], XRP [Payments], BNB [Exchange, Infrastructure], AVAX [Layer 1], SUI [Layer 1], SEI [Layer 1, Trading], ADA [Layer 1], LINK [Infrastructure, Oracle], ONDO [RWA], AAVE [DeFi], ARB [Layer 2], OP [Layer 2], RNDR [AI], TAO [AI], FET [AI], INJ [DeFi], HBAR [Infrastructure], DOGE [Memecoin], PEPE [Memecoin], WIF [Memecoin], BONK [Memecoin], KAS [Infrastructure], ATOM [Infrastructure], IMX [Gaming], GALA [Gaming]"
    const coinGeckoAvailable = prices.length > 0
    const krakenAvailable = krakenTickers.length > 0
    const marketDataAvailable = coinGeckoAvailable || krakenAvailable

    const prompt = buildPrompt(
      plan,
      {
        riskLabel, horizonLabel, cleanCapital, cleanMonthly, cleanMonthlyIncome,
        cleanGoals, cleanPreciseObjective, cleanExcluded, cleanExperience,
        cleanStrategy, cleanExpLevel, lossToleranceLabel, investmentFrequencyLabel,
        liquidityNeedLabel, portfolioPreferenceLabel, currentHoldingsLabel: cleanCurrentHoldings,
      },
      marketCtx,
      krakenCtx,
      JSON.stringify(marketDecision, null, 2),
      availableAssets,
      marketDataAvailable
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

    const raw = cleanJsonEnvelope(textBlock.text)

    let analysisData = tryParseAnalysisResult(raw)
    if (!analysisData) {
      try {
        JSON.parse(raw)
      } catch (error) {
        analysisData = await repairAnalysisJson(raw, error instanceof Error ? error.message : "JSON invalide")
      }
    }
    if (!analysisData) throw new Error("L'IA n'a pas retourné de JSON valide")

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
    applyPlanFeatureGate(analysisData, plan)

    const investedAmount = parseEuroAmount(cleanCapital)
    const portfolioHistoryAllocations = analysisData.allocation.map((allocation) => ({
      symbol: allocation.asset,
      percentage: allocation.percentage,
    }))
    const admin = getAdmin()
    const analysisCreatedAt = new Date().toISOString()
    const { data: historicalAnalyses, error: historicalAnalysesError } = await admin
      .from("ai_analyses")
      .select("created_at, allocations, investor_profile")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })

    if (historicalAnalysesError) {
      console.error("[advisor] historical analyses query failed", historicalAnalysesError)
      return NextResponse.json(
        { error: "Impossible de charger l'historique des analyses pour le moment." },
        { status: 500 }
      )
    }

    const computedPortfolioSnapshot = await computeAggregatedPortfolioSnapshotFromAnalyses({
      analyses: [
        ...(historicalAnalyses ?? []).map((analysis) => ({
          created_at: analysis.created_at,
          invested_amount: parseEuroAmount(
            String(
              (analysis.investor_profile as Record<string, unknown> | null)?.capital ?? ""
            )
          ),
          allocations: Array.isArray(analysis.allocations) ? analysis.allocations : [],
        })),
        {
          created_at: analysisCreatedAt,
          invested_amount: investedAmount,
          allocations: portfolioHistoryAllocations,
        },
      ],
      marketPrices: prices,
      marketFetchedAt: Date.now(),
      krakenTickers,
    })

    if (!computedPortfolioSnapshot) {
      console.error("[advisor] portfolio snapshot computation failed", {
        userId: user.id,
        allocationCount: portfolioHistoryAllocations.length,
        coinGeckoAvailable,
        krakenAvailable,
      })
      return NextResponse.json(
        {
          error: "Impossible de valoriser votre portefeuille avec les prix de marché actuels.",
          marketDataAvailable,
          marketSources: { coinGecko: coinGeckoAvailable, kraken: krakenAvailable },
        },
        { status: 503 }
      )
    }

    // Save to DB (allocation without notes for compatibility)
    const { data: savedAnalysis, error: dbError } = await supabase
      .from("ai_analyses")
      .insert({
        user_id:          user.id,
        investor_profile: {
          riskTolerance: cleanRisk,
          horizon: cleanHorizon,
          capital: cleanCapital,
          monthlyIncome: cleanMonthlyIncome,
          monthlyContribution: cleanMonthly,
          lossTolerance: cleanLossTolerance,
          liquidityNeed: cleanLiquidityNeed,
          portfolioPreference: cleanPortfolioPreference,
          preciseObjective: cleanPreciseObjective,
          investmentFrequency: cleanInvestmentFrequency,
          goals,
          excludedCryptos: cleanExcluded,
          currentHoldings: cleanCurrentHoldings,
          experience: cleanExpLevel,
          buyStrategy: cleanBuyStrat,
          advisorOutput: {
            executionNow: analysisData.executionNow ?? [],
            entryStrategy: analysisData.entryStrategy ?? null,
            nextReview: analysisData.nextReview ?? null,
            errorsToAvoid: analysisData.errorsToAvoid ?? [],
          },
        },
        created_at:       analysisCreatedAt,
        allocations:      portfolioHistoryAllocations,
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
      return NextResponse.json({
        ...analysisData,
        plan,
        saved: false,
        marketDataAvailable,
        marketSources: { coinGecko: coinGeckoAvailable, kraken: krakenAvailable },
      })
    }

    console.info("[advisor] analysis saved", {
      userId: user.id,
      analysisId: savedAnalysis.id,
      allocationCount: analysisData.allocation.length,
      marketDataAvailable,
      coinGeckoAvailable,
      krakenAvailable,
    })

    if (!savedAnalysis?.id) {
      console.error("[advisor] missing savedAnalysis.id for portfolio_history insert", {
        userId: user.id,
        savedAnalysis,
      })
      return NextResponse.json(
        { error: "Impossible d'enregistrer l'analyse générée." },
        { status: 500 }
      )
    } else {
      const { error: historyError } = await admin
        .from("portfolio_history")
        .insert({
          user_id: user.id,
          analysis_id: savedAnalysis.id,
          portfolio_value: computedPortfolioSnapshot.portfolioValue,
          invested_amount: computedPortfolioSnapshot.investedAmount,
          performance_percent: computedPortfolioSnapshot.performancePercent,
          allocations: computedPortfolioSnapshot.allocations,
        })

      if (historyError) {
        console.error("[advisor] portfolio_history insert failed", historyError)
        const { error: rollbackError } = await admin
          .from("ai_analyses")
          .delete()
          .eq("id", savedAnalysis.id)
          .eq("user_id", user.id)

        if (rollbackError) {
          console.error("[advisor] ai_analyses rollback failed after portfolio_history error", rollbackError)
        }

        return NextResponse.json(
          { error: "Impossible d'enregistrer l'historique portefeuille pour le moment." },
          { status: 500 }
        )
      } else {
        console.info("[advisor] portfolio_history inserted", {
          userId: user.id,
          analysisId: savedAnalysis.id,
          mode: computedPortfolioSnapshot.mode,
        })
      }
    }

    return NextResponse.json({
      ...analysisData,
      plan,
      id: savedAnalysis.id,
      saved: true,
      marketDataAvailable,
      marketSources: { coinGecko: coinGeckoAvailable, kraken: krakenAvailable },
    })
  } catch (error) {
    Sentry.captureException(error, { tags: { route: "advisor" } })
    console.error("Advisor API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erreur serveur inattendue" },
      { status: 500 }
    )
  }
}




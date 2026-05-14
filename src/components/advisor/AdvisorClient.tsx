"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Brain, ArrowRight, TrendingUp, Shield, Zap, AlertTriangle, AlertCircle, CheckCircle,
  RefreshCw, Target, X, Lock, Clock, Activity, TrendingDown,
  BarChart3, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Analytics } from "@/lib/analytics"
import { PortfolioChart } from "./PortfolioChart"
import { UpgradeModal, useUpgradeModal } from "@/components/upgrade/UpgradeModal"

interface Props {
  userId: string
  plan: string
  monthlyCount: number
  lastAnalysis: Record<string, unknown> | null
}

type RiskLevel = "conservative" | "moderate" | "aggressive"
type Horizon = "short" | "medium" | "long"
type Experience = "beginner" | "intermediate" | "expert"
type BuyStrategy = "" | "lumpsum" | "dca-monthly" | "dca-weekly"
type LossTolerance = "" | "low" | "medium" | "high"
type InvestmentFrequency = "" | "once" | "weekly" | "monthly" | "opportunistic"
type LiquidityNeed = "" | "low" | "medium" | "high"
type PortfolioPreference = "" | "security" | "balance" | "growth"

interface InvestorForm {
  riskTolerance: RiskLevel
  horizon: Horizon
  capital: string
  monthlyIncome: string
  monthlyContribution: string
  lossTolerance: LossTolerance
  preciseObjective: string
  investmentFrequency: InvestmentFrequency
  goals: string[]
  excludedCryptos: string
  experience: Experience
  buyStrategy: BuyStrategy
  liquidityNeed: LiquidityNeed
  portfolioPreference: PortfolioPreference
  currentHoldings: string
}

interface Analysis {
  score: number
  risk: "faible" | "modéré" | "élevé"
  allocation: Array<{ asset: string; percentage: number; note?: string }>
  plan: string[]
  explanation: string
  overview?: string
  watchList?: string[]
  marketSignal?: string
  entryStrategy?: string
  rebalanceNote?: string
  pedagogy?: string
  executionNow?: Array<{ crypto: string; amount: string }>
  executionLater?: Array<{ crypto: string; condition: string }>
  nextReview?: string
  marketVerdict?: "favorable" | "neutre" | "risqué"
  marketVerdictNote?: string
  marketInsight?: string
  errorsToAvoid?: string[]
  timePlan?: Array<{ period: string; action: string }>
  aiSignature?: string
  projection?: Array<{ scenario: string; outcome: string }>
  disclaimer: string
}

const EXPERIENCE_OPTIONS = [
  { value: "beginner" as const,     label: "Debutant",      desc: "Explications simples, vocabulaire guide" },
  { value: "intermediate" as const, label: "Intermediaire", desc: "Bon equilibre entre pedagogie et details" },
  { value: "expert" as const,       label: "Avance",        desc: "Lecture plus dense, plus directe, plus technique" },
]

const BUY_STRATEGY_OPTIONS = [
  { value: "lumpsum" as const,     label: "Lump-sum",    desc: "Investir en une fois" },
  { value: "dca-monthly" as const, label: "DCA mensuel", desc: "Répartir sur des mois" },
  { value: "dca-weekly" as const,  label: "DCA hebdo",   desc: "Accumulation rapide" },
]

const LOSS_TOLERANCE_OPTIONS = [
  { value: "low" as const,    label: "Faible",  desc: "Je veux limiter la perte a environ 10%" },
  { value: "medium" as const, label: "Moyenne", desc: "J'accepte une baisse proche de 25%" },
  { value: "high" as const,   label: "Forte",   desc: "Je peux supporter une forte volatilite" },
]

const INVESTMENT_FREQUENCY_OPTIONS = [
  { value: "once" as const,          label: "Une fois",       desc: "Entree ponctuelle" },
  { value: "weekly" as const,        label: "Chaque semaine", desc: "Accumulation reguliere" },
  { value: "monthly" as const,       label: "Chaque mois",    desc: "Rythme salarial" },
  { value: "opportunistic" as const, label: "Opportuniste",   desc: "Selon les replis" },
]

const GOALS = [
  "Accumulation long terme",
  "Revenus passifs (staking)",
  "Croissance agressive",
  "Préservation du capital",
  "Diversification",
  "Trading actif",
]

const RISK_OPTIONS = [
  {
    value: "conservative" as const,
    label: "Je reduis le risque",
    desc: "Je prefere proteger mon capital si la baisse devient inconfortable.",
  },
  {
    value: "moderate" as const,
    label: "J'attends sans paniquer",
    desc: "Je peux tenir une baisse si le plan reste coherent avec mon horizon.",
  },
  {
    value: "aggressive" as const,
    label: "Je peux accepter la baisse",
    desc: "Je vise plus long terme et j'assume une volatilite plus forte.",
  },
]

const HORIZON_OPTIONS = [
  { value: "short" as const,  label: "Court terme", desc: "Moins d'1 an" },
  { value: "medium" as const, label: "Moyen terme", desc: "1 à 3 ans" },
  { value: "long" as const,   label: "Long terme",  desc: "Plus de 3 ans" },
]

const LIQUIDITY_OPTIONS = [
  { value: "low" as const, label: "Peu de besoin", desc: "Je peux laisser ce capital travailler longtemps." },
  { value: "medium" as const, label: "Besoin modere", desc: "Je veux garder une marge de manoeuvre raisonnable." },
  { value: "high" as const, label: "Besoin eleve", desc: "Je peux avoir besoin de liquidite assez vite." },
]

const PORTFOLIO_PREFERENCE_OPTIONS = [
  { value: "security" as const, label: "Securite", desc: "Priorite a la stabilite relative et a la lisibilite." },
  { value: "balance" as const, label: "Equilibre", desc: "Je cherche un compromis entre defense et croissance." },
  { value: "growth" as const, label: "Croissance", desc: "J'accepte plus de volatilite pour plus de potentiel." },
]

const RISK_CONFIG = {
  faible: { label: "Risque faible", dot: "bg-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" },
  modéré: { label: "Risque modéré", dot: "bg-amber-500",   text: "text-amber-600",   bg: "bg-amber-50",   border: "border-amber-200"   },
  élevé:  { label: "Risque élevé",  dot: "bg-red-500",     text: "text-red-600",     bg: "bg-red-50",     border: "border-red-200"     },
}

const ASSET_BAR: Record<string, string> = {
  BTC: "bg-amber-500", ETH: "bg-blue-500", SOL: "bg-purple-500",
  BNB: "bg-yellow-500", XRP: "bg-sky-500", ADA: "bg-blue-600",
  AVAX: "bg-red-500", DOT: "bg-pink-500", LINK: "bg-blue-700",
  NEAR: "bg-green-500", MATIC: "bg-violet-500", POL: "bg-violet-500",
}

const LOADING_STEPS = [
  "Lecture du profil investisseur…",
  "Analyse des conditions de marché…",
  "Calcul des allocations optimales…",
  "Rédaction du plan d'action…",
]

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 20, premium: Infinity }
const PLAN_ACCESS: Record<string, { label: string; included: string[]; locked: string[] }> = {
  free: {
    label: "Free",
    included: ["1 analyse / mois", "Analyse de base", "Historique sur 3 analyses"],
    locked: ["Signal marché Pro", "Export PDF Pro", "Projections Premium"],
  },
  pro: {
    label: "Pro",
    included: ["20 analyses / mois", "Signal marché", "Export PDF", "Historique sur 10 analyses"],
    locked: ["Stratégies avancées Premium", "Projections Premium", "Alertes de risque Premium"],
  },
  premium: {
    label: "Premium",
    included: ["Analyses illimitées", "Stratégies avancées", "Projections", "Alertes de risque"],
    locked: [],
  },
}

const LOCKED_INSIGHT_CARDS = {
  free: [
    {
      title: "Signal marche detaille",
      body: "Lecture du regime marche, dominance BTC et pression sur les altcoins.",
      upgrade: "Pro",
      featureId: "market_signal",
    },
    {
      title: "Reequilibrage guide",
      body: "Seuils simples pour ajuster le plan si le marche accelere ou corrige.",
      upgrade: "Pro",
      featureId: "rebalancing",
    },
    {
      title: "Scenarios alternatifs",
      body: "Lecture defensive, equilibree et dynamique selon le contexte du moment.",
      upgrade: "Premium",
      featureId: "scenarios",
    },
  ],
  pro: [
    {
      title: "Scenarios alternatifs",
      body: "Plans defensif, equilibre et offensif selon la phase de marche.",
      upgrade: "Premium",
      featureId: "scenarios",
    },
    {
      title: "Alertes de risque",
      body: "Points de vigilance supplementaires sur volatilite, concentration et timing.",
      upgrade: "Premium",
      featureId: "risk_alerts",
    },
    {
      title: "Strategie avancee",
      body: "Reequilibrage et execution plus fins pour un suivi plus exigeant.",
      upgrade: "Premium",
      featureId: "advanced_strategy",
    },
  ],
  premium: [],
} as const

const FORM_STEP_GUIDANCE = [
  "Cette question mesure votre reaction face a une vraie baisse de marche, pas une tolerance au risque abstraite.",
  "On calibre ici la perte supportable pour eviter un plan que vous abandonneriez au premier choc.",
  "L'horizon et le besoin de liquidite indiquent si le plan peut viser la patience ou doit rester plus defensif.",
  "Le capital actuel et les apports servent a distinguer ce que vous pouvez deployer maintenant de ce que vous ajouterez ensuite.",
  "Vos objectifs et votre preference securite, equilibre ou croissance orientent la structure du portefeuille.",
  "Le niveau crypto adapte le vocabulaire, la densite de l'explication et le type de guidance.",
  "Le rythme d'investissement et le mode d'execution transforment une allocation theorique en plan faisable.",
  "Les actifs deja detenus et les exclusions evitent une analyse deconnectee de votre situation reelle.",
] as const

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAnalysis(raw: any): Analysis {
  let plan: string[] = []
  if (Array.isArray(raw.plan)) {
    plan = raw.plan.map((s: unknown) => String(s ?? "").trim()).filter(Boolean)
  } else if (typeof raw.plan === "string" && raw.plan.trim()) {
    plan = raw.plan.split(/\n|;/).map((s: string) => s.replace(/^\d+[\.\)\-]\s*/, "").trim()).filter(Boolean)
  } else if (raw.plan && typeof raw.plan === "object") {
    plan = Object.values(raw.plan).map((s) => String(s ?? "").trim()).filter(Boolean)
  }
  if (plan.length === 0) plan = ["Vérifier les conditions de marché avant tout investissement."]

  let allocation: Analysis["allocation"] = []
  if (Array.isArray(raw.allocation)) {
    allocation = raw.allocation
      .filter((a: unknown) => a && typeof a === "object")
      .map((a: Record<string, unknown>) => ({
        asset:      String(a.asset ?? "").toUpperCase().trim(),
        percentage: Math.round(Number(a.percentage) || 0),
        note:       typeof a.note === "string" && a.note.trim() ? a.note.trim() : undefined,
      }))
      .filter((a: { asset: string }) => a.asset)
  }

  const risk  = ["faible", "modéré", "élevé"].includes(raw.risk) ? raw.risk as Analysis["risk"] : "modéré"
  const score = Number(raw.score)

  return {
    score:         Number.isFinite(score) && score >= 1 && score <= 100 ? Math.round(score) : 75,
    risk, allocation, plan,
    explanation:      typeof raw.explanation      === "string" ? raw.explanation.trim()      : "",
    marketSignal:     typeof raw.marketSignal     === "string" ? raw.marketSignal.trim()     : undefined,
    entryStrategy:    typeof raw.entryStrategy    === "string" ? raw.entryStrategy.trim()    : undefined,
    rebalanceNote:    typeof raw.rebalanceNote    === "string" ? raw.rebalanceNote.trim()    : undefined,
    pedagogy:         typeof raw.pedagogy         === "string" ? raw.pedagogy.trim()         : undefined,
    marketVerdictNote:typeof raw.marketVerdictNote=== "string" ? raw.marketVerdictNote.trim(): undefined,
    marketInsight:    typeof raw.marketInsight    === "string" ? raw.marketInsight.trim()    : undefined,
    nextReview:       typeof raw.nextReview       === "string" ? raw.nextReview.trim()       : undefined,
    marketVerdict: ["favorable", "neutre", "risqué"].includes(raw.marketVerdict)
      ? raw.marketVerdict as Analysis["marketVerdict"] : undefined,
    executionNow: Array.isArray(raw.executionNow)
      ? (raw.executionNow as unknown[])
          .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
          .map((e) => ({ crypto: String(e.crypto ?? "").toUpperCase().trim(), amount: String(e.amount ?? "").trim() }))
          .filter((e) => !!e.crypto)
      : [],
    executionLater: Array.isArray(raw.executionLater)
      ? (raw.executionLater as unknown[])
          .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
          .map((e) => ({ crypto: String(e.crypto ?? "").toUpperCase().trim(), condition: String(e.condition ?? "").trim() }))
          .filter((e) => !!e.crypto)
      : [],
    errorsToAvoid: Array.isArray(raw.errorsToAvoid)
      ? (raw.errorsToAvoid as unknown[]).map(String).filter(Boolean).slice(0, 4)
      : [],
    timePlan: Array.isArray(raw.timePlan)
      ? (raw.timePlan as unknown[])
          .filter((t): t is Record<string, unknown> => !!t && typeof t === "object")
          .map((t) => ({ period: String(t.period ?? "").trim(), action: String(t.action ?? "").trim() }))
          .filter((t) => !!t.period)
      : [],
    aiSignature: typeof raw.aiSignature === "string" ? raw.aiSignature.trim() : undefined,
    projection: Array.isArray(raw.projection)
      ? (raw.projection as unknown[])
          .filter((p): p is Record<string, unknown> => !!p && typeof p === "object")
          .map((p) => ({ scenario: String(p.scenario ?? "").trim(), outcome: String(p.outcome ?? "").trim() }))
          .filter((p) => !!p.scenario)
          .slice(0, 3)
      : [],
    disclaimer:    typeof raw.disclaimer    === "string" ? raw.disclaimer.trim()
      : "Investissement spéculatif. Risque de perte totale du capital.",
  }
}

// ── Score Gauge SVG ───────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const size = 140
  const sw = 8
  const r = (size - sw) / 2
  const cx = size / 2
  const cy = size / 2 + 10
  const startAngle = Math.PI
  const endAngle   = 0
  const totalAngle = Math.PI
  const pct = score / 100
  const filled = startAngle - pct * totalAngle

  const toXY = (angle: number) => ({
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle) * -1,
  })

  const s = toXY(startAngle)
  const e = toXY(endAngle)
  const f = toXY(filled)

  const bgArc  = `M ${s.x} ${s.y} A ${r} ${r} 0 0 1 ${e.x} ${e.y}`
  const fillArc = `M ${s.x} ${s.y} A ${r} ${r} 0 ${pct > 0.5 ? "0" : "0"} 1 ${f.x} ${f.y}`

  const color = score >= 85 ? "#3f8f78" : score >= 70 ? "#b69357" : "#a35f68"
  const label = score >= 85 ? "Excellent" : score >= 70 ? "Solide" : "À affiner"

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`} overflow="visible">
          {/* Track */}
          <path d={bgArc} fill="none" stroke="#e5e7eb" strokeWidth={sw} strokeLinecap="round" />
          {/* Fill */}
          {pct > 0.01 && (
            <path d={fillArc} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
              opacity={0.95} />
          )}
          {/* Needle dot */}
          <circle cx={f.x} cy={f.y} r={3.5} fill={color} />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-0.5">
          <span className="text-4xl font-semibold tabular-nums leading-none tracking-tight" style={{ color }}>{score}</span>
          <span className="mt-0.5 text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="mt-1 text-sm font-semibold text-foreground">{label}</span>
    </div>
  )
}

function PlanLimitModal({ onClose, plan }: { onClose: () => void; plan: string }) {
  const upgradePlan = plan === "pro" ? "Premium" : "Pro"
  const title = plan === "pro" ? "Quota Pro atteint" : "Analyse du mois déjà utilisée"
  const body = plan === "pro"
    ? "Vos 20 analyses Pro du mois sont déjà utilisées. Passez au Premium pour continuer sans limite."
    : "Votre analyse gratuite du mois est déjà utilisée. Passez au Pro pour relancer une analyse tout de suite."
  const featureList = plan === "pro"
    ? ["Analyses IA illimitées", "Projections de scénarios", "Alertes de risque", "Stratégie avancée"]
    : ["20 analyses IA par mois", "Historique complet", "Données marché enrichies", "Export PDF"]
  const priceLabel = plan === "pro" ? "59,99 €/mois" : "24,99 €/mois"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center justify-center w-12 h-12 bg-secondary border border-border rounded-2xl mx-auto mb-5">
          <Lock className="w-6 h-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-black text-foreground text-center mb-2">{title}</h2>
        <p className="text-muted-foreground text-sm text-center mb-6 leading-relaxed">
          {body}
        </p>
        <div className="bg-secondary rounded-2xl p-4 mb-6 border border-border">
          <p className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest">Plan {upgradePlan} — {priceLabel}</p>
          <ul className="space-y-2">
            {featureList.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-3.5 h-3.5 text-foreground shrink-0" />{f}
              </li>
            ))}
          </ul>
        </div>
        <Link href="/pricing" className="block w-full text-center py-3.5 bg-foreground hover:bg-foreground/90 text-background font-bold rounded-2xl transition-all mb-3">
          Comparer les plans
        </Link>
        <button onClick={onClose} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5">
          Rester sur ce plan
        </button>
      </div>
    </div>
  )
}

export function AdvisorClient({ userId, plan, monthlyCount }: Props) {
  const limit       = PLAN_LIMITS[plan] ?? 1
  const limitReached = monthlyCount >= limit
  const planAccess = PLAN_ACCESS[plan] ?? PLAN_ACCESS.free

  const [step, setStep]     = useState<"form" | "loading" | "result">("form")
  const [form, setForm]     = useState<InvestorForm>({
    riskTolerance: "moderate", horizon: "medium",
    capital: "", monthlyIncome: "", monthlyContribution: "", goals: [],
    lossTolerance: "", preciseObjective: "", investmentFrequency: "",
    excludedCryptos: "", experience: "intermediate", buyStrategy: "",
    liquidityNeed: "", portfolioPreference: "", currentHoldings: "",
  })
  const [formStep, setFormStep]             = useState(0)
  const [analysis, setAnalysis]             = useState<Analysis | null>(null)
  const [error, setError]                   = useState("")

  useEffect(() => {
    if (process.env.NODE_ENV === "production" || typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    if (params.get("advisorStep") !== "strategy") return

    setForm((prev) => ({
      ...prev,
      lossTolerance: prev.lossTolerance || "medium",
      capital: prev.capital || "1000",
      monthlyIncome: prev.monthlyIncome || "3200",
      goals: prev.goals.length > 0 ? prev.goals : ["Diversification"],
      preciseObjective: prev.preciseObjective || "Construire un portefeuille progressif.",
    }))
    setFormStep(6)
    setError("")
  }, [])
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [loadingStep, setLoadingStep]       = useState(0)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (step !== "loading") return
    setLoadingStep(0); setElapsedSeconds(0)
    const si = setInterval(() => setLoadingStep((s) => Math.min(s + 1, LOADING_STEPS.length - 1)), 4000)
    const ti = setInterval(() => setElapsedSeconds((s) => s + 1), 1000)
    return () => { clearInterval(si); clearInterval(ti) }
  }, [step])

  const formSteps = [
    "Reaction au risque",
    "Perte acceptable",
    "Horizon et liquidite",
    "Capital",
    "Objectif et style",
    "Niveau crypto",
    "Execution",
    "Portefeuille actuel",
  ]
  const lastFormStep = formSteps.length - 1
  const progressPct = Math.round(((formStep + 1) / formSteps.length) * 100)

  const toggleGoal = (goal: string) =>
    setForm((p) => ({ ...p, goals: p.goals.includes(goal) ? p.goals.filter((g) => g !== goal) : [...p.goals, goal] }))

  const validateFormStep = () => {
    if (formStep === 1 && !form.lossTolerance) {
      return "Choisissez la perte que vous pouvez accepter."
    }
    if (formStep === 2 && !form.liquidityNeed) {
      return "Precisez votre besoin de liquidite."
    }
    if (formStep === 3) {
      if (!form.capital) return "Ajoutez votre capital de départ."
      if (!form.monthlyIncome) return "Ajoutez votre revenu mensuel."
    }
    if (formStep === 4) {
      if (form.goals.length === 0) return "Choisissez au moins un objectif."
      if (!form.preciseObjective.trim()) return "Précisez votre objectif principal."
      if (!form.portfolioPreference) return "Indiquez si vous cherchez surtout de la securite, un equilibre ou de la croissance."
    }
    if (formStep === 6 && (!form.investmentFrequency || !form.buyStrategy)) {
      return "Choisissez une option dans chaque section pour continuer."
    }
    return ""
  }

  const goNext = () => {
    const validationError = validateFormStep()
    if (validationError) { setError(validationError); return }
    setError("")
    setFormStep((s) => Math.min(s + 1, lastFormStep))
  }

  const handleAnalyze = async () => {
    if (limitReached) { setShowUpgradeModal(true); return }
    if (!form.lossTolerance) { setError("Choisissez la perte que vous pouvez accepter."); setFormStep(1); return }
    if (!form.liquidityNeed) { setError("Precisez votre besoin de liquidite."); setFormStep(2); return }
    if (!form.capital) { setError("Ajoutez votre capital de départ."); return }
    if (!form.monthlyIncome) { setError("Ajoutez votre revenu mensuel."); setFormStep(3); return }
    if (form.goals.length === 0) { setError("Choisissez au moins un objectif."); setFormStep(4); return }
    if (!form.preciseObjective.trim()) { setError("Précisez votre objectif principal."); setFormStep(4); return }
    if (!form.portfolioPreference) { setError("Indiquez si vous cherchez surtout de la securite, un equilibre ou de la croissance."); setFormStep(4); return }
    if (!form.investmentFrequency || !form.buyStrategy) { setError("Choisissez une option dans chaque section pour continuer."); setFormStep(6); return }
    setError(""); setStep("loading")
    Analytics.advisorStarted(plan)
    try {
      const res  = await fetch("/api/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, userId }) })
      const data = await res.json()
      if (res.status === 429 && data.upgradeRequired) { setStep("form"); setShowUpgradeModal(true); return }
      if (!res.ok) throw new Error(data.error || "L'analyse n'a pas pu être générée. Réessayez dans quelques instants.")
      const normalized = normalizeAnalysis(data)
      Analytics.advisorCompleted(plan, normalized.allocation?.length ?? 0, normalized.score ?? 0)
      setAnalysis(normalized); setStep("result")
    } catch (err) {
      Analytics.advisorError(plan, err instanceof Error ? err.message.slice(0, 60) : "unknown")
      setError(err instanceof Error ? err.message : "L'analyse n'a pas pu être générée. Réessayez dans quelques instants.")
      setStep("form")
    }
  }

  // Loading
  if (step === "loading") {
    const maxDur  = plan === "premium" ? 75 : plan === "pro" ? 70 : 60
    const progress = Math.min(95, Math.round((elapsedSeconds / maxDur) * 100))
    return (
      <div className="flex items-center justify-center min-h-[65vh] px-4">
        <div className="text-center max-w-xs w-full">
          <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-card">
            <Brain className="w-8 h-8 text-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
            </span>
          </div>
          <h2 className="mb-1 text-2xl font-semibold tracking-tight text-foreground">Analyse en cours</h2>
          <p className="text-muted-foreground text-sm mb-8">
            {plan === "premium" ? "Claude Opus · analyse approfondie" : plan === "pro" ? "Claude Sonnet · analyse détaillée" : "Claude Haiku · analyse de base"}
          </p>
          <p className="text-[13px] text-muted-foreground mb-6">
            Cela peut prendre jusqu&apos;à 60-90 secondes selon la charge serveur.
          </p>
          <div className="w-full bg-secondary rounded-full h-1 mb-6 overflow-hidden">
            <div className="h-1 rounded-full bg-foreground transition-all duration-1000" style={{ width: `${progress}%` }} />
          </div>
          <div className="space-y-2.5 text-left">
            {LOADING_STEPS.map((s, i) => (
              <div key={i} className={cn("flex items-center gap-3 text-xs transition-all duration-300",
                i < loadingStep ? "text-muted-foreground/40" : i === loadingStep ? "text-foreground font-medium" : "text-muted-foreground/20")}>
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0 transition-all",
                  i < loadingStep ? "bg-muted-foreground/30" : i === loadingStep ? "bg-foreground" : "bg-muted-foreground/20")} />
                {s}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Result
  if (step === "result" && analysis) {
    return (
      <AnalysisResult
        analysis={analysis}
        plan={plan}
        experience={form.experience}
        onNew={() => { setStep("form"); setAnalysis(null) }}
      />
    )
  }

  // Form
  const selBtn = "border-foreground bg-secondary text-foreground"
  const defBtn = "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"

  return (
    <>
      {showUpgradeModal && <PlanLimitModal plan={plan} onClose={() => setShowUpgradeModal(false)} />}
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="mb-1 text-3xl font-semibold tracking-tight text-foreground">Conseiller IA</h1>
          <p className="text-muted-foreground text-sm">
            {plan === "premium" ? "Claude Opus · stratégie institutionnelle" : plan === "pro" ? "Claude Sonnet · analyse détaillée" : "Claude Haiku · analyse de base"}
            {" · "}analyse complète en 60-90 s selon la charge
          </p>
        </div>

        {limitReached ? (
          <div className="surface-soft mb-6 flex items-start gap-3 p-5">
            <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="mb-0.5 text-sm font-semibold text-foreground">Accès temporairement bloqué</p>
              <p className="text-sm text-muted-foreground mb-3">
                {plan === "pro"
                  ? "Vos 20 analyses Pro du mois sont déjà utilisées. Passez au Premium pour continuer sans limite."
                  : "Votre analyse gratuite du mois est déjà utilisée. Passez au Pro pour continuer."}
              </p>
              <Link href="/pricing" className="btn-primary inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold">
                Comparer les plans <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : plan === "free" ? (
          <div className="surface-soft mb-6 flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            1 analyse incluse ce mois · <Link href="/pricing" className="font-bold text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity">Passer au Pro pour 20 analyses</Link>
          </div>
        ) : null}

        <div className="surface-card mb-5 p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="eyebrow">Plan actif</p>
              <p className="text-sm font-semibold text-foreground">{planAccess.label}</p>
            </div>
            <Link href="/pricing" className="text-xs font-semibold text-foreground underline underline-offset-2 hover:opacity-75">
              Comprendre les limites
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              {planAccess.included.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  {item}
                </div>
              ))}
            </div>
            {planAccess.locked.length > 0 && (
              <div className="space-y-1.5">
                {planAccess.locked.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="surface-card p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="eyebrow">
                Question {formStep + 1}/{formSteps.length}
              </span>
              <span className="text-xs font-semibold text-foreground">{formSteps[formStep]}</span>
            </div>
            <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
          <div className="surface-soft px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="eyebrow">
                  Ce que l&apos;IA calibre ici
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
                  {FORM_STEP_GUIDANCE[formStep]}
                </p>
              </div>
              <div className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                Mode {EXPERIENCE_OPTIONS.find((option) => option.value === form.experience)?.label ?? "Intermediaire"}
              </div>
            </div>
          </div>
          {formStep === 0 && (
          <FormSection
            number={1}
            title="Si ton portefeuille baisse de 20%, tu fais quoi ?"
            icon={<Shield className="w-3.5 h-3.5 text-muted-foreground" />}
            helper="On cherche la reaction que vous pourrez vraiment tenir quand le marche bouge, pas une tolerance abstraite."
          >
            <div className="grid grid-cols-3 gap-2">
              {RISK_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, riskTolerance: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.riskTolerance === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.riskTolerance === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </FormSection>
          )}

          {formStep === 1 && (
          <FormSection
            number={2}
            title="Tolérance à la perte"
            icon={<Shield className="w-3.5 h-3.5 text-muted-foreground" />}
            helper="Cette limite sert a eviter une strategie impossible a suivre quand le marche corrige."
          >
            <div className="grid grid-cols-3 gap-2">
              {LOSS_TOLERANCE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, lossTolerance: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.lossTolerance === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.lossTolerance === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </FormSection>
          )}

          {formStep === 2 && (
          <FormSection
            number={3}
            title="Combien de temps peux-tu laisser ce plan travailler ?"
            icon={<TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />}
            helper="L'horizon et le besoin de liquidite servent a distinguer un plan patient d'un plan qui doit rester plus defensif."
          >
            <div className="grid grid-cols-3 gap-2">
              {HORIZON_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, horizon: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.horizon === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.horizon === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Besoin de liquidite</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {LIQUIDITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((p) => ({ ...p, liquidityNeed: opt.value }))}
                    className={cn("p-3 rounded-lg border text-left transition-all", form.liquidityNeed === opt.value ? selBtn : defBtn)}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className={cn("text-xs mt-0.5", form.liquidityNeed === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </FormSection>
          )}

          {formStep === 3 && (
          <FormSection
            number={4}
            title="Capital"
            helper="Le capital actuel et vos apports futurs servent a separer ce qui est deja investi de ce qui sera deploye progressivement."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Capital initial (€) <span className="text-red-500">*</span></label>
                <input type="number" value={form.capital}
                  onChange={(e) => setForm((p) => ({ ...p, capital: e.target.value }))}
                  placeholder="ex : 5 000"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Revenu mensuel (€) <span className="text-red-500">*</span></label>
                <input type="number" value={form.monthlyIncome}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyIncome: e.target.value }))}
                  placeholder="ex : 3 000"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all" />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">Apport mensuel (€) <span className="text-muted-foreground/50 font-normal">optionnel</span></label>
                <input type="number" value={form.monthlyContribution}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyContribution: e.target.value }))}
                  placeholder="ex : 200"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all" />
              </div>
            </div>
          </FormSection>
          )}

          {formStep === 4 && (
          <FormSection
            number={5}
            title="Objectifs"
            icon={<Target className="w-3.5 h-3.5 text-muted-foreground" />}
            helper="L'IA arbitre differemment selon que vous cherchez croissance, discipline, diversification ou preservation du capital."
          >
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((goal) => {
                const sel = form.goals.includes(goal)
                return (
                  <button key={goal} onClick={() => toggleGoal(goal)}
                    className={cn("px-3 py-2.5 rounded-lg border text-sm text-left flex items-center gap-2 transition-all",
                      sel ? selBtn : defBtn)}>
                    <div className={cn("w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0",
                      sel ? "bg-secondary border-foreground" : "border-border")}>
                      {sel && <div className="w-1.5 h-1.5 rounded-sm bg-foreground" />}
                    </div>
                    <span className="font-medium leading-tight text-xs">{goal}</span>
                  </button>
                )
              })}
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-muted-foreground mb-1.5">Objectif précis <span className="text-red-500">*</span></label>
              <input type="text" value={form.preciseObjective}
                onChange={(e) => setForm((p) => ({ ...p, preciseObjective: e.target.value }))}
                placeholder="ex : acheter un logement dans 3 ans"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all" />
            </div>
            <div className="mt-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tu recherches surtout...</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {PORTFOLIO_PREFERENCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setForm((p) => ({ ...p, portfolioPreference: opt.value }))}
                    className={cn("p-3 rounded-lg border text-left transition-all", form.portfolioPreference === opt.value ? selBtn : defBtn)}
                  >
                    <div className="text-sm font-bold">{opt.label}</div>
                    <div className={cn("text-xs mt-0.5", form.portfolioPreference === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </FormSection>
          )}

          {formStep === 5 && (
          <FormSection
            number={6}
            title="Niveau crypto"
            helper="Choisissez le niveau de vocabulaire et de densite d'analyse qui vous aide vraiment a agir."
          >
            <div className="grid grid-cols-3 gap-2">
              {EXPERIENCE_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, experience: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.experience === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.experience === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </FormSection>
          )}

          {formStep === 6 && (
          <FormSection
            number={7}
            title="Strategie d'achat"
            helper="Ces deux choix permettent de transformer une allocation theorique en plan d'execution realiste."
          >
            <div className="mb-4 rounded-xl border border-border bg-secondary/30 px-4 py-3">
              <p className="text-xs font-semibold text-foreground">Choisissez une option dans chaque section pour continuer.</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Le rythme d&apos;investissement et le mode d&apos;execution servent a construire un plan d&apos;achat realiste.
              </p>
            </div>
            <div className="mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">1. Rythme d&apos;investissement</p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {INVESTMENT_FREQUENCY_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, investmentFrequency: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.investmentFrequency === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.investmentFrequency === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
            <div className="mb-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">2. Mode d&apos;execution</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {BUY_STRATEGY_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, buyStrategy: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.buyStrategy === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.buyStrategy === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </FormSection>
          )}

          {formStep === 7 && (
          <FormSection
            number={8}
            title="Portefeuille actuel"
            optional
            helper="Si vous detenez deja certains actifs ou si vous refusez d'en voir apparaitre, l'analyse doit en tenir compte."
          >
            <div className="grid gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Actifs deja detenus <span className="text-muted-foreground/50 font-normal">optionnel</span>
                </label>
                <input
                  type="text"
                  value={form.currentHoldings}
                  onChange={(e) => setForm((p) => ({ ...p, currentHoldings: e.target.value }))}
                  placeholder="Ex : BTC, ETH, SOL"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                  Actifs a exclure <span className="text-muted-foreground/50 font-normal">optionnel</span>
                </label>
                <input type="text" value={form.excludedCryptos}
                  onChange={(e) => setForm((p) => ({ ...p, excludedCryptos: e.target.value }))}
                  placeholder="Ex : XRP, DOGE, SHIB — separes par des virgules"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all" />
              </div>
            </div>
          </FormSection>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="grid grid-cols-[auto_1fr] gap-2 mt-1">
            <button onClick={() => { setError(""); setFormStep((s) => Math.max(0, s - 1)) }}
              disabled={formStep === 0}
              className={cn(
                "px-4 py-4 rounded-2xl border border-border font-bold text-sm transition-all",
                formStep === 0 ? "text-muted-foreground/40 cursor-not-allowed" : "text-foreground hover:bg-secondary"
              )}>
              Retour
            </button>
            {formStep < lastFormStep ? (
              <button onClick={goNext}
                disabled={formStep === 6 && (!form.investmentFrequency || !form.buyStrategy)}
                className="w-full py-4 bg-foreground hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed text-background font-black rounded-2xl transition-all flex items-center justify-center gap-2.5 text-base">
                Continuer
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleAnalyze}
                className="w-full py-4 bg-foreground hover:bg-foreground/90 text-background font-black rounded-2xl transition-all flex items-center justify-center gap-2.5 text-base">
                <Brain className="w-5 h-5" />
                Générer mon analyse
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          <p className="text-center text-[11px] text-muted-foreground/50 pb-2">
            Claude AI · donnees CoinGecko, avec Kraken si disponible pour les snapshots portefeuille
          </p>
        </div>
      </div>
    </>
  )
}

function FormSection({ number, title, icon, optional, helper, children }: {
  number: number
  title: string
  icon?: React.ReactNode
  optional?: boolean
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="surface-card p-5">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-5 shrink-0 text-[10px] font-semibold tabular-nums text-muted-foreground/50">0{number}</span>
        <div className="w-px h-3.5 bg-border shrink-0" />
        <div>
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
            {icon}{title}
            {optional && <span className="text-muted-foreground font-normal text-xs ml-1">(optionnel)</span>}
          </h3>
          {helper && (
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{helper}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function ResultSection({
  eyebrow,
  title,
  action,
  children,
}: {
  eyebrow?: string
  title: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="surface-card">
      <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div>
          {eyebrow ? (
            <p className="eyebrow">{eyebrow}</p>
          ) : null}
          <h2 className="mt-1 text-base font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  )
}

function LockedProInsight({
  title,
  body,
  upgrade,
  onClick,
}: {
  title: string
  body: string
  upgrade: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="surface-soft relative w-full overflow-hidden p-4 text-left transition-colors hover:bg-secondary/80 cursor-pointer"
    >
      <div className="relative">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{title}</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{upgrade}</p>
            </div>
          </div>
          <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Débloquer →
          </span>
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      </div>
    </button>
  )
}

function AdvisorNextStepCard({
  href,
  title,
  body,
  label,
  icon,
}: {
  href: string
  title: string
  body: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="surface-card group px-4 py-4 transition-colors hover:bg-secondary"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary transition-colors group-hover:bg-background">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            {label}
            <ArrowRight className="h-3.5 w-3.5" />
          </p>
        </div>
      </div>
    </Link>
  )
}

// ── Analysis Result ───────────────────────────────────────────────────────────
function AnalysisResult({
  analysis,
  plan,
  experience,
  onNew,
}: {
  analysis: Analysis
  plan: string
  experience: Experience
  onNew: () => void
}) {
  const canExport = plan === "pro" || plan === "premium"
  const isPro     = plan === "pro" || plan === "premium"
  const [exportError, setExportError] = useState("")
  const upgradeModal = useUpgradeModal()
  const primaryAction = analysis.executionNow?.[0] ?? null
  const strategy = analysis.entryStrategy?.trim() ? analysis.entryStrategy.trim() : null
  const avoidItems = (analysis.errorsToAvoid ?? []).map((item) => item.trim()).filter(Boolean).slice(0, 4)
  const showAiRecommendations = Boolean(primaryAction || strategy || analysis.nextReview || avoidItems.length > 0)

  const signalInfo = useMemo(() => {
    if (!isPro) return null

    const s = [
      analysis.marketSignal,
      analysis.marketVerdict,
      analysis.marketVerdictNote,
      analysis.marketInsight,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()

    if (s.includes("bull") || s.includes("haussier") || s.includes("favorable") || s.includes("positif") || s.includes("hausse")) {
      return { label: "Haussier", short: "BULL", color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", Icon: TrendingUp }
    }
    if (s.includes("bear") || s.includes("baissier") || s.includes("prudence") || s.includes("baisse") || s.includes("négatif")) {
      return { label: "Baissier", short: "BEAR", color: "text-red-600", bg: "bg-red-50", border: "border-red-200", Icon: TrendingDown }
    }
    return { label: "Neutre", short: "NEUTRAL", color: "text-muted-foreground", bg: "bg-secondary", border: "border-border", Icon: Activity }
  }, [isPro, analysis.marketSignal, analysis.marketVerdict, analysis.marketVerdictNote, analysis.marketInsight])

  const risk = RISK_CONFIG[analysis.risk] ?? RISK_CONFIG["modéré"]
  const experienceGuide = {
    beginner: {
      label: "Mode debutant",
      tone: "On garde le vocabulaire simple et on insiste sur ce que vous devez faire, pas sur le jargon.",
      takeaways: [
        "Commencez par comprendre l'allocation avant de chercher a optimiser le timing.",
        "Les baisses intermediaires sont normales: la discipline compte plus qu'un point d'entree parfait.",
        "Revenez sur le dashboard pour suivre le portefeuille, pas pour chasser chaque variation de prix.",
      ],
    },
    intermediate: {
      label: "Mode intermediaire",
      tone: "On equilibre pedagogie, execution et contexte marche pour vous aider a agir sans surcharger la lecture.",
      takeaways: [
        "L'allocation cherche un compromis entre coeur de portefeuille et actifs satellites.",
        "Le plan d'entree doit rester compatible avec votre rythme d'investissement reel.",
        "Le suivi compte autant que l'achat initial: snapshots et analyses servent a garder le cap.",
      ],
    },
    expert: {
      label: "Mode avance",
      tone: "Lecture plus directe: structure d'allocation, exposition au risque, conditions d'execution et points de relecture.",
      takeaways: [
        "Le portefeuille est pense comme une structure de risque avant d'etre une simple liste d'actifs.",
        "Les satellites doivent rester proportionnes a la liquidite et au regime de volatilite.",
        "Le plan d'action sert a arbitrer l'execution et le reequilibrage, pas a predire le marche.",
      ],
    },
  }[experience]
  const risksToWatch = (
    avoidItems.length > 0
      ? avoidItems
      : [
          analysis.risk === "élevé" ? "L'exposition aux actifs satellites reste la première source de volatilité." : null,
          analysis.score < 70 ? "Le plan merite encore un cadrage plus fin sur le risque et l'objectif." : null,
          "Le marche crypto reste corrélé en cas de choc brutal.",
          "Les actifs secondaires bougent plus vite que BTC et ETH.",
        ]
  ).filter(Boolean).slice(0, 4) as string[]
  const whyPlanItems = [
    analysis.marketInsight,
    analysis.marketVerdictNote,
    analysis.pedagogy,
  ].filter((item): item is string => Boolean(item && item.trim()))
  const nextActions = [
    primaryAction
      ? `Executer l'action principale: ${primaryAction.crypto}${primaryAction.amount ? ` pour ${primaryAction.amount}` : ""}.`
      : null,
    strategy ? strategy : null,
    analysis.nextReview ? `Revenir sur votre allocation: ${analysis.nextReview}.` : null,
  ].filter(Boolean).slice(0, 3) as string[]
  const lockedInsights =
    plan === "premium"
      ? []
      : [...LOCKED_INSIGHT_CARDS[plan as "free" | "pro"]]

  const handleExport = () => {
    setExportError("")
    const date      = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    const dateShort = new Date().toISOString().split("T")[0]
    const modelLabel = plan === "premium" ? "Claude Opus 4.7" : plan === "pro" ? "Claude Sonnet 4.6" : "Claude Haiku 4.5"
    const scoreColor = analysis.score >= 85 ? "#10b981" : analysis.score >= 70 ? "#f59e0b" : "#f87171"

    const allocationRows = analysis.allocation.map((a) => `
      <tr>
        <td style="padding:10px 14px;font-weight:700;color:#0f172a;border-bottom:1px solid #f1f5f9;">${a.asset}</td>
        <td style="padding:10px 14px;text-align:right;font-weight:800;color:#0f172a;border-bottom:1px solid #f1f5f9;">${a.percentage}%</td>
        <td style="padding:10px 14px;color:#64748b;font-size:11px;border-bottom:1px solid #f1f5f9;">${a.note ?? ""}</td>
      </tr>`).join("")

    const planSteps = analysis.plan.map((s, i) => `
      <div style="display:flex;gap:14px;padding:10px 0;border-bottom:1px solid #f8fafc;">
        <span style="color:#cbd5e1;font-weight:800;font-size:11px;min-width:22px;padding-top:2px;">${String(i + 1).padStart(2, "0")}</span>
        <p style="color:#334155;font-size:13px;line-height:1.65;margin:0;">${s}</p>
      </div>`).join("")

    const advancedBlock = (plan === "premium" && (analysis.entryStrategy || analysis.rebalanceNote)) ? `
      <div style="margin-top:28px;">
        <div style="background:#0f172a;padding:12px 18px;border-radius:10px 10px 0 0;">
          <span style="color:white;font-weight:700;font-size:12px;">STRATÉGIE AVANCÉE · PREMIUM</span>
        </div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;padding:18px;">
          ${analysis.entryStrategy ? `<div style="margin-bottom:14px;"><p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 6px;">Stratégie d'entrée</p><p style="color:#1e293b;font-size:13px;line-height:1.6;margin:0;">${analysis.entryStrategy}</p></div>` : ""}
          ${analysis.rebalanceNote ? `<div><p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;margin:0 0 6px;">Rééquilibrage</p><p style="color:#1e293b;font-size:13px;line-height:1.6;margin:0;">${analysis.rebalanceNote}</p></div>` : ""}
        </div>
      </div>` : ""

    const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Rapport Axiom · ${dateShort}</title>
<style>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Inter',-apple-system,sans-serif;color:#0f172a;background:#fff;font-size:13px}@page{margin:18mm 14mm;size:A4}@media print{.no-print{display:none!important}}</style>
</head><body><div style="max-width:640px;margin:0 auto;padding:40px 32px;">
<div class="no-print" style="background:#0f172a;color:white;padding:10px 16px;border-radius:8px;margin-bottom:28px;display:flex;align-items:center;justify-content:space-between;">
<span style="font-size:12px;font-weight:600;">Rapport prêt</span>
<button onclick="window.print()" style="background:#111111;color:white;border:none;padding:6px 14px;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;">Imprimer / PDF →</button></div>
<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:32px;padding-bottom:24px;border-bottom:2px solid #0f172a;">
<div><div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;"><div style="width:28px;height:28px;background:#111111;border-radius:6px;display:flex;align-items:center;justify-content:center;"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3L13 13" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.4H10.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span style="font-size:16px;font-weight:900;">Axiom</span></div>
<p style="font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.03em;line-height:1.2;">Rapport d'analyse<br>crypto personnalisé</p></div>
<div style="text-align:right;"><div style="font-size:42px;font-weight:900;color:#0f172a;line-height:1;">${analysis.score}</div><div style="font-size:11px;color:#94a3b8;">/100</div><div style="width:40px;height:3px;background:${scoreColor};margin:6px 0 0 auto;border-radius:2px;"></div></div></div>
<div style="display:flex;gap:32px;margin-bottom:28px;">
<div><p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:3px;">Date</p><p style="font-size:12px;font-weight:600;">${date}</p></div>
<div><p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:3px;">Modèle IA</p><p style="font-size:12px;font-weight:600;">${modelLabel}</p></div>
<div><p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:3px;">Plan</p><p style="font-size:12px;font-weight:600;">${plan.charAt(0).toUpperCase() + plan.slice(1)}</p></div></div>
<div style="margin-bottom:28px;"><p style="font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:12px;">Allocation recommandée</p>
<table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;"><thead><tr style="background:#f8fafc;"><th style="padding:10px 14px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;">Actif</th><th style="padding:10px 14px;text-align:right;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;">Allocation</th><th style="padding:10px 14px;text-align:left;font-size:10px;color:#64748b;text-transform:uppercase;font-weight:700;">Note</th></tr></thead><tbody>${allocationRows}</tbody></table></div>
${analysis.marketSignal ? `<div style="background:#0f172a;padding:14px 18px;border-radius:10px;margin-bottom:28px;"><p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;margin-bottom:5px;">Signal marché</p><p style="color:white;font-size:13px;font-weight:600;line-height:1.5;margin:0;">${analysis.marketSignal}</p></div>` : ""}
<div style="margin-bottom:28px;"><p style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:10px;">Analyse de marché</p><p style="color:#334155;font-size:13px;line-height:1.7;">${analysis.explanation}</p></div>
<div style="margin-bottom:28px;"><p style="font-size:10px;color:#94a3b8;text-transform:uppercase;font-weight:700;margin-bottom:10px;">Plan d'action</p>${planSteps}</div>
${advancedBlock}
<div style="margin-top:36px;padding-top:18px;border-top:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
<div style="display:flex;align-items:center;gap:6px;"><div style="width:20px;height:20px;background:#111111;border-radius:4px;display:flex;align-items:center;justify-content:center;"><svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M3 13L8 3L13 13" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 9.4H10.5" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></div><span style="font-size:11px;font-weight:800;">Axiom</span></div>
<p style="font-size:10px;color:#94a3b8;max-width:400px;text-align:right;">${analysis.disclaimer}</p></div>
</div></body></html>`

    const popup = window.open("", "_blank", "width=820,height=960,scrollbars=yes")
    if (!popup) {
      setExportError("Autorisez les pop-ups pour télécharger le PDF.")
      return
    }
    popup.document.write(html); popup.document.close(); popup.focus()
    setTimeout(() => popup.print(), 600)
  }

  return (
    <div className="mx-auto max-w-3xl animate-slide-up pb-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="eyebrow">Analyse terminee · {plan === "premium" ? "Claude Opus 4.7" : plan === "pro" ? "Claude Sonnet 4.6" : "Claude Haiku 4.5"}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Note d&apos;investissement</h1>
        </div>
        <button
          onClick={onNew}
          className="btn-secondary inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4" />
          Nouvelle analyse
        </button>
      </div>

      {/* ── 1. Résumé exécutif ──────────────────────────────────────────────── */}
      <div className="surface-card mb-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <div className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide", risk.bg, risk.border, risk.text)}>
              Risque {risk.label}
            </div>
            {signalInfo && (
              <div className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold", signalInfo.bg, signalInfo.border, signalInfo.color)}>
                {signalInfo.label}
              </div>
            )}
            <div className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
              Score {analysis.score}/100
            </div>
          </div>
          <div className="shrink-0">
            <ScoreGauge score={analysis.score} />
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-semibold leading-7 text-foreground">
            {analysis.overview ?? analysis.explanation}
          </p>
          {analysis.aiSignature && (
            <p className="mt-2 text-[12px] leading-6 text-muted-foreground italic">{analysis.aiSignature}</p>
          )}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="surface-soft px-3 py-2.5">
            <p className="eyebrow">Risque</p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{risk.label}</p>
          </div>
          <div className="surface-soft px-3 py-2.5">
            <p className="eyebrow">Mode</p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{experienceGuide.label}</p>
          </div>
          <div className="surface-soft px-3 py-2.5">
            <p className="eyebrow">Révision</p>
            <p className="mt-1.5 text-sm font-semibold text-foreground">{analysis.nextReview ?? "—"}</p>
          </div>
        </div>
      </div>

      <ResultSection
        eyebrow="Allocation"
        title="Repartition proposee"
        action={<span className="text-xs font-semibold text-muted-foreground">{analysis.allocation.length} actifs</span>}
      >
        <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-4">
            {analysis.allocation.map((alloc) => (
              <div key={alloc.asset}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className={cn("h-2 w-2 shrink-0 rounded-full", ASSET_BAR[alloc.asset] ?? "bg-slate-400")} />
                    <span className="text-sm font-semibold text-foreground">{alloc.asset}</span>
                    {alloc.note ? (
                      <span className="truncate text-[11px] text-muted-foreground">{alloc.note}</span>
                    ) : null}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-foreground">{alloc.percentage}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <div
                    className={cn("h-1.5 rounded-full transition-all duration-700", ASSET_BAR[alloc.asset] ?? "bg-slate-400")}
                    style={{ width: `${alloc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-3xl border border-border bg-secondary/40 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Vue d&apos;ensemble</p>
                <p className="mt-1 text-sm font-semibold text-foreground">Repartition coeur, satellites et reserve</p>
              </div>
            </div>
            <div className="mt-4 h-44">
              <PortfolioChart allocations={analysis.allocation} />
            </div>
          </div>
        </div>
      </ResultSection>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ResultSection eyebrow="Lecture" title="Pourquoi ce plan">
          <div className="space-y-3">
            <p className="text-sm leading-7 text-muted-foreground">{analysis.explanation}</p>
            {whyPlanItems.length > 0 ? (
              <div className="grid gap-3">
                {whyPlanItems.slice(0, 2).map((item) => (
                  <div key={item} className="rounded-2xl border border-border bg-secondary/60 px-4 py-3">
                    <p className="text-sm leading-6 text-foreground">{item}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </ResultSection>

        <ResultSection eyebrow="Vigilance" title="Risques a surveiller">
          <div className="space-y-3">
            {risksToWatch.map((item, index) => (
              <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </ResultSection>
      </div>

      {(analysis.plan.length > 0 || showAiRecommendations || (isPro && analysis.timePlan && analysis.timePlan.length > 0)) && (
        <ResultSection eyebrow="Execution" title="Prochaine action">
          <div className="grid gap-4 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-4">
              {nextActions.length > 0 ? (
                <div className="grid gap-3">
                  {nextActions.map((item, index) => (
                    <div key={`${item}-${index}`} className="rounded-2xl border border-border bg-secondary/60 px-4 py-4">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Action {index + 1}</p>
                      <p className="mt-2 text-sm leading-6 text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              ) : null}
              {analysis.executionNow && analysis.executionNow.length > 0 ? (
                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Execution immediate</p>
                  <div className="mt-3 space-y-3">
                    {analysis.executionNow.map((item, index) => (
                      <div key={`${item.crypto}-${index}`} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/60 px-3 py-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.crypto}</p>
                          <p className="text-xs text-muted-foreground">Action prioritaire</p>
                        </div>
                        <span className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground">
                          {item.amount}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {analysis.plan.length > 0 ? (
                <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Plan d&apos;action</p>
                  <ol className="mt-3 space-y-3">
                    {analysis.plan.slice(0, 5).map((item, index) => (
                      <li key={`${item}-${index}`} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background text-[11px] font-bold text-foreground">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}

              {isPro && analysis.timePlan && analysis.timePlan.length > 0 ? (
                <div className="rounded-2xl border border-border bg-background px-4 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Plan dans le temps</p>
                  <div className="mt-3 space-y-3">
                    {analysis.timePlan.slice(0, 4).map((item, index) => (
                      <div key={`${item.period}-${index}`} className="rounded-2xl border border-border bg-secondary/60 px-3 py-3">
                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{item.period}</p>
                        <p className="mt-1 text-sm leading-6 text-foreground">{item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </ResultSection>
      )}

      {/* ── 6. Ce qu'on surveille ─────────────────────────────────────────── */}
      {(analysis.watchList && analysis.watchList.length > 0) && (
        <ResultSection eyebrow="Vigilance" title="Ce qu&apos;on surveille actuellement">
          <div className="space-y-2.5">
            {analysis.watchList.filter(Boolean).slice(0, 3).map((item, idx) => (
              <div key={`watch-${idx}`} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground/40" />
                <p className="text-sm leading-6 text-muted-foreground">{item}</p>
              </div>
            ))}
          </div>
        </ResultSection>
      )}

      {/* ── 7. Discipline et horizon ─────────────────────────────────────── */}
      <ResultSection eyebrow="Discipline" title="Horizon et cadre de suivi">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Prochaine révision</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{analysis.nextReview ?? "À définir selon le contexte"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/40 px-4 py-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Approche</p>
            <p className="mt-2 text-sm font-semibold text-foreground">{experienceGuide.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{experienceGuide.tone}</p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          {experienceGuide.takeaways.map((item, idx) => (
            <div key={`takeaway-${idx}`} className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-foreground/30" />
              <p className="text-sm leading-6 text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </ResultSection>

      {lockedInsights.length > 0 ? (
        <div className="mt-4" data-testid="advisor-locked-pro-insights">
          <ResultSection
            eyebrow="Pro et Premium"
            title="Ce que vous pouvez debloquer ensuite"
            action={
              <Link href="/pricing" className="text-xs font-semibold text-foreground underline underline-offset-4">
                Voir les offres
              </Link>
            }
          >
            <div className="grid gap-3 md:grid-cols-3">
              {lockedInsights.map((item) => (
                <LockedProInsight
                  key={item.title}
                  title={item.title}
                  body={item.body}
                  upgrade={item.upgrade}
                  onClick={item.featureId ? () => upgradeModal.open(item.featureId!) : undefined}
                />
              ))}
            </div>
          </ResultSection>
        </div>
      ) : null}

      {/* Upgrade modal */}
      {upgradeModal.feature && (
        <UpgradeModal
          feature={upgradeModal.feature}
          open={upgradeModal.isOpen}
          onClose={upgradeModal.close}
        />
      )}

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <AdvisorNextStepCard
          href="/dashboard"
          title="Voir mon dashboard"
          body="Retrouver l&apos;analyse, le portefeuille et les donnees reelles au meme endroit."
          label="Ouvrir"
          icon={<BarChart3 className="h-4 w-4 text-foreground" />}
        />
        <AdvisorNextStepCard
          href="/chat"
          title="Poser une question a l'IA"
          body="Demander une explication plus simple, un point de risque ou un plan d&apos;entree."
          label="Continuer"
          icon={<MessageSquare className="h-4 w-4 text-foreground" />}
        />
        <AdvisorNextStepCard
          href="/pricing"
          title={plan === "premium" ? "Comparer les offres" : "Debloquer le suivi Pro"}
          body={plan === "premium"
            ? "Verifier ce qui distingue encore les autres offres."
            : "Ajouter le signal marche detaille, le suivi avance et les scenarios."
          }
          label={plan === "premium" ? "Voir les offres" : "Debloquer"}
          icon={<Zap className="h-4 w-4 text-foreground" />}
        />
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-secondary/40 px-4 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Discipline</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Un bon plan se juge sur sa coherence avec votre horizon et votre discipline, pas sur un seul mouvement de marche.
        </p>
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-border bg-card px-4 py-3.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-relaxed text-muted-foreground">{analysis.disclaimer}</p>
      </div>

      <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
        <button onClick={onNew}
          className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/80">
          Revoir mes reponses
        </button>
        {canExport ? (
          <button onClick={handleExport}
            className="flex-1 rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary">
            Telecharger le PDF
          </button>
        ) : null}
        <Link href="/dashboard"
          className="flex-1 rounded-2xl bg-foreground px-4 py-3.5 text-center text-sm font-semibold text-background transition-colors hover:bg-foreground/92">
          Voir mon dashboard
        </Link>
      </div>
      {exportError && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{exportError}</p>
        </div>
      )}

      {!canExport && (
        <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
          <Link href="/pricing" className="font-semibold text-foreground underline underline-offset-2 transition-colors hover:opacity-75">
            Debloquer Pro
          </Link>{" "}
          pour exporter l&apos;analyse, suivre le signal marche detaille et comparer des scenarios.
        </p>
      )}
    </div>
  )
}


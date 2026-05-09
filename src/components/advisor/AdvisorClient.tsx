"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Brain, ArrowRight, TrendingUp, Shield, Zap, AlertTriangle, AlertCircle, CheckCircle,
  RefreshCw, Target, X, Lock, Clock, Download, Activity, TrendingDown,
  Sparkles, BarChart3, Gauge
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PortfolioChart } from "./PortfolioChart"

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
}

interface Analysis {
  score: number
  risk: "faible" | "modéré" | "élevé"
  allocation: Array<{ asset: string; percentage: number; note?: string }>
  plan: string[]
  explanation: string
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

const VERDICT_CONFIG = {
  favorable: { emoji: "🟢", label: "Favorable",          color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", action: "Entrer progressivement" },
  neutre:    { emoji: "🟡", label: "Neutre",              color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   action: "Attendre" },
  risqué:    { emoji: "🔴", label: "Risqué",              color: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     action: "Réduire l'exposition" },
} as const

const EXPERIENCE_OPTIONS = [
  { value: "beginner" as const,     label: "Débutant",      desc: "< 1 an" },
  { value: "intermediate" as const, label: "Intermédiaire", desc: "1 à 3 ans" },
  { value: "expert" as const,       label: "Expert",        desc: "> 3 ans" },
]

const BUY_STRATEGY_OPTIONS = [
  { value: "lumpsum" as const,     label: "Lump-sum",    desc: "Investir en une fois" },
  { value: "dca-monthly" as const, label: "DCA mensuel", desc: "Répartir sur des mois" },
  { value: "dca-weekly" as const,  label: "DCA hebdo",   desc: "Accumulation rapide" },
]

const LOSS_TOLERANCE_OPTIONS = [
  { value: "low" as const,    label: "Faible",  desc: "Je veux limiter la perte a ~10%" },
  { value: "medium" as const, label: "Moyenne", desc: "J'accepte une baisse de ~25%" },
  { value: "high" as const,   label: "Forte",   desc: "Je peux supporter -40% ou plus" },
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
  { value: "conservative" as const, label: "Conservateur", desc: "Priorité sécurité" },
  { value: "moderate" as const,     label: "Modéré",       desc: "Équilibre risque/gain" },
  { value: "aggressive" as const,   label: "Agressif",     desc: "Maximiser les gains" },
]

const HORIZON_OPTIONS = [
  { value: "short" as const,  label: "Court terme", desc: "Moins d'1 an" },
  { value: "medium" as const, label: "Moyen terme", desc: "1 à 3 ans" },
  { value: "long" as const,   label: "Long terme",  desc: "Plus de 3 ans" },
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
  NEAR: "bg-green-500", MATIC: "bg-violet-500",
}

const ASSET_TEXT: Record<string, string> = {
  BTC: "text-amber-600", ETH: "text-blue-600", SOL: "text-purple-600",
  BNB: "text-yellow-600", XRP: "text-sky-600", ADA: "text-blue-600",
  AVAX: "text-red-600", DOT: "text-pink-600", LINK: "text-blue-700",
  NEAR: "text-green-600", MATIC: "text-violet-600",
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
  const sw = 10
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

  const color = score >= 85 ? "#34d399" : score >= 70 ? "#f59e0b" : "#f87171"
  const glow  = score >= 85 ? "score-glow-green" : score >= 70 ? "score-glow-gold" : "score-glow-red"
  const label = score >= 85 ? "Excellent" : score >= 70 ? "Solide" : "À affiner"

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`} overflow="visible">
          {/* Track */}
          <path d={bgArc} fill="none" stroke="#e2e8f0" strokeWidth={sw} strokeLinecap="round" />
          {/* Fill */}
          {pct > 0.01 && (
            <path d={fillArc} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 6px ${color}50)` }} />
          )}
          {/* Needle dot */}
          <circle cx={f.x} cy={f.y} r={4} fill={color} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center pb-0.5">
          <span className={cn("text-4xl font-black tabular-nums leading-none", glow)} style={{ color }}>{score}</span>
          <span className="text-xs text-muted-foreground mt-0.5">/100</span>
        </div>
      </div>
      <span className="text-sm font-bold text-foreground mt-1">{label}</span>
    </div>
  )
}

function UpgradeModal({ onClose, plan }: { onClose: () => void; plan: string }) {
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
    "Risque",
    "Perte acceptable",
    "Horizon",
    "Capital",
    "Objectif",
    "Experience",
    "Rythme",
    "Exclusions",
  ]
  const lastFormStep = formSteps.length - 1
  const progressPct = Math.round(((formStep + 1) / formSteps.length) * 100)

  const toggleGoal = (goal: string) =>
    setForm((p) => ({ ...p, goals: p.goals.includes(goal) ? p.goals.filter((g) => g !== goal) : [...p.goals, goal] }))

  const validateFormStep = () => {
    if (formStep === 1 && !form.lossTolerance) {
      return "Choisissez la perte que vous pouvez accepter."
    }
    if (formStep === 3) {
      if (!form.capital) return "Ajoutez votre capital de départ."
      if (!form.monthlyIncome) return "Ajoutez votre revenu mensuel."
    }
    if (formStep === 4) {
      if (form.goals.length === 0) return "Choisissez au moins un objectif."
      if (!form.preciseObjective.trim()) return "Précisez votre objectif principal."
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
    if (!form.capital) { setError("Ajoutez votre capital de départ."); return }
    if (!form.monthlyIncome) { setError("Ajoutez votre revenu mensuel."); setFormStep(3); return }
    if (form.goals.length === 0) { setError("Choisissez au moins un objectif."); setFormStep(4); return }
    if (!form.preciseObjective.trim()) { setError("Précisez votre objectif principal."); setFormStep(4); return }
    if (!form.investmentFrequency || !form.buyStrategy) { setError("Choisissez une option dans chaque section pour continuer."); setFormStep(6); return }
    setError(""); setStep("loading")
    try {
      const res  = await fetch("/api/advisor", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, userId }) })
      const data = await res.json()
      if (res.status === 429 && data.upgradeRequired) { setStep("form"); setShowUpgradeModal(true); return }
      if (!res.ok) throw new Error(data.error || "L'analyse n'a pas pu être générée. Réessayez dans quelques instants.")
      setAnalysis(normalizeAnalysis(data)); setStep("result")
    } catch (err) {
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
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center relative">
            <Brain className="w-8 h-8 text-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-foreground flex items-center justify-center">
              <span className="w-1.5 h-1.5 rounded-full bg-background animate-pulse" />
            </span>
          </div>
          <h2 className="text-2xl font-black text-foreground mb-1">Analyse en cours</h2>
          <p className="text-muted-foreground text-sm mb-8">
            {plan === "premium" ? "Claude Opus · analyse approfondie" : plan === "pro" ? "Claude Sonnet · analyse détaillée" : "Claude Haiku · analyse de base"}
          </p>
          <p className="text-[13px] text-muted-foreground mb-6">
            Analyse en cours - cela peut prendre jusqu&apos;a 60 a 90 secondes selon la charge.
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
    return <AnalysisResult analysis={analysis} plan={plan} onNew={() => { setStep("form"); setAnalysis(null) }} />
  }

  // Form
  const selBtn = "border-foreground bg-secondary text-foreground"
  const defBtn = "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"

  return (
    <>
      {showUpgradeModal && <UpgradeModal plan={plan} onClose={() => setShowUpgradeModal(false)} />}
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-foreground tracking-tight mb-1">Conseiller IA</h1>
          <p className="text-muted-foreground text-sm">
            {plan === "premium" ? "Claude Opus · stratégie institutionnelle" : plan === "pro" ? "Claude Sonnet · analyse détaillée" : "Claude Haiku · analyse de base"}
            {" · "}analyse complete en environ 1 minute
          </p>
        </div>

        {limitReached ? (
          <div className="mb-6 p-5 rounded-xl bg-secondary border border-border flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground mb-0.5 text-sm">Accès temporairement bloqué</p>
              <p className="text-sm text-muted-foreground mb-3">
                {plan === "pro"
                  ? "Vos 20 analyses Pro du mois sont déjà utilisées. Passez au Premium pour continuer sans limite."
                  : "Votre analyse gratuite du mois est déjà utilisée. Passez au Pro pour continuer."}
              </p>
              <Link href="/pricing" className="inline-flex items-center gap-2 px-4 py-2 bg-foreground hover:bg-foreground/90 text-background text-sm font-bold rounded-lg transition-all">
                Comparer les plans <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : plan === "free" ? (
          <div className="mb-6 px-4 py-3 rounded-xl bg-secondary border border-border flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3.5 h-3.5 shrink-0" />
            1 analyse incluse ce mois · <Link href="/pricing" className="font-bold text-foreground underline underline-offset-2 hover:opacity-75 transition-opacity">Passer au Pro pour 20 analyses</Link>
          </div>
        ) : null}

        <div className="mb-5 rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Plan actif</p>
              <p className="text-sm font-bold text-foreground">{planAccess.label}</p>
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
          <div className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between gap-3 mb-3">
              <span className="text-[10px] font-black uppercase tracking-wide text-muted-foreground">
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
          {formStep === 0 && (
          <FormSection number={1} title="Tolérance au risque" icon={<Shield className="w-3.5 h-3.5 text-muted-foreground" />}>
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
          <FormSection number={2} title="Tolérance à la perte" icon={<Shield className="w-3.5 h-3.5 text-muted-foreground" />}>
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
          <FormSection number={3} title="Horizon d'investissement" icon={<TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />}>
            <div className="grid grid-cols-3 gap-2">
              {HORIZON_OPTIONS.map((opt) => (
                <button key={opt.value} onClick={() => setForm((p) => ({ ...p, horizon: opt.value }))}
                  className={cn("p-3 rounded-lg border text-left transition-all", form.horizon === opt.value ? selBtn : defBtn)}>
                  <div className="text-sm font-bold">{opt.label}</div>
                  <div className={cn("text-xs mt-0.5", form.horizon === opt.value ? "text-foreground/60" : "text-muted-foreground")}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </FormSection>
          )}

          {formStep === 3 && (
          <FormSection number={4} title="Capital">
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
          <FormSection number={5} title="Objectifs" icon={<Target className="w-3.5 h-3.5 text-muted-foreground" />}>
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
          </FormSection>
          )}

          {formStep === 5 && (
          <FormSection number={6} title="Expérience crypto">
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
          <FormSection number={7} title="Stratégie d'achat">
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
          <FormSection number={8} title="Actifs à exclure" optional>
            <input type="text" value={form.excludedCryptos}
              onChange={(e) => setForm((p) => ({ ...p, excludedCryptos: e.target.value }))}
              placeholder="Ex : XRP, DOGE, SHIB — séparés par des virgules"
              className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/10 text-sm transition-all" />
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

          <p className="text-center text-[11px] text-muted-foreground/50 pb-2">Claude AI · données CoinGecko temps réel</p>
        </div>
      </div>
    </>
  )
}

function FormSection({ number, title, icon, optional, children }: {
  number: number; title: string; icon?: React.ReactNode; optional?: boolean; children: React.ReactNode
}) {
  return (
    <div className="p-5 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-black text-muted-foreground/50 tabular-nums w-5 shrink-0">0{number}</span>
        <div className="w-px h-3.5 bg-border shrink-0" />
        <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
          {icon}{title}
          {optional && <span className="text-muted-foreground font-normal text-xs ml-1">(optionnel)</span>}
        </h3>
      </div>
      {children}
    </div>
  )
}

// ── Analysis Result ───────────────────────────────────────────────────────────
function AnalysisResult({ analysis, plan, onNew }: { analysis: Analysis; plan: string; onNew: () => void }) {
  const canExport = plan === "pro" || plan === "premium"
  const isPremium = plan === "premium"
  const isPro     = plan === "pro" || plan === "premium"
  const planAccess = PLAN_ACCESS[plan] ?? PLAN_ACCESS.free
  const [exportError, setExportError] = useState("")
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

  const momentum = analysis.score >= 85
    ? { label: "Fort",   color: "text-emerald-600", bar: "bg-emerald-500", w: "100%" }
    : analysis.score >= 70
    ? { label: "Modéré", color: "text-amber-600",   bar: "bg-amber-500",   w: "65%" }
    : { label: "Faible", color: "text-red-600",      bar: "bg-red-500",     w: "30%" }

  const risk       = RISK_CONFIG[analysis.risk] ?? RISK_CONFIG["modéré"]
  const scoreLabel = analysis.score >= 85 ? "Excellent profil" : analysis.score >= 70 ? "Profil solide" : "Profil à affiner"

  const opportunities = analysis.allocation.slice(0, 3)
  const riskItems = [
    analysis.risk === "élevé" ? "Exposition élevée — volatilité importante attendue" : null,
    analysis.score < 70 ? "Profil non optimisé — affinez vos paramètres" : null,
    "Risque systémique cryptomonnaies (corrélation en crise)",
    "Liquidité variable selon les actifs secondaires",
  ].filter(Boolean).slice(0, 3) as string[]

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
    <div className="max-w-2xl mx-auto pb-10 animate-slide-up">

      {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Votre analyse</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {plan === "premium" ? "Claude Opus 4.7" : plan === "pro" ? "Claude Sonnet 4.6" : "Claude Haiku 4.5"} · données marché temps réel
          </p>
        </div>
        <button onClick={onNew} className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border text-xs text-muted-foreground hover:text-foreground rounded-lg transition-all font-medium">
          <RefreshCw className="w-3 h-3" /> Nouvelle analyse
        </button>
      </div>

      {planAccess.locked.length > 0 && (
        <div className="mb-4 rounded-2xl border border-border bg-card px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
              <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Non inclus sur {planAccess.label}
              </p>
            </div>
          <div className="flex flex-wrap gap-2">
            {planAccess.locked.map((item) => (
              <span key={item} className="rounded-full border border-border px-2.5 py-1 text-[11px] text-muted-foreground">
                {item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Verdict + Insight banner */}
      {isPro && (analysis.marketVerdict || analysis.marketInsight) && (() => {
        const verdict = analysis.marketVerdict ? VERDICT_CONFIG[analysis.marketVerdict] : null
        return (
          <div className={cn(
            "rounded-2xl p-5 mb-4 border shadow-card-xs",
            verdict ? `${verdict.bg} ${verdict.border}` : "bg-secondary border-border"
          )}>
            {verdict && (
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                  verdict.bg, verdict.border
                )}>
                  <span className="text-lg leading-none">{verdict.emoji}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-black text-sm", verdict.color)}>
                      Signal marché · {verdict.label}
                    </span>
                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider",
                      verdict.color, verdict.border, verdict.bg
                    )}>
                      {verdict.action}
                    </span>
                  </div>
                  {analysis.marketVerdictNote && (
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{analysis.marketVerdictNote}</p>
                  )}
                </div>
              </div>
            )}
            {analysis.marketInsight && (
              <div className={cn("flex items-start gap-2.5", verdict ? "border-t border-black/5 pt-3 mt-1" : "")}>
                <span className="text-sm leading-none shrink-0 mt-0.5">⚡</span>
                <p className="text-sm font-semibold text-foreground leading-relaxed">{analysis.marketInsight}</p>
              </div>
            )}
          </div>
        )
      })()}

      {/* Bloc Confiance */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base leading-none">📈</span>
          <h2 className="font-bold text-foreground text-sm">Pourquoi cette stratégie est solide</h2>
        </div>
        <ul className="space-y-2.5 mb-4">
          {[
            "Basée sur les données actuelles du marché",
            "Répartition pensée pour limiter le risque",
            "Adaptée à ton profil et ton capital",
            "Stratégie utilisée par des profils similaires au tien",
          ].map((point) => (
            <li key={point} className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-sm text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
          <span className="text-sm leading-none shrink-0">👉</span>
          <p className="text-sm font-semibold text-emerald-700">Tu suis une logique claire, pas un hasard</p>
        </div>
      </div>

      {/* Exécution immédiate */}
      {showAiRecommendations && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4 shadow-card">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
              <Brain className="w-4 h-4 text-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm leading-none">Recommandations de l&apos;IA</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">{"Les prochaines actions concr\u00e8tes \u00e0 suivre"}</p>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            {primaryAction && (
              <div className="rounded-2xl border border-border bg-secondary/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action principale</p>
                </div>
                <p className="text-sm font-semibold text-foreground leading-relaxed">
                  Acheter <span className={cn("font-bold", ASSET_TEXT[primaryAction.crypto] ?? "text-foreground")}>{primaryAction.crypto}</span>
                  {primaryAction.amount ? ` - ${primaryAction.amount}` : ""}
                </p>
                {analysis.executionNow && analysis.executionNow.length > 1 && (
                  <p className="text-[11px] text-muted-foreground mt-2">+ {analysis.executionNow.length - 1} autre(s) action(s) déjà listée(s)</p>
                )}
              </div>
            )}

            {strategy && (
              <div className="rounded-2xl border border-border bg-secondary/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-foreground shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{"Strat\u00e9gie"}</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{strategy}</p>
              </div>
            )}

            {analysis.nextReview && (
              <div className="rounded-2xl border border-border bg-secondary/60 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{"Prochaine \u00e9tape"}</p>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{analysis.nextReview}</p>
              </div>
            )}

            {avoidItems.length > 0 && (
              <div className="rounded-2xl border border-border bg-secondary/60 p-4 sm:col-span-2">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{"\u00c0 \u00e9viter"}</p>
                </div>
                <ul className="space-y-2">
                  {avoidItems.map((item, index) => (
                    <li key={`${item}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-300 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {((analysis.executionNow && analysis.executionNow.length > 0) ||
        (analysis.executionLater && analysis.executionLater.length > 0)) && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4 shadow-card">
          <div className="px-6 py-4 border-b border-border flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-secondary border border-border flex items-center justify-center shrink-0">
              <span className="text-base leading-none">🚀</span>
            </div>
            <div>
              <h2 className="font-bold text-foreground text-sm leading-none">Exécution immédiate</h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">Ce que tu dois faire maintenant</p>
            </div>
          </div>
          <div className="divide-y divide-border">
            {analysis.executionNow && analysis.executionNow.length > 0 && (
              <div className="px-6 py-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  À faire maintenant
                </p>
                <ul className="space-y-3.5">
                  {analysis.executionNow.map((item, i) => (
                    <li key={i} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-[18px] h-[18px] rounded-md border-2 border-border bg-background shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] shrink-0" />
                        <span className="text-sm font-semibold text-foreground">
                          Acheter{" "}
                          <span className={cn("font-bold", ASSET_TEXT[item.crypto] ?? "text-foreground")}>
                            {item.crypto}
                          </span>
                        </span>
                      </div>
                      <span className="text-sm font-bold text-foreground tabular-nums shrink-0 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        {item.amount}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.executionLater && analysis.executionLater.length > 0 && (
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  À surveiller
                </p>
                <ul className="space-y-2.5">
                  {analysis.executionLater.map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <div className="w-[18px] h-[18px] rounded-md border-2 border-slate-200 bg-white shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)] shrink-0" />
                      <span className="text-sm text-muted-foreground leading-relaxed">
                        <span className={cn("font-semibold", ASSET_TEXT[item.crypto] ?? "text-foreground")}>
                          {item.crypto}
                        </span>
                        {item.condition ? ` — ${item.condition}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.nextReview && (
              <div className="px-6 py-3.5 flex items-center gap-3 bg-slate-50/60">
                <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground">
                  Prochaine révision :{" "}
                  <span className="font-semibold text-foreground">{analysis.nextReview}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Score + Metrics hero */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-4 shadow-card">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Gauge */}
          <div className="shrink-0">
            <ScoreGauge score={analysis.score} />
            <p className="text-center text-xs text-muted-foreground mt-1">{scoreLabel}</p>
          </div>

          {/* Metrics */}
          <div className="flex-1 grid grid-cols-1 gap-3 w-full">
            {/* Signal */}
            {isPro && signalInfo ? (
              <div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl border", signalInfo.bg, signalInfo.border)}>
                <signalInfo.Icon className={cn("w-4 h-4 shrink-0", signalInfo.color)} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Signal marché</p>
                  <p className={cn("text-sm font-bold", signalInfo.color)}>{signalInfo.label}</p>
                </div>
                <span className={cn("text-xs font-black px-2 py-0.5 rounded-md border", signalInfo.color, signalInfo.border, signalInfo.bg)}>
                  {signalInfo.short}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-secondary/60">
                <Lock className="w-4 h-4 shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Signal marché</p>
                  <p className="text-sm font-bold text-foreground">Signal marché détaillé disponible en Pro</p>
                </div>
                <span className="text-xs font-black px-2 py-0.5 rounded-md border border-border bg-card text-muted-foreground">
                  PRO
                </span>
              </div>
            )}

            {/* Risk + Momentum */}
            <div className="grid grid-cols-2 gap-3">
              <div className={cn("flex items-center gap-2.5 px-3 py-3 rounded-xl border", risk.bg, risk.border)}>
                <Shield className={cn("w-4 h-4 shrink-0", risk.text)} />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold leading-none mb-0.5">Risque</p>
                  <p className={cn("text-sm font-bold", risk.text)}>{risk.label}</p>
                </div>
              </div>
              <div className="px-3 py-3 rounded-xl border border-border bg-secondary">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Gauge className="w-3.5 h-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold leading-none">Momentum</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                    <div className={cn("h-1 rounded-full transition-all", momentum.bar)} style={{ width: momentum.w }} />
                  </div>
                  <span className={cn("text-xs font-bold shrink-0", momentum.color)}>{momentum.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-bold text-foreground text-sm">Répartition recommandée</h2>
          <span className="text-xs text-muted-foreground ml-auto tabular-nums">{analysis.allocation.length} actifs</span>
        </div>
        <div className="grid md:grid-cols-2 gap-0">
          <div className="px-6 py-5 space-y-4">
            {analysis.allocation.map((alloc) => (
              <div key={alloc.asset}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", ASSET_BAR[alloc.asset] ?? "bg-slate-400")} />
                    <span className="text-sm font-bold text-foreground tracking-tight">{alloc.asset}</span>
                    {isPro && alloc.note && (
                      <span className="text-[11px] text-muted-foreground leading-tight truncate max-w-[90px]">{alloc.note}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold text-foreground tabular-nums">{alloc.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-[5px] overflow-hidden">
                  <div
                    className={cn("h-[5px] rounded-full transition-all duration-700", ASSET_BAR[alloc.asset] ?? "bg-slate-400")}
                    style={{ width: `${alloc.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border md:border-t-0 md:border-l flex items-center justify-center">
            <div className="w-full h-44">
              <PortfolioChart allocations={analysis.allocation} />
            </div>
          </div>
        </div>
      </div>

      {/* Opportunités / Risques / Timing — 3 col */}
      <div className="grid sm:grid-cols-3 gap-3 mb-4">
        {/* Opportunités */}
        <div className="bg-card border border-emerald-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <h3 className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.1em]">Opportunités</h3>
          </div>
          <ul className="space-y-2.5">
            {opportunities.map((o) => (
              <li key={o.asset} className="flex items-center gap-2">
                <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", ASSET_BAR[o.asset] ?? "bg-muted-foreground")} />
                <span className={cn("text-xs font-bold", ASSET_TEXT[o.asset] ?? "text-muted-foreground")}>{o.asset}</span>
                <span className="text-xs text-muted-foreground ml-auto tabular-nums">{o.percentage}%</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risques */}
        <div className="bg-card border border-red-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <h3 className="text-[10px] font-bold text-red-600 uppercase tracking-[0.1em]">Risques</h3>
          </div>
          <ul className="space-y-2">
            {riskItems.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <div className="w-1 h-1 rounded-full bg-red-300 shrink-0 mt-1.5" />
                <span className="text-xs text-muted-foreground leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Timing */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Timing</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {analysis.entryStrategy
              ? analysis.entryStrategy.slice(0, 120) + (analysis.entryStrategy.length > 120 ? "…" : "")
              : signalInfo?.label === "Haussier"
              ? "Conditions favorables. Entrée progressive recommandée."
              : signalInfo?.label === "Baissier"
              ? "Marché sous pression. Favoriser le DCA pour lisser l'entrée."
              : isPro
              ? "Marché neutre. Entrée en deux fois espacées de 2-4 semaines."
              : "Passez au Pro pour obtenir un timing guidé par le signal marché."}
          </p>
        </div>
      </div>

      {/* Market signal (Pro+) */}
      {isPro && analysis.marketSignal && (
        <div className="flex items-start gap-3 px-5 py-4 bg-secondary border border-border rounded-2xl mb-4">
          <Activity className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em]">Signal complet</span>
            <p className="text-sm text-foreground font-semibold mt-1 leading-relaxed">{analysis.marketSignal}</p>
          </div>
        </div>
      )}

      {/* Analysis */}
      {analysis.explanation && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
            <h2 className="font-bold text-foreground text-sm">Analyse de marché</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-muted-foreground leading-[1.75] font-[430]">{analysis.explanation}</p>
          </div>
        </div>
      )}

      {/* Lecture IA */}
      {isPremium && analysis.aiSignature && (
        <div className="flex items-start gap-3.5 px-5 py-4 bg-secondary border border-border rounded-2xl mb-4">
          <span className="text-base leading-none shrink-0 mt-0.5">🧠</span>
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">Lecture IA</p>
            <p className="text-sm font-semibold text-foreground leading-relaxed">{analysis.aiSignature}</p>
          </div>
        </div>
      )}

      {/* Plan — timeline */}
      {Array.isArray(analysis.plan) && analysis.plan.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <h2 className="font-bold text-foreground text-sm">Plan d&apos;action</h2>
            </div>
            <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest tabular-nums">{analysis.plan.length} étape{analysis.plan.length > 1 ? "s" : ""}</span>
          </div>
          <div className="px-6 py-5">
            <ol className="space-y-4">
              {analysis.plan.map((action, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-black tabular-nums border",
                    i === 0
                      ? "bg-foreground text-background border-foreground"
                      : "bg-secondary text-muted-foreground border-border"
                  )}>
                    {i + 1}
                  </div>
                  <div className="pt-0.5 flex-1">
                    <p className="text-sm text-muted-foreground leading-[1.7]">{String(action)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}

      {/* Plan dans le temps */}
      {isPro && analysis.timePlan && analysis.timePlan.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <span className="text-base leading-none">📅</span>
            <h2 className="font-bold text-foreground text-sm">Plan dans le temps</h2>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-0">
              {analysis.timePlan.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-black border",
                      i === 0
                        ? "bg-foreground text-background border-foreground"
                        : "bg-secondary text-muted-foreground border-border"
                    )}>
                      {i + 1}
                    </div>
                    {i < analysis.timePlan!.length - 1 && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>
                  <div className={cn("pb-4 flex-1", i === analysis.timePlan!.length - 1 ? "" : "")}>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                      {item.period}
                    </p>
                    <p className="text-sm text-foreground leading-relaxed">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Erreurs à éviter */}
      {isPremium && analysis.errorsToAvoid && analysis.errorsToAvoid.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-red-100 flex items-center gap-2">
            <span className="text-base leading-none">❌</span>
            <h2 className="font-bold text-red-700 text-sm">Alertes de risque Premium</h2>
          </div>
          <div className="px-6 py-5">
            <ul className="space-y-3">
              {analysis.errorsToAvoid.map((err, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-red-100 border border-red-200 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-1.5 h-0.5 rounded-full bg-red-500" />
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed">{err}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Projection */}
      {isPremium && analysis.projection && analysis.projection.length > 0 && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-border flex items-center gap-2">
            <span className="text-base leading-none">📊</span>
            <h2 className="font-bold text-foreground text-sm">Projection selon les marchés</h2>
          </div>
          <div className="divide-y divide-border">
            {analysis.projection.map((proj, i) => (
              <div
                key={i}
                className={cn(
                  "px-6 py-4 flex items-start gap-3.5",
                  i === 1 ? "bg-emerald-50/50" : i === 2 ? "bg-red-50/30" : "bg-amber-50/30"
                )}
              >
                <span className="text-base leading-none shrink-0 mt-0.5">
                  {i === 0 ? "🟡" : i === 1 ? "🟢" : "🔴"}
                </span>
                <div>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest mb-1",
                    i === 1 ? "text-emerald-600" : i === 2 ? "text-red-500" : "text-amber-600"
                  )}>
                    {proj.scenario}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{proj.outcome}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pedagogy — Comprendre simplement */}
      {analysis.pedagogy && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl overflow-hidden mb-4">
          <div className="px-6 py-4 border-b border-blue-100 flex items-center gap-2">
            <span className="text-base leading-none">📘</span>
            <h2 className="font-bold text-blue-700 text-sm">Comprendre simplement</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-blue-900 leading-[1.75]">{analysis.pedagogy}</p>
          </div>
        </div>
      )}

      {/* Premium advanced */}
      {isPremium && (analysis.entryStrategy || analysis.rebalanceNote) && (
        <div className="rounded-2xl overflow-hidden mb-4 card-premium-light">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-bold text-foreground text-sm">Stratégie avancée</span>
            </div>
            <span className="badge-premium">Premium</span>
          </div>
          <div className="divide-y divide-border">
            {analysis.entryStrategy && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">Stratégie d&apos;entrée</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{analysis.entryStrategy}</p>
              </div>
            )}
            {analysis.rebalanceNote && (
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.1em] mb-2">Rééquilibrage</p>
                <p className="text-sm text-foreground/80 leading-relaxed">{analysis.rebalanceNote}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prochaine étape */}
      <div className="rounded-2xl mb-4 overflow-hidden border border-border bg-card shadow-card-xs">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-foreground flex items-center justify-center shrink-0">
              <Zap className="w-3.5 h-3.5 text-background" />
            </div>
            <h2 className="font-black text-foreground text-sm tracking-tight">Prochaine étape</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center shrink-0 mt-0.5">
                <ArrowRight className="w-3 h-3 text-background" />
              </div>
              <span className="text-sm font-semibold text-foreground leading-relaxed">Exécute les actions maintenant</span>
            </li>
            {analysis.nextReview && (
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
                  <Clock className="w-2.5 h-2.5 text-muted-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground leading-relaxed">
                  Reviens dans{" "}<span className="font-black">{analysis.nextReview}</span>
                </span>
              </li>
            )}
          </ul>
        </div>
        <div className="px-5 py-3 bg-secondary border-t border-border">
          <p className="text-xs font-bold text-muted-foreground text-center tracking-wide">
            Ne pas agir = perdre l&apos;avantage du plan
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2.5 px-4 py-3.5 bg-secondary border border-border rounded-2xl mb-4">
        <AlertTriangle className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{analysis.disclaimer}</p>
      </div>

      {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <button onClick={onNew}
            className="flex-1 py-3.5 bg-secondary border border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Revoir mes réponses
          </button>
          {canExport && (
            <button onClick={handleExport}
              className="flex-1 py-3.5 bg-secondary border border-border hover:border-foreground/20 text-muted-foreground hover:text-foreground font-bold rounded-2xl text-sm transition-all flex items-center justify-center gap-2">
              <Download className="w-3.5 h-3.5" /> Télécharger le PDF
            </button>
          )}
          <Link href="/dashboard"
            className="flex-1 py-3.5 bg-foreground hover:bg-foreground/90 text-background font-black rounded-2xl text-sm text-center transition-all flex items-center justify-center gap-2">
            Voir le dashboard <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      {exportError && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{exportError}</p>
        </div>
      )}

      {!canExport && (
        <p className="text-center text-[11px] text-muted-foreground/50 mt-3">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">Plan Pro</Link> pour exporter vos analyses en PDF
        </p>
      )}
    </div>
  )
}


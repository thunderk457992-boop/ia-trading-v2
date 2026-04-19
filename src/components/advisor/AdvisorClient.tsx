"use client"

import { useState } from "react"
import { Brain, Loader2, ArrowRight, TrendingUp, Shield, Zap, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { PortfolioChart } from "./PortfolioChart"

interface Props {
  userId: string
  plan: string
  lastAnalysis: Record<string, unknown> | null
}

type RiskLevel = "conservative" | "moderate" | "aggressive"
type Horizon = "short" | "medium" | "long"

interface InvestorForm {
  riskTolerance: RiskLevel
  horizon: Horizon
  capital: string
  monthlyContribution: string
  goals: string[]
  excludedCryptos: string
}

interface Allocation {
  symbol: string
  name: string
  percentage: number
  rationale: string
  risk_level: "low" | "medium" | "high"
  expected_return: string
  category: string
}

interface Analysis {
  allocations: Allocation[]
  market_context: string
  recommendations: string[]
  warnings: string[]
  total_score: number
}

const GOALS = [
  "Accumulation long terme",
  "Revenus passifs (staking)",
  "Croissance agressive",
  "Préservation du capital",
  "Diversification",
  "Trading actif",
]

export function AdvisorClient({ userId, plan, lastAnalysis }: Props) {
  const [step, setStep] = useState<"form" | "loading" | "result">(lastAnalysis ? "result" : "form")
  const [form, setForm] = useState<InvestorForm>({
    riskTolerance: "moderate",
    horizon: "medium",
    capital: "",
    monthlyContribution: "",
    goals: [],
    excludedCryptos: "",
  })
  const [analysis, setAnalysis] = useState<Analysis | null>(
    lastAnalysis ? (lastAnalysis as unknown as Analysis) : null
  )
  const [error, setError] = useState("")

  const toggleGoal = (goal: string) => {
    setForm((prev) => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter((g) => g !== goal)
        : [...prev.goals, goal],
    }))
  }

  const handleAnalyze = async () => {
    if (!form.capital) { setError("Veuillez entrer votre capital initial"); return }
    if (form.goals.length === 0) { setError("Sélectionnez au moins un objectif"); return }
    setError("")
    setStep("loading")

    try {
      const res = await fetch("/api/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, userId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erreur lors de l'analyse")
      setAnalysis(data)
      setStep("result")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue")
      setStep("form")
    }
  }

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Brain className="w-10 h-10 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Analyse en cours...</h2>
          <p className="text-white/40 text-sm mb-6">Notre IA analyse les conditions du marché et votre profil</p>
          <div className="flex items-center justify-center gap-2 text-sm text-white/30">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Génération de votre allocation personnalisée</span>
          </div>
        </div>
      </div>
    )
  }

  if (step === "result" && analysis) {
    return <AnalysisResult analysis={analysis} onNew={() => { setStep("form"); setAnalysis(null) }} />
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          <Brain className="w-8 h-8 text-indigo-400" />
          Conseiller IA
        </h1>
        <p className="text-white/40">Remplissez votre profil d&apos;investisseur pour obtenir une allocation personnalisée.</p>
      </div>

      {plan === "free" && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
          <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-amber-400">Plan Free — 1 analyse par mois</p>
            <p className="text-xs text-white/40 mt-0.5">
              <Link href="/pricing" className="text-amber-400 hover:text-amber-300">Passez au Pro</Link> pour des analyses illimitées.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Risk tolerance */}
        <div className="p-6 rounded-2xl glass border border-white/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            Tolérance au risque
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "conservative", label: "Conservateur", desc: "Préserver le capital", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
              { value: "moderate", label: "Modéré", desc: "Équilibre risque/rendement", color: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10" },
              { value: "aggressive", label: "Agressif", desc: "Maximiser les gains", color: "text-red-400 border-red-500/30 bg-red-500/10" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((p) => ({ ...p, riskTolerance: opt.value }))}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  form.riskTolerance === opt.value ? opt.color : "border-white/8 bg-white/3 hover:bg-white/5"
                )}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Horizon */}
        <div className="p-6 rounded-2xl glass border border-white/5">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-400" />
            Horizon d&apos;investissement
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {([
              { value: "short", label: "Court terme", desc: "< 1 an" },
              { value: "medium", label: "Moyen terme", desc: "1 — 3 ans" },
              { value: "long", label: "Long terme", desc: "> 3 ans" },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setForm((p) => ({ ...p, horizon: opt.value }))}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  form.horizon === opt.value
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                    : "border-white/8 bg-white/3 hover:bg-white/5"
                )}
              >
                <div className="text-sm font-medium">{opt.label}</div>
                <div className="text-xs text-white/40 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Capital */}
        <div className="p-6 rounded-2xl glass border border-white/5">
          <h3 className="font-semibold mb-4">Capital & Contributions</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Capital initial (€)</label>
              <input
                type="number"
                value={form.capital}
                onChange={(e) => setForm((p) => ({ ...p, capital: e.target.value }))}
                placeholder="ex: 5000"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 text-sm transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Apport mensuel (€)</label>
              <input
                type="number"
                value={form.monthlyContribution}
                onChange={(e) => setForm((p) => ({ ...p, monthlyContribution: e.target.value }))}
                placeholder="ex: 200"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 text-sm transition-all"
              />
            </div>
          </div>
        </div>

        {/* Goals */}
        <div className="p-6 rounded-2xl glass border border-white/5">
          <h3 className="font-semibold mb-4">Objectifs d&apos;investissement</h3>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((goal) => (
              <button
                key={goal}
                onClick={() => toggleGoal(goal)}
                className={cn(
                  "p-3 rounded-xl border text-sm text-left transition-all flex items-center gap-2",
                  form.goals.includes(goal)
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                    : "border-white/8 bg-white/3 hover:bg-white/5 text-white/60"
                )}
              >
                <div className={cn("w-4 h-4 rounded border flex items-center justify-center shrink-0", form.goals.includes(goal) ? "bg-indigo-600 border-indigo-600" : "border-white/20")}>
                  {form.goals.includes(goal) && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Excluded */}
        <div className="p-6 rounded-2xl glass border border-white/5">
          <h3 className="font-semibold mb-2">Cryptos à exclure (optionnel)</h3>
          <p className="text-xs text-white/40 mb-3">Ex: XRP, DOGE, SHIB</p>
          <input
            type="text"
            value={form.excludedCryptos}
            onChange={(e) => setForm((p) => ({ ...p, excludedCryptos: e.target.value }))}
            placeholder="Séparez par des virgules"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 text-sm transition-all"
          />
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2 glow-purple"
        >
          <Brain className="w-5 h-5" />
          Analyser mon profil avec l&apos;IA
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}

function AnalysisResult({ analysis, onNew }: { analysis: Analysis; onNew: () => void }) {
  const riskColors = {
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    high: "text-red-400 bg-red-500/10 border-red-500/20",
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-400" />
            Votre allocation recommandée
          </h1>
          <p className="text-white/40 text-sm">Générée par IA selon votre profil</p>
        </div>
        <button
          onClick={onNew}
          className="px-4 py-2 glass-strong border border-white/10 text-sm text-white/60 hover:text-white rounded-xl transition-all"
        >
          Nouvelle analyse
        </button>
      </div>

      {/* Score */}
      <div className="p-6 rounded-2xl glass border border-white/5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
          <span className="text-2xl font-bold text-indigo-400">{analysis.total_score}</span>
        </div>
        <div>
          <div className="text-sm text-white/40 mb-1">Score de confiance IA</div>
          <div className="font-semibold">Profil bien défini</div>
          <div className="text-sm text-white/50 mt-1">{analysis.market_context}</div>
        </div>
      </div>

      {/* Chart */}
      <div className="p-6 rounded-2xl glass border border-white/5">
        <h2 className="font-semibold mb-4">Répartition du portfolio</h2>
        <PortfolioChart allocations={analysis.allocations} />
      </div>

      {/* Allocations table */}
      <div className="p-6 rounded-2xl glass border border-white/5">
        <h2 className="font-semibold mb-4">Détail des allocations</h2>
        <div className="space-y-3">
          {analysis.allocations.map((alloc) => (
            <div key={alloc.symbol} className="p-4 rounded-xl bg-white/3 border border-white/5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600/30 flex items-center justify-center">
                    <span className="text-xs font-bold text-indigo-400">{alloc.symbol[0]}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-sm">{alloc.symbol}</span>
                    <span className="text-white/40 text-xs ml-2">{alloc.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-md border", riskColors[alloc.risk_level])}>
                    {alloc.risk_level}
                  </span>
                  <span className="text-lg font-bold">{alloc.percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1.5 mb-2">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${alloc.percentage}%` }}
                />
              </div>
              <p className="text-xs text-white/40">{alloc.rationale}</p>
              <div className="text-xs text-emerald-400 mt-1">Rendement estimé: {alloc.expected_return}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="p-6 rounded-2xl glass border border-white/5">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Recommandations
          </h2>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20">
          <h2 className="font-semibold mb-4 flex items-center gap-2 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            Points d&apos;attention
          </h2>
          <ul className="space-y-2">
            {analysis.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="text-center py-4">
        <p className="text-xs text-white/25">
          ⚠️ Cette analyse est fournie à titre informatif uniquement. Elle ne constitue pas un conseil en investissement.
          Investir en cryptomonnaies comporte des risques de perte totale du capital.
        </p>
      </div>
    </div>
  )
}

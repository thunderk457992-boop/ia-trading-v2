"use client"

import Link from "next/link"
import { Brain, TrendingUp, ArrowRight, Zap, Clock, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface Props {
  user: { email?: string }
  profile: { full_name?: string; plan?: string } | null
  analyses: Array<{
    id: string
    created_at: string
    allocations: Array<{ symbol: string; percentage: number }>
  }>
}

const MOCK_PRICES = [
  { symbol: "BTC", name: "Bitcoin", price: 65420, change: +2.34, color: "from-orange-600/20 to-amber-600/20" },
  { symbol: "ETH", name: "Ethereum", price: 3180, change: +1.87, color: "from-indigo-600/20 to-blue-600/20" },
  { symbol: "SOL", name: "Solana", price: 142, change: -0.92, color: "from-purple-600/20 to-violet-600/20" },
  { symbol: "BNB", name: "BNB", price: 412, change: +0.45, color: "from-yellow-600/20 to-amber-600/20" },
]

export function DashboardOverview({ user, profile, analyses }: Props) {
  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Trader"
  const plan = profile?.plan ?? "free"
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">
          {greeting}, {firstName} 👋
        </h1>
        <p className="text-white/40">Voici un aperçu de vos activités</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Analyses réalisées", value: analyses.length.toString(), icon: Brain, color: "text-indigo-400" },
          { label: "Plan actuel", value: plan.charAt(0).toUpperCase() + plan.slice(1), icon: Zap, color: plan === "premium" ? "text-amber-400" : plan === "pro" ? "text-indigo-400" : "text-white/40" },
          { label: "Cryptos suivies", value: "12", icon: TrendingUp, color: "text-emerald-400" },
          { label: "Prochaine analyse", value: plan === "free" ? "1/mois" : "∞", icon: Target, color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="p-5 rounded-2xl glass border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-white/40">{stat.label}</span>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
            <div className="text-2xl font-bold">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Market prices */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Marché en direct</h2>
            <span className="text-xs text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live
            </span>
          </div>
          <div className="space-y-3">
            {MOCK_PRICES.map((crypto) => (
              <div key={crypto.symbol} className="p-4 rounded-xl glass border border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${crypto.color} flex items-center justify-center`}>
                    <span className="text-xs font-bold">{crypto.symbol[0]}</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{crypto.name}</div>
                    <div className="text-xs text-white/40">{crypto.symbol}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">${crypto.price.toLocaleString()}</div>
                  <div className={cn("text-xs", crypto.change >= 0 ? "text-emerald-400" : "text-red-400")}>
                    {crypto.change >= 0 ? "+" : ""}{crypto.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* AI Advisor CTA */}
          <div className="p-6 rounded-2xl bg-indigo-600/15 border border-indigo-500/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/20 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
            <div className="relative">
              <Brain className="w-8 h-8 text-indigo-400 mb-3" />
              <h3 className="font-semibold mb-2">Conseiller IA</h3>
              <p className="text-sm text-white/50 mb-4">
                Obtenez une allocation personnalisée basée sur votre profil d&apos;investisseur.
              </p>
              <Link
                href="/advisor"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Lancer l&apos;analyse
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Recent analyses */}
          <div>
            <h3 className="font-semibold mb-3 text-sm">Analyses récentes</h3>
            {analyses.length === 0 ? (
              <div className="p-4 rounded-xl glass border border-white/5 text-center">
                <Clock className="w-6 h-6 text-white/20 mx-auto mb-2" />
                <p className="text-xs text-white/30">Aucune analyse pour l&apos;instant</p>
                <Link href="/advisor" className="text-xs text-indigo-400 hover:text-indigo-300 mt-1 block">
                  Créer votre première analyse →
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {analyses.slice(0, 3).map((analysis) => (
                  <div key={analysis.id} className="p-3 rounded-xl glass border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">Portfolio Analysis</span>
                      <span className="text-xs text-white/30">
                        {new Date(analysis.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {analysis.allocations?.slice(0, 4).map((a: { symbol: string; percentage: number }) => (
                        <span key={a.symbol} className="text-xs bg-white/5 px-1.5 py-0.5 rounded">
                          {a.symbol} {a.percentage}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

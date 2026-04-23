"use client"

import React, { useState, useEffect } from "react"
import { Check, Loader2, Zap, Crown, Sparkles, AlertCircle, ArrowRight, Shield, Cpu } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingClientProps {
  currentPlan: string
  hasSubscription: boolean
}

interface Plan {
  id: string
  name: string
  icon: React.ElementType
  price: { monthly: number; yearly: number }
  description: string
  badge?: string
  features: string[]
  addons?: string
  highlighted: boolean
  tier: "free" | "pro" | "premium"
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    icon: Sparkles,
    tier: "free",
    price: { monthly: 0, yearly: 0 },
    description: "Découvrez l'IA crypto sans risque",
    features: [
      "1 analyse IA / mois (Claude Haiku)",
      "Tableau de bord marché en direct",
      "8 cryptos majeures + courbes 7j",
      "Historique des 3 dernières analyses",
      "Score de confiance IA (0–100)",
      "Profil investisseur personnalisé",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    tier: "pro",
    price: { monthly: 29, yearly: 290 },
    description: "Investissez avec méthode, chaque mois",
    badge: "Populaire",
    features: [
      "20 analyses IA / mois (Claude Sonnet)",
      "Historique complet — 10 analyses",
      "Justification détaillée par actif",
      "Signal marché temps réel intégré",
      "Export PDF des rapports",
      "Support prioritaire (< 24h)",
    ],
    addons: "Tout le plan Gratuit, plus :",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    tier: "premium",
    price: { monthly: 79, yearly: 790 },
    description: "Stratégie institutionnelle, modèle le plus puissant",
    features: [
      "Analyses illimitées (Claude Opus 4.7)",
      "Historique complet — 20 analyses",
      "Stratégie d'entrée chiffrée",
      "Seuils de rééquilibrage précis",
      "Accès anticipé aux nouvelles fonctions",
      "Support dédié (< 4h)",
    ],
    addons: "Tout le plan Pro, plus :",
    highlighted: false,
  },
]

const TRUST_SIGNALS = [
  { icon: Shield,   text: "Paiement sécurisé Stripe · SSL 256-bit" },
  { icon: Cpu,      text: "Alimenté par Claude · Anthropic AI" },
  { icon: Sparkles, text: "Annulez à tout moment · Sans engagement" },
]

export function PricingClient({ currentPlan, hasSubscription }: PricingClientProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [priceIds, setPriceIds] = useState<Record<string, Record<string, string | null>>>({})
  const [priceError, setPriceError] = useState(false)

  useEffect(() => {
    fetch("/api/stripe/plans")
      .then((r) => r.json())
      .then(setPriceIds)
      .catch(() => setPriceError(true))
  }, [])

  const handleSubscribe = async (planId: string) => {
    if (planId === "free" || planId === currentPlan) return
    const priceId = priceIds[planId]?.[billing]
    if (!priceId) { alert("Configuration de paiement indisponible. Contactez le support."); return }
    setLoadingPlan(planId)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: planId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur de paiement")
    } finally { setLoadingPlan(null) }
  }

  const handleManageSubscription = async () => {
    setLoadingPlan("manage")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur portail")
    } finally { setLoadingPlan(null) }
  }

  return (
    <div className="max-w-5xl mx-auto py-6 animate-slide-up">

      {/* Header */}
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Tarifs transparents</span>
        </div>
        <h1 className="text-5xl font-black text-foreground mb-3 tracking-tight">
          Choisissez votre plan
        </h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto leading-relaxed">
          Commencez gratuitement. Passez au Pro quand vous êtes prêt.
        </p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 p-1 bg-secondary rounded-2xl border border-border">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
              billing === "monthly"
                ? "bg-card text-foreground border border-border shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
              billing === "yearly"
                ? "bg-card text-foreground border border-border shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annuel
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md font-black">−17%</span>
          </button>
        </div>
      </div>

      {priceError && (
        <div className="mb-8 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-amber-700 text-sm max-w-lg mx-auto">
          <AlertCircle className="w-4 h-4 shrink-0" />
          Paiement en cours de configuration. Contactez-nous pour upgrader.
        </div>
      )}

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-5 items-start mb-12">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const Icon = plan.icon
          const price = plan.price[billing]
          const isLoading = loadingPlan === plan.id
          const isPremium = plan.tier === "premium"
          const isPro = plan.tier === "pro"

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-2xl transition-all",
                isPremium
                  ? "card-premium-light p-8"
                  : isPro
                  ? "bg-gradient-to-b from-amber-50 to-card border border-amber-200 p-8"
                  : "bg-card border border-border p-8"
              )}
            >
              {/* Gradient top line */}
              {isPro && (
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/60 to-transparent rounded-full" />
              )}
              {isPremium && (
                <div className="absolute top-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-amber-400/80 to-transparent rounded-full" />
              )}

              {/* Badge */}
              {plan.badge && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-amber-500 text-black text-[10px] font-black rounded-full shadow-lg whitespace-nowrap uppercase tracking-widest">
                  {plan.badge}
                </div>
              )}
              {isPremium && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 text-[10px] font-black rounded-full whitespace-nowrap uppercase tracking-widest badge-premium">
                  Élite
                </div>
              )}
              {isCurrent && (
                <div className={cn(
                  "absolute -top-3.5 right-5 px-3 py-1 text-[10px] font-black rounded-full",
                  isPro ? "bg-amber-500 text-black" : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                )}>
                  Plan actuel
                </div>
              )}

              {/* Icon + Name */}
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center",
                    isPremium ? "bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20"
                      : isPro ? "bg-amber-100 border border-amber-200"
                      : "bg-secondary border border-border"
                  )}>
                    <Icon className={cn("w-5 h-5", isPremium || isPro ? "text-amber-500" : "text-muted-foreground")} />
                  </div>
                  <div>
                    <h3 className={cn("font-black text-xl leading-none", isPremium ? "gradient-text-gold" : "text-foreground")}>{plan.name}</h3>
                  </div>
                </div>
                <p className={cn("text-sm mb-5 leading-relaxed", isPremium ? "text-muted-foreground" : "text-muted-foreground")}>{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className={cn("text-4xl font-black tracking-tight", isPremium ? "gradient-text-gold" : "text-foreground")}>
                    {price === 0 ? "Gratuit" : `${price}€`}
                  </span>
                  {price > 0 && (
                    <span className={cn("text-sm", isPremium ? "text-muted-foreground" : "text-muted-foreground")}>/{billing === "monthly" ? "mois" : "an"}</span>
                  )}
                </div>
                {billing === "yearly" && price > 0 && (
                  <p className="text-xs font-semibold text-emerald-600">
                    Soit {Math.round(price / 12)}€/mois — économisez {plan.price.monthly * 12 - price}€
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {plan.addons && (
                  <li className="pb-1">
                    <span className={cn("text-[10px] font-bold uppercase tracking-widest", isPremium ? "text-muted-foreground" : "text-muted-foreground")}>
                      {plan.addons}
                    </span>
                  </li>
                )}
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <div className={cn(
                      "w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                      isPremium ? "bg-amber-500/15 border border-amber-500/20"
                        : isPro ? "bg-amber-100"
                        : "bg-secondary"
                    )}>
                      <Check className={cn("w-2.5 h-2.5", isPremium || isPro ? "text-amber-500" : "text-muted-foreground")} />
                    </div>
                    <span className={cn("leading-relaxed", isPremium ? "text-muted-foreground" : "text-muted-foreground")}>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent && hasSubscription ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingPlan === "manage"}
                  className="w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 bg-secondary text-foreground hover:bg-secondary/80 border border-border"
                >
                  {loadingPlan === "manage" && <Loader2 className="w-4 h-4 animate-spin" />}
                  Gérer l&apos;abonnement
                </button>
              ) : isCurrent ? (
                <div className="w-full py-3.5 text-center text-sm font-semibold rounded-xl bg-secondary text-muted-foreground border border-border">
                  Plan actuel
                </div>
              ) : plan.id === "free" ? (
                <div className="w-full py-3.5 text-center text-xs text-muted-foreground border border-border rounded-xl bg-transparent">
                  Toujours gratuit · aucune carte requise
                </div>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || priceError}
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50",
                    isPremium
                      ? "bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black glow-sm-gold"
                      : isPro
                      ? "bg-amber-500 hover:bg-amber-400 text-black glow-sm-gold"
                      : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                  )}
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" />Redirection…</>
                    : <><ArrowRight className="w-4 h-4" />Passer au {plan.name}</>
                  }
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Trust signals */}
      <div className="flex items-center justify-center gap-8 flex-wrap">
        {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-2 text-muted-foreground">
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs">{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

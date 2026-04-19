"use client"

import { useState } from "react"
import { Check, Loader2, Zap, Crown, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingClientProps {
  currentPlan: string
  hasSubscription: boolean
}

const PLANS = [
  {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: { monthly: 0, yearly: 0 },
    priceId: { monthly: null, yearly: null },
    description: "Pour découvrir la plateforme",
    features: [
      "1 analyse IA par mois",
      "1 portfolio",
      "Données avec 15min de délai",
      "Support email",
    ],
    cta: "Plan actuel",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    price: { monthly: 29, yearly: 290 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY ?? "price_pro",
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_YEARLY ?? "price_pro_yearly",
    },
    description: "Pour les investisseurs sérieux",
    features: [
      "20 analyses IA par mois",
      "3 portfolios",
      "Données en temps réel",
      "Alertes de prix",
      "Rapports PDF exportables",
      "Support prioritaire",
    ],
    cta: "Passer au Pro",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    price: { monthly: 79, yearly: 790 },
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_MONTHLY ?? "price_premium",
      yearly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM_YEARLY ?? "price_premium_yearly",
    },
    description: "Pour les professionnels",
    features: [
      "Analyses IA illimitées",
      "Portfolios illimités",
      "Données temps réel + historique",
      "Signaux de trading avancés",
      "Accès API complet",
      "Gestionnaire de compte dédié",
      "Accès bêta exclusif",
    ],
    cta: "Passer au Premium",
    highlighted: false,
  },
]

export function PricingClient({ currentPlan, hasSubscription }: PricingClientProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  const handleSubscribe = async (plan: typeof PLANS[0]) => {
    if (plan.id === "free" || plan.id === currentPlan) return
    const priceId = plan.priceId[billing]
    if (!priceId) return

    setLoadingPlan(plan.id)
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: plan.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPlan("manage")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-3">Plans & Tarifs</h1>
        <p className="text-white/40 mb-8">Choisissez le plan adapté à vos besoins</p>

        {/* Billing toggle */}
        <div className="inline-flex items-center gap-1 p-1 glass rounded-xl border border-white/8">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all",
              billing === "monthly" ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white"
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
              billing === "yearly" ? "bg-indigo-600 text-white" : "text-white/50 hover:text-white"
            )}
          >
            Annuel
            <span className="text-xs bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md">-17%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const Icon = plan.icon
          const price = plan.price[billing]
          const isLoading = loadingPlan === plan.id

          return (
            <div
              key={plan.id}
              className={cn(
                "p-8 rounded-2xl relative flex flex-col",
                plan.highlighted
                  ? "bg-indigo-600/15 border border-indigo-500/30 glow-purple"
                  : "glass border border-white/5"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">
                  Le plus populaire
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4 px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
                  Plan actuel
                </div>
              )}

              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    plan.highlighted ? "bg-indigo-600" : "bg-white/10"
                  )}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                </div>
                <p className="text-sm text-white/40 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{price === 0 ? "Gratuit" : `${price}€`}</span>
                  {price > 0 && <span className="text-white/40 text-sm">/{billing === "monthly" ? "mois" : "an"}</span>}
                </div>
                {billing === "yearly" && price > 0 && (
                  <p className="text-xs text-emerald-400 mt-1">
                    Soit {Math.round(price / 12)}€/mois — économisez {plan.price.monthly * 12 - price}€
                  </p>
                )}
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <div className={cn("w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5", plan.highlighted ? "bg-indigo-600" : "bg-white/10")}>
                      <Check className="w-2.5 h-2.5" />
                    </div>
                    <span className="text-white/70">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                hasSubscription ? (
                  <button
                    onClick={handleManageSubscription}
                    disabled={loadingPlan === "manage"}
                    className="w-full py-3 glass-strong border border-white/10 text-sm font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    {loadingPlan === "manage" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Gérer l&apos;abonnement
                  </button>
                ) : (
                  <div className="w-full py-3 text-center text-sm font-medium text-white/30 border border-white/5 rounded-xl">
                    Plan actuel
                  </div>
                )
              ) : (
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading || plan.id === "free"}
                  className={cn(
                    "w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2",
                    plan.highlighted
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white"
                      : "glass-strong border border-white/10 hover:bg-white/10 text-white",
                    plan.id === "free" && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {plan.id === "free" ? "Plan gratuit" : plan.cta}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-12 text-center text-sm text-white/30">
        <p>Paiement sécurisé par Stripe. Annulez à tout moment. Sans engagement.</p>
      </div>
    </div>
  )
}

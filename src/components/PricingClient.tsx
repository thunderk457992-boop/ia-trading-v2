"use client"

import React, { useEffect, useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import {
  AlertCircle,
  ArrowRight,
  Check,
  CreditCard,
  Cpu,
  Crown,
  Loader2,
  Lock,
  MessageSquare,
  Shield,
  Sparkles,
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingClientProps {
  currentPlan: string
  hasSubscription: boolean
  canManageBilling: boolean
  showCancelledNotice?: boolean
  showSuccessNotice?: boolean
  successPlan?: string | null
}

interface Plan {
  id: string
  name: string
  icon: React.ElementType
  price: { monthly: number; yearly: number }
  description: string
  bestFor: string
  promise: string
  badge?: string
  features: string[]
  locked?: string[]
  addons?: string
  highlighted: boolean
  tier: "free" | "pro" | "premium"
}

interface WalletSupportState {
  loading: boolean
  applePay: boolean
  googlePay: boolean
  secureContext: boolean
  reason: string
}

const EURO_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatEuro(value: number) {
  return EURO_FORMATTER.format(value)
}

function getYearlySavings(plan: Plan) {
  if (plan.price.monthly <= 0 || plan.price.yearly <= 0) return 0
  return (plan.price.monthly * 12) - plan.price.yearly
}

function getYearlyDiscount(plan: Plan) {
  if (plan.price.monthly <= 0 || plan.price.yearly <= 0) return 0
  return Math.round((getYearlySavings(plan) / (plan.price.monthly * 12)) * 100)
}

function getMonthlyEquivalent(plan: Plan) {
  if (plan.price.yearly <= 0) return 0
  return plan.price.yearly / 12
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Gratuit",
    icon: Sparkles,
    tier: "free",
    price: { monthly: 0, yearly: 0 },
    description:
      "Tester la methode, voir une premiere allocation et comprendre le produit avant toute depense.",
    bestFor:
      "Pour tester si Axiom vous aide vraiment a investir avec plus de methode, sans carte bancaire.",
    promise:
      "Vous repartez avec une premiere analyse, un premier plan et un premier apercu du dashboard.",
    features: [
      "1 analyse IA / mois (Claude Haiku)",
      "12 messages de chat IA / mois",
      "Allocation et plan d'action de base",
      "Tableau de bord marche",
      "Historique limite a 3 analyses",
      "Profil investisseur personnalise",
    ],
    locked: [
      "Signal marche detaille",
      "Export PDF",
      "Chat relie aux analyses personnelles",
      "Projections et alertes premium",
    ],
    highlighted: false,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Zap,
    tier: "pro",
    price: { monthly: 24.99, yearly: 219.99 },
    description:
      "Investir avec une methode claire, plus de contexte marche et un historique qui reste utile dans le temps.",
    bestFor:
      "Pour les investisseurs qui veulent un vrai cadre de decision, pas seulement une premiere opinion.",
    promise:
      "Vous gagnez en discipline, en contexte et en capacite a relire vos decisions au lieu d'investir au feeling.",
    badge: "Le plus choisi",
    features: [
      "20 analyses IA / mois (Claude Sonnet)",
      "120 messages de chat IA / mois",
      "Historique etendu sur 10 analyses",
      "Justification detaillee par actif",
      "Signal marche et verdict Pro",
      "Plan dans le temps",
      "Export PDF des rapports",
      "Chat relie aux 2 dernieres analyses",
    ],
    locked: [
      "Strategie d'entree avancee",
      "Chat Premium avec contexte enrichi",
      "Projections de scenarios",
      "Alertes de risque premium",
    ],
    addons: "Tout le plan Gratuit, plus :",
    highlighted: true,
  },
  {
    id: "premium",
    name: "Premium",
    icon: Crown,
    tier: "premium",
    price: { monthly: 59.99, yearly: 499.99 },
    description:
      "Suivi avance, scenarios, contexte plus long et lecture du risque plus fine.",
    bestFor:
      "Pour les utilisateurs qui veulent plus de profondeur, plus de suivi et plus de contexte dans la duree.",
    promise:
      "Vous obtenez un cadre plus riche pour suivre, comparer des scenarios et garder plus d'historique utile.",
    features: [
      "Analyses illimitees (Claude Opus 4.7)",
      "Chat IA Premium sans quota mensuel dur",
      "Historique complet sur 20 analyses",
      "Lecture de marche approfondie",
      "Strategie d'entree chiffree",
      "Seuils de reequilibrage precis",
      "Projections selon les marches",
      "Alertes de risque a eviter",
      "Chat relie aux 5 dernieres analyses",
    ],
    addons: "Tout le plan Pro, plus :",
    highlighted: false,
  },
]

const TRUST_SIGNALS = [
  { icon: Shield, text: "Paiement securise Stripe" },
  { icon: Cpu, text: "Claude IA integre au produit" },
  { icon: MessageSquare, text: "Chat IA relie au plan utilisateur" },
]

const PRICING_FAQ = [
  {
    question: "Puis-je commencer sans carte bancaire ?",
    answer: "Oui. Le plan Gratuit permet de tester Axiom sans carte bancaire.",
  },
  {
    question: "Puis-je resilier a tout moment ?",
    answer:
      "Oui. Le checkout et la facturation passent par Stripe, avec un espace de gestion pour modifier ou resilier l'abonnement.",
  },
  {
    question: "Est-ce un conseil financier ?",
    answer:
      "Non. Axiom structure une strategie et aide a lire le risque. Le produit ne promet ni rendement, ni prediction de marche.",
  },
  {
    question: "Quelles donnees sont utilisees ?",
    answer:
      "Le produit combine votre profil investisseur, les allocations generees et les donnees marche disponibles via CoinGecko, avec Kraken si disponible pour les snapshots portefeuille.",
  },
] as const

const MAX_YEARLY_DISCOUNT = Math.max(...PLANS.map((plan) => getYearlyDiscount(plan)))

export function PricingClient({
  currentPlan,
  hasSubscription,
  canManageBilling,
  showCancelledNotice = false,
  showSuccessNotice = false,
  successPlan = null,
}: PricingClientProps) {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly")
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [priceIds, setPriceIds] = useState<Record<string, Record<string, string | null>>>({})
  const [priceError, setPriceError] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [walletSupport, setWalletSupport] = useState<WalletSupportState>({
    loading: true,
    applePay: false,
    googlePay: false,
    secureContext: false,
    reason: "Verification des moyens de paiement sur cet appareil.",
  })

  useEffect(() => {
    fetch("/api/stripe/plans", { cache: "no-store" })
      .then((response) => response.json())
      .then(setPriceIds)
      .catch(() => setPriceError(true))
  }, [])

  useEffect(() => {
    let active = true

    const detectWallets = async () => {
      if (typeof window === "undefined") return

      const secureContext =
        window.isSecureContext ||
        window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"

      const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY

      if (!publicKey) {
        if (!active) return
        setWalletSupport({
          loading: false,
          applePay: false,
          googlePay: false,
          secureContext,
          reason:
            "La configuration Stripe est incomplete ici. Le paiement par carte reste le fallback attendu.",
        })
        return
      }

      if (!secureContext) {
        if (!active) return
        setWalletSupport({
          loading: false,
          applePay: false,
          googlePay: false,
          secureContext: false,
          reason:
            "Le paiement rapide demande un contexte securise. Sans HTTPS, Stripe repasse sur la carte bancaire.",
        })
        return
      }

      let applePay = false
      let googlePay = false

      const applePaySession = (
        window as Window & {
          ApplePaySession?: {
            canMakePayments?: () => boolean
          }
        }
      ).ApplePaySession

      applePay = !!applePaySession?.canMakePayments?.()

      try {
        const stripe = await loadStripe(publicKey)
        if (stripe) {
          const paymentRequest = stripe.paymentRequest({
            country: "FR",
            currency: "eur",
            total: { label: "Axiom", amount: 2499 },
            requestPayerName: true,
            requestPayerEmail: true,
          })

          const result = await paymentRequest.canMakePayment()
          const walletResult = result as { applePay?: boolean; googlePay?: boolean } | null

          applePay = applePay || !!walletResult?.applePay
          googlePay = !!walletResult?.googlePay
        }
      } catch {
        // Stripe Checkout remains available as the reliable fallback.
      }

      if (!active) return

      setWalletSupport({
        loading: false,
        applePay,
        googlePay,
        secureContext,
        reason:
          applePay || googlePay
            ? "Les wallets disponibles apparaitront automatiquement sur Stripe Checkout."
            : "Aucun wallet compatible detecte sur cet appareil. Stripe proposera la carte bancaire.",
      })
    }

    void detectWallets()

    return () => {
      active = false
    }
  }, [])

  const handleSubscribe = async (planId: string) => {
    if (planId === "free" || planId === currentPlan) return

    setCheckoutError(null)
    const priceId = priceIds[planId]?.[billing]
    if (!priceId) {
      setCheckoutError("Le paiement n'est pas disponible pour le moment. Reessayez un peu plus tard.")
      return
    }

    setLoadingPlan(planId)
    const startCheckout = () =>
      fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, plan: planId }),
      })

    try {
      let response = await startCheckout()
      let data = await response.json()

      if (!response.ok && response.status === 409 && data.manageBilling && !canManageBilling) {
        const syncRes = await fetch("/api/stripe/sync", { method: "POST" })
        const syncData = (await syncRes.json().catch(() => ({}))) as {
          synced?: boolean
          plan?: string
          reason?: string
          error?: string
        }

        const customerCleared =
          syncRes.ok &&
          (syncData.reason === "invalid_customer" ||
            syncData.reason === "no_customer" ||
            syncData.plan === "free")

        if (!customerCleared) {
          throw new Error(
            syncData.error ??
              "Votre abonnement doit etre resynchronise avant de pouvoir modifier ce plan."
          )
        }

        response = await startCheckout()
        data = await response.json()
      }

      if (!response.ok) {
        if (response.status === 401) {
          window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`)
          return
        }

        if (data.manageBilling) {
          if (!canManageBilling) {
            throw new Error("Aucun customer Stripe live valide n'est relie a ce compte pour le moment.")
          }

          setLoadingPlan("manage")
          const portalRes = await fetch("/api/stripe/portal", { method: "POST" })
          const portalData = await portalRes.json()

          if (portalRes.ok && portalData.url) {
            window.location.assign(portalData.url)
            return
          }

          throw new Error(portalData.error ?? "Le portail de facturation est indisponible.")
        }

        throw new Error(data.error)
      }

      if (!data.url || typeof data.url !== "string") {
        throw new Error("Stripe Checkout n'a pas renvoye d'URL de redirection.")
      }

      window.location.assign(data.url)
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Le paiement n'a pas pu demarrer. Reessayez."
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleManageSubscription = async () => {
    setCheckoutError(null)
    setLoadingPlan("manage")

    try {
      const response = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error)
      if (data.url) window.location.assign(data.url)
    } catch (error) {
      setCheckoutError(
        error instanceof Error
          ? error.message
          : "L'espace abonnement est indisponible pour le moment."
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className="mx-auto max-w-6xl animate-slide-up py-4 sm:py-6">
      <div className="mb-10 text-center sm:mb-14">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-card-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Tarifs transparents
          </span>
        </div>

        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Choisissez le niveau d&apos;accompagnement qui vous correspond
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
          Free sert a tester. Pro sert a investir avec methode. Premium sert a suivre, comparer des scenarios
          et garder plus de contexte dans le temps.
        </p>

        <div className="mx-auto mb-8 grid max-w-4xl gap-3 md:grid-cols-3">
          {[
            {
              title: "Free = tester",
              body: "Voir si la logique produit vous aide vraiment a clarifier votre premiere allocation.",
            },
            {
              title: "Pro = investir avec methode",
              body: "Plus d'analyses, plus de contexte marche et un historique utile pour eviter les decisions impulsives.",
            },
            {
              title: "Premium = suivi avance",
              body: "Plus de profondeur, plus de scenarios et plus de contexte pour suivre votre portefeuille dans la duree.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-3xl border border-border bg-card p-5 text-left shadow-card-xs">
              <h2 className="text-base font-semibold text-foreground">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>

        <div className="inline-flex w-full max-w-sm flex-col items-stretch gap-1 rounded-2xl border border-border bg-secondary p-1 sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "w-full rounded-xl px-5 py-2.5 text-sm font-semibold transition-all sm:w-auto",
              billing === "monthly"
                ? "border border-border bg-card text-foreground shadow-card-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={cn(
              "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all sm:w-auto",
              billing === "yearly"
                ? "border border-border bg-card text-foreground shadow-card-xs"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Annuel
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Jusqu&apos;a -{MAX_YEARLY_DISCOUNT}%
            </span>
          </button>
        </div>
      </div>

      {priceError && (
        <div className="mx-auto mb-8 flex max-w-lg items-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground shadow-card-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Le paiement est indisponible pour le moment. Reessayez plus tard ou contactez-nous.
        </div>
      )}

      {showCancelledNotice && (
        <div
          data-testid="pricing-cancelled-banner"
          className="mx-auto mb-8 flex max-w-lg items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 shadow-card-xs"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Paiement annule. Aucun montant n&apos;a ete debite.</span>
        </div>
      )}

      {showSuccessNotice && (
        <div
          data-testid="pricing-success-banner"
          className="mx-auto mb-8 flex max-w-lg items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-card-xs"
        >
          <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Paiement confirme{successPlan ? ` pour le plan ${successPlan}` : ""}. Votre abonnement sera synchronise
            dans quelques instants.
          </span>
        </div>
      )}

      {checkoutError && (
        <div className="mx-auto mb-8 flex max-w-lg items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-card-xs">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{checkoutError}</span>
        </div>
      )}

      <div className="mx-auto mb-8 max-w-3xl rounded-3xl border border-border bg-card p-4 shadow-card-xs sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Paiement
            </p>
            <h2 className="mt-2 text-base font-semibold text-foreground">Paiement rapide via Stripe Checkout</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {walletSupport.loading ? "Detection en cours sur cet appareil." : walletSupport.reason}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Apple Pay et Google Pay n&apos;apparaissent que si l&apos;appareil, le navigateur et Stripe les autorisent.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {walletSupport.applePay ? (
              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                Apple Pay
              </span>
            ) : null}
            {walletSupport.googlePay ? (
              <span className="inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground">
                Google Pay
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-xs font-medium text-foreground">
              <CreditCard className="h-3.5 w-3.5" />
              Carte bancaire
            </span>
          </div>
        </div>
      </div>

      <div className="mb-12 grid items-start gap-4 md:grid-cols-3 md:gap-5">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id
          const Icon = plan.icon
          const price = plan.price[billing]
          const isLoading = loadingPlan === plan.id
          const isPremium = plan.tier === "premium"
          const isPro = plan.tier === "pro"
          const yearlySavings = getYearlySavings(plan)
          const yearlyDiscount = getYearlyDiscount(plan)
          const monthlyEquivalent = getMonthlyEquivalent(plan)
          const yearlyReference = plan.price.monthly * 12

          return (
            <div
              key={plan.id}
              className={cn(
                "relative flex flex-col rounded-3xl border bg-card p-6 shadow-card transition-all sm:p-8",
                isPremium ? "card-premium-light" : "border-border"
              )}
            >
              {(isPro || isPremium) && (
                <div className="absolute left-8 right-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-foreground/18 to-transparent" />
              )}

              {plan.badge && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-foreground bg-foreground px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-background shadow-card-xs">
                  {plan.badge}
                </div>
              )}

              {isPremium && !isCurrent && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full border border-border bg-card px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground shadow-card-xs">
                  Elite
                </div>
              )}

              {isCurrent && (
                <div
                  className={cn(
                    "absolute -top-3.5 right-5 rounded-full px-3 py-1 text-[10px] font-semibold",
                    isPremium
                      ? "border border-foreground bg-foreground text-background"
                      : "border border-border bg-secondary text-foreground"
                  )}
                >
                  Plan actuel
                </div>
              )}

              <div className="mb-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-secondary">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold leading-none text-foreground">{plan.name}</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{plan.bestFor}</p>
                  </div>
                </div>

                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{plan.description}</p>

                <div className="mb-1 flex items-baseline gap-1.5">
                  <span className="text-4xl font-semibold tracking-tight text-foreground">
                    {price === 0 ? "Gratuit" : formatEuro(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground">/{billing === "monthly" ? "mois" : "an"}</span>
                  )}
                </div>

                {price === 0 ? (
                  <p className="mt-2 text-xs font-medium text-emerald-700">Aucune carte requise</p>
                ) : null}

                {price > 0 && billing === "monthly" && (
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-emerald-700">
                      {formatEuro(plan.price.yearly)} / an - economisez {formatEuro(yearlySavings)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Facturation annuelle a -{yearlyDiscount}% par rapport au mensuel.
                    </p>
                  </div>
                )}

                {price > 0 && billing === "yearly" && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
                        -{yearlyDiscount}%
                      </span>
                      <span className="text-xs font-medium text-emerald-700">
                        Economisez {formatEuro(yearlySavings)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-muted-foreground">
                      Soit {formatEuro(monthlyEquivalent)} / mois
                    </p>
                    <p className="text-xs text-muted-foreground line-through">
                      Au lieu de {formatEuro(yearlyReference)} / an
                    </p>
                  </div>
                )}
              </div>

              <div className="mb-5 rounded-2xl border border-border bg-secondary/70 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Pour vous
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">{plan.promise}</p>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.addons ? (
                  <li className="pb-1">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {plan.addons}
                    </span>
                  </li>
                ) : null}

                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
                      <Check className="h-2.5 w-2.5 text-foreground" />
                    </div>
                    <span className="leading-relaxed text-foreground">{feature}</span>
                  </li>
                ))}

                {plan.locked && plan.locked.length > 0 ? (
                  <>
                    <li className="pt-2">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Non inclus
                      </span>
                    </li>
                    {plan.locked.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border bg-secondary">
                          <Lock className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <span className="leading-relaxed text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </>
                ) : null}
              </ul>

              {isCurrent && canManageBilling ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingPlan === "manage"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary py-3.5 text-sm font-semibold text-foreground transition-all hover:bg-secondary/80"
                >
                  {loadingPlan === "manage" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Gerer mon abonnement
                </button>
              ) : isCurrent ? (
                <div className="w-full rounded-2xl border border-border bg-secondary py-3.5 text-center text-sm font-medium text-muted-foreground">
                  {hasSubscription && !canManageBilling
                    ? "Plan actif - synchronisation requise"
                    : "Plan actuel"}
                </div>
              ) : plan.id === "free" ? (
                <div className="w-full rounded-2xl border border-border bg-transparent py-3.5 text-center text-xs text-muted-foreground">
                  Toujours gratuit, sans carte bancaire
                </div>
              ) : canManageBilling ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={loadingPlan === "manage"}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-foreground bg-foreground py-3.5 text-sm font-semibold text-background transition-all hover:bg-foreground/92 disabled:opacity-50"
                >
                  {loadingPlan === "manage" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Modifier mon abonnement
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isLoading || priceError}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold transition-all disabled:opacity-50",
                    isPro || isPremium
                      ? "border border-foreground bg-foreground text-background hover:bg-foreground/92"
                      : "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                  )}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Choisir {plan.name}
                    </>
                  )}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mb-12 grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-card sm:grid-cols-3">
        {TRUST_SIGNALS.map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-center gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
            <Icon className="h-4 w-4 shrink-0 text-foreground" />
            <span className="text-sm text-muted-foreground">{text}</span>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-card">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">FAQ pricing</p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Les questions qui reviennent avant de payer
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {PRICING_FAQ.map((item) => (
            <div key={item.question} className="rounded-3xl border border-border bg-secondary p-5">
              <h3 className="text-base font-semibold text-foreground">{item.question}</h3>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

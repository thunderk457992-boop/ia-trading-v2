"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Check, Crown, MessageSquare, Sparkles, Zap } from "lucide-react"
import { AxiomGlyph, AxiomLogo } from "@/components/branding/AxiomLogo"

const EXAMPLE_ALLOCATION = [
  { asset: "BTC", pct: 40, label: "Bitcoin" },
  { asset: "ETH", pct: 30, label: "Ethereum" },
  { asset: "SOL", pct: 15, label: "Solana" },
  { asset: "BNB", pct: 10, label: "BNB" },
  { asset: "AVAX", pct: 5, label: "Avalanche" },
]

const BAR_COLORS: Record<string, string> = {
  BTC: "bg-amber-400",
  ETH: "bg-blue-500",
  SOL: "bg-violet-500",
  BNB: "bg-yellow-400",
  AVAX: "bg-rose-500",
}

const HOME_PRICE_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const HOME_PRICING_PLANS = [
  {
    name: "Gratuit",
    price: { monthly: 0, yearly: 0 },
    icon: Sparkles,
    features: ["1 analyse IA par mois", "12 messages de chat IA", "Allocation et plan de base", "Historique 3 analyses"],
    cta: "Commencer gratuitement",
    highlighted: false,
    href: "/register",
    badge: null,
  },
  {
    name: "Pro",
    price: { monthly: 24.99, yearly: 219.99 },
    icon: Zap,
    features: ["20 analyses IA par mois", "120 messages de chat IA", "Signal marché détaillé", "Export PDF", "Chat connecté aux 2 dernières analyses"],
    cta: "Choisir Pro",
    highlighted: true,
    href: "/register",
    badge: "Populaire",
  },
  {
    name: "Premium",
    price: { monthly: 59.99, yearly: 499.99 },
    icon: Crown,
    features: ["Analyses illimitées", "Chat Premium sans quota mensuel dur", "Claude Opus", "Projections de scénarios", "Contexte des 5 dernières analyses"],
    cta: "Choisir Premium",
    highlighted: false,
    href: "/register",
    badge: null,
  },
] as const

function formatHomePrice(value: number) {
  return HOME_PRICE_FORMATTER.format(value)
}

function getHomeSavings(monthly: number, yearly: number) {
  if (monthly <= 0 || yearly <= 0) return 0
  return (monthly * 12) - yearly
}

function getHomeDiscount(monthly: number, yearly: number) {
  if (monthly <= 0 || yearly <= 0) return 0
  return Math.round((getHomeSavings(monthly, yearly) / (monthly * 12)) * 100)
}

const HOME_MAX_DISCOUNT = Math.max(
  ...HOME_PRICING_PLANS.map((plan) => getHomeDiscount(plan.price.monthly, plan.price.yearly))
)

export default function HomePage() {
  const [pricingBilling, setPricingBilling] = useState<"monthly" | "yearly">("monthly")

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <AxiomLogo />
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#how" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fonctionnement</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Tarifs</Link>
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Connexion</Link>
            <Link href="/register" className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/92">
              Tester gratuitement
            </Link>
          </div>
          <Link href="/register" className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background md:hidden">
            Tester
          </Link>
        </div>
      </nav>

      <section className="px-5 pb-24 pt-28 sm:px-6 sm:pb-28 sm:pt-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card-xs sm:mb-10">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
            Propulsé par Claude AI - Analyses en 30 secondes
          </div>

          <h1 className="mb-4 font-bold leading-[1.02] tracking-tighter text-foreground">
            <span className="block text-4xl sm:text-5xl md:text-7xl">Arrêtez de deviner.</span>
            <span className="mt-1 block text-4xl text-muted-foreground sm:text-5xl md:text-7xl">Investissez avec méthode.</span>
          </h1>

          <p className="mx-auto mb-8 mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:mb-10 sm:mt-8 sm:text-xl">
            Décrivez votre profil, obtenez une allocation crypto cohérente, puis échangez avec un chat IA branché à votre plan et à vos analyses.
          </p>

          <div className="mb-12 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-8 py-4 text-base font-semibold text-background transition-colors hover:bg-foreground/92 sm:w-auto">
              Tester gratuitement
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="#how" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary/80 sm:w-auto">
              Voir un exemple
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground sm:gap-6">
            {["Sans carte de crédit", "30 secondes chrono", "Chat IA intégré"].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-y border-border bg-secondary px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Fonctionnement</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">3 étapes, 30 secondes</h2>
          </div>

          <div className="mb-14 grid gap-8 md:mb-20 md:grid-cols-3 md:gap-10">
            {[
              { n: "01", title: "Renseignez votre profil", desc: "Capital, tolérance au risque, horizon, objectifs. Le strict nécessaire." },
              { n: "02", title: "L'IA analyse", desc: "Claude croise votre profil avec le contexte marché et vos contraintes." },
              { n: "03", title: "Recevez votre plan", desc: "Allocation, plan d'action, lecture de marché et suivi selon votre plan." },
            ].map((item) => (
              <div key={item.n} className="relative">
                <div className="mb-4 select-none text-5xl font-black tracking-tighter text-border">{item.n}</div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="flex flex-col items-start gap-2 border-b border-border bg-secondary px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <AxiomLogo />
                <span className="text-sm font-medium text-muted-foreground">Exemple de résultat</span>
              </div>
              <span className="text-xs text-muted-foreground">Modéré - 5 000 EUR - Moyen terme</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="mb-6 flex items-center gap-4 rounded-2xl border border-border bg-secondary p-4">
                <div className="tabular-nums text-5xl font-semibold text-foreground">82</div>
                <div>
                  <div className="font-bold text-foreground">Bon profil</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Stratégie solide, bonne diversification</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-foreground" />
                    <span className="text-xs font-semibold text-foreground">Risque modéré</span>
                  </div>
                </div>
              </div>

              <div className="mb-5 space-y-3">
                {EXAMPLE_ALLOCATION.map((item) => (
                  <div key={item.asset}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${BAR_COLORS[item.asset]}`} />
                        <span className="text-sm font-bold text-foreground">{item.asset}</span>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{item.pct}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                      <div className={`h-1.5 rounded-full ${BAR_COLORS[item.asset]}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5">
                <p className="mb-1 text-xs font-semibold text-emerald-700">Plan d’action recommandé</p>
                <p className="text-xs leading-relaxed text-emerald-600">
                  Acheter BTC + ETH immédiatement - DCA sur SOL sur 3 mois - Conserver 10% de liquidités
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-background p-3.5">
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  Chat IA
                </div>
                <p className="text-sm leading-6 text-muted-foreground">
                  « Explique-moi pourquoi BTC et ETH sont prioritaires ici. »
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  BTC et ETH stabilisent le portefeuille parce qu’ils concentrent la liquidité et absorbent mieux les phases de correction que les altcoins.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Fonctionnalités</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Un produit sobre, pas un gadget</h2>
          </div>

          <div className="grid gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Advisor IA", desc: "Profil investisseur vers allocation exploitable, en quelques étapes." },
              { title: "Chat IA intégré", desc: "Questions libres, explications, clarifications et prochaines étapes selon votre plan." },
              { title: "Données de marché", desc: "Prix et variations utiles, sans surcharger l'écran de bruit." },
              { title: "Gestion du risque", desc: "Profils prudents ou agressifs, avec des garde-fous visibles." },
              { title: "Historique réel", desc: "Analyses conservées selon votre plan, sans période fake." },
              { title: "Dashboard lisible", desc: "Capital, performance, graph portfolio et contexte produits de façon cohérente." },
            ].map((feature) => (
              <div key={feature.title} className="bg-card p-5 transition-colors hover:bg-secondary sm:p-7">
                <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary">
                  <AxiomGlyph className="h-3.5 w-3.5 text-foreground" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="border-y border-border bg-secondary px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-12 text-center sm:mb-16">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tarifs</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Commencez gratuitement</h2>
            <p className="mt-3 text-muted-foreground">Évoluez quand vous avez besoin de plus de contexte et d’usage.</p>
            <div className="mt-8 inline-flex w-full max-w-sm flex-col items-stretch gap-1 rounded-2xl border border-border bg-card p-1 shadow-card-xs sm:w-auto sm:max-w-none sm:flex-row sm:items-center">
              <button
                onClick={() => setPricingBilling("monthly")}
                className={`w-full rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:w-auto ${
                  pricingBilling === "monthly"
                    ? "border border-border bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setPricingBilling("yearly")}
                className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all sm:w-auto ${
                  pricingBilling === "yearly"
                    ? "border border-border bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Annuel
                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Jusqu&apos;à -{HOME_MAX_DISCOUNT}%
                </span>
              </button>
            </div>
          </div>

          <div className="grid items-stretch gap-4 md:grid-cols-3">
            {HOME_PRICING_PLANS.map((plan) => {
              const Icon = plan.icon
              const price = plan.price[pricingBilling]
              const savings = getHomeSavings(plan.price.monthly, plan.price.yearly)
              const discount = getHomeDiscount(plan.price.monthly, plan.price.yearly)

              return (
                <div key={plan.name} className="relative flex flex-col rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-foreground bg-foreground px-3 py-1 text-xs font-semibold text-background shadow-card-xs">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-8">
                    <div className="mb-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">
                        {price === 0 ? "Gratuit" : formatHomePrice(price)}
                      </span>
                      {price > 0 && (
                        <span className="text-sm text-muted-foreground">
                          /{pricingBilling === "monthly" ? "mois" : "an"}
                        </span>
                      )}
                    </div>
                    {price > 0 && pricingBilling === "monthly" && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        {formatHomePrice(plan.price.yearly)} / an - économisez {formatHomePrice(savings)}
                      </p>
                    )}
                    {price > 0 && pricingBilling === "yearly" && (
                      <p className="mt-2 text-xs font-medium text-emerald-700">
                        -{discount}% - soit {formatHomePrice(plan.price.yearly / 12)} / mois
                      </p>
                    )}
                  </div>
                  <ul className="mb-8 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2.5 text-sm">
                        <Check className="h-4 w-4 shrink-0 text-foreground" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`block rounded-2xl py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-foreground text-background hover:bg-foreground/92"
                        : "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Paiement sécurisé par Stripe - Sans engagement - Annulez à tout moment
          </p>
        </div>
      </section>

      <section className="bg-background px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            1 analyse gratuite dès l’inscription
          </div>
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Votre premier plan crypto IA
            <br />
            en 30 secondes.
          </h2>
          <p className="mb-10 text-lg text-muted-foreground">
            Créez un compte gratuit. Aucune carte requise.
          </p>
          <Link href="/register" className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-8 py-4 font-semibold text-background transition-colors hover:bg-foreground/92 sm:w-auto">
            Tester gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 py-3 shadow-[0_-10px_30px_rgba(17,24,39,0.08)] md:hidden safe-area-bottom">
        <Link href="/register" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 font-semibold text-background transition-colors hover:bg-foreground/92">
          Créer un compte gratuit
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <footer className="border-t border-border bg-secondary px-5 py-10 pb-24 sm:px-6 md:pb-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <AxiomLogo />
            <p className="text-center text-xs text-muted-foreground">
              © 2026 Axiom. Les cryptomonnaies comportent des risques de perte en capital. Ce n’est pas un conseil financier.
            </p>
          <div className="flex items-center gap-5">
            <Link href="/legal/cgu" className="text-xs text-muted-foreground transition-colors hover:text-foreground">CGU</Link>
            <Link href="/legal/privacy" className="text-xs text-muted-foreground transition-colors hover:text-foreground">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

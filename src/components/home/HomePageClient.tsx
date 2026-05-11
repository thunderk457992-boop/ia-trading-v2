"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowRight,
  Brain,
  Check,
  Cpu,
  Crown,
  Database,
  Lock,
  MessageSquare,
  Shield,
  Sparkles,
  Wallet,
  Zap,
} from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { createClient } from "@/lib/supabase/client"

const PRODUCT_ALLOCATION = [
  { asset: "BTC", pct: 42, label: "Bitcoin", tone: "bg-amber-400" },
  { asset: "ETH", pct: 28, label: "Ethereum", tone: "bg-blue-500" },
  { asset: "SOL", pct: 14, label: "Solana", tone: "bg-violet-500" },
  { asset: "BNB", pct: 9, label: "BNB", tone: "bg-yellow-400" },
  { asset: "USDC", pct: 7, label: "Reserve", tone: "bg-emerald-500" },
] as const

const PRODUCT_TIMELINE = [
  "Profil investisseur clarifie en moins d'une minute",
  "Allocation structuree par niveau de risque",
  "Plan d'entree progressif et suivi du portefeuille",
] as const

const HERO_METRICS = [
  { label: "Prix live", value: "CoinGecko + Kraken" },
  { label: "Historique", value: "Snapshots reels" },
  { label: "Sortie", value: "Allocation + plan d'action" },
] as const

const HOME_PRICING_PLANS = [
  {
    name: "Gratuit",
    price: { monthly: 0, yearly: 0 },
    icon: Sparkles,
    audience: "Pour tester la methode sans carte bancaire.",
    summary: "Decouvrir le produit et voir si la logique vous convient.",
    features: [
      "1 analyse IA par mois",
      "12 messages de chat IA",
      "Allocation de base et plan initial",
      "Historique limite a 3 analyses",
    ],
    cta: "Creer mon plan gratuit",
    highlighted: false,
    href: "/register",
    badge: "Aucune carte requise",
  },
  {
    name: "Pro",
    price: { monthly: 24.99, yearly: 219.99 },
    icon: Zap,
    audience: "Pour investir avec methode et plus de contexte marche.",
    summary: "Le bon niveau si vous voulez un cadre, pas seulement une premiere opinion.",
    features: [
      "20 analyses IA par mois",
      "Signal marche detaille",
      "Historique sur 10 analyses",
      "Export PDF et chat relie aux analyses",
    ],
    cta: "Comparer les offres",
    highlighted: true,
    href: "/register",
    badge: "Le plus choisi",
  },
  {
    name: "Premium",
    price: { monthly: 59.99, yearly: 499.99 },
    icon: Crown,
    audience: "Pour le suivi avance, les scenarios et le contexte long.",
    summary: "Pour ceux qui veulent pousser la discipline, le suivi et la lecture des risques.",
    features: [
      "Analyses illimitees",
      "Chat IA Premium",
      "Scenarios et projections",
      "Alertes de risque et contexte enrichi",
    ],
    cta: "Voir un exemple d'analyse",
    highlighted: false,
    href: "/register",
    badge: null,
  },
] as const

const TRUST_ITEMS = [
  {
    title: "Donnees de marche reelles",
    body: "Les prix et variations viennent de CoinGecko, avec Kraken quand il est disponible pour les snapshots portefeuille.",
    icon: Database,
  },
  {
    title: "Paiement et abonnement fiables",
    body: "Stripe gere le paiement, le checkout et l'espace de facturation. Les cartes ne transitent pas par l'application.",
    icon: Shield,
  },
  {
    title: "Compte securise",
    body: "Authentification Supabase, routes protegees et donnees utilisateur separees par compte.",
    icon: Lock,
  },
  {
    title: "Cadre clair",
    body: "Axiom ne promet pas de gains. Le produit structure une strategie, aide a lire le risque et montre ce qui manque quand une donnee n'est pas disponible.",
    icon: Cpu,
  },
] as const

const FIT_ITEMS = {
  yes: [
    "Vous voulez savoir quoi acheter sans empiler dix dashboards.",
    "Vous avez un budget defini et vous voulez une allocation adaptee a votre risque.",
    "Vous cherchez un plan d'entree progressif au lieu d'acheter sous impulsion.",
  ],
  no: [
    "Vous cherchez des promesses de rendement ou des signaux miracles.",
    "Vous voulez trader des memecoins sans cadre ni limite de risque.",
    "Vous ne voulez ni lire le risque, ni suivre un plan dans la duree.",
  ],
}

const FAQ_ITEMS = [
  {
    question: "Qu'est-ce que je recois concretement apres 1 minute ?",
    answer:
      "Un profil investisseur clarifie, une allocation crypto, un score de risque lisible, des actions a faire maintenant et un dashboard qui suit le portefeuille reel.",
  },
  {
    question: "Est-ce que l'IA predit le marche ?",
    answer:
      "Non. Axiom ne predit pas le marche. Il structure une strategie a partir de votre profil, de la volatilite, de la liquidite et du contexte marche disponible.",
  },
  {
    question: "Est-ce adapte aux debutants ?",
    answer:
      "Oui. Le questionnaire reste simple, le vocabulaire peut etre guide et le produit explique pourquoi une allocation est proposee.",
  },
  {
    question: "Comment eviter de confondre performance et nouveau capital ?",
    answer:
      "Le dashboard distingue le capital investi des snapshots portefeuille. Les nouveaux apports ne sont pas presentes comme des gains.",
  },
] as const

const EURO_FORMATTER = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatHomePrice(value: number) {
  return EURO_FORMATTER.format(value)
}

export function HomePageClient() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    const syncUserState = async () => {
      const { data } = await supabase.auth.getUser()
      setIsAuthenticated(Boolean(data.user))
    }

    void syncUserState()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session?.user))
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const navPrimaryHref = isAuthenticated ? "/dashboard" : "/login"
  const navPrimaryLabel = isAuthenticated ? "Dashboard" : "Connexion"
  const navSecondaryHref = isAuthenticated ? "/advisor" : "/register"
  const navSecondaryLabel = isAuthenticated ? "Nouvelle analyse" : "Creer mon plan gratuit"
  const heroPrimaryHref = isAuthenticated ? "/dashboard" : "/register"
  const heroPrimaryLabel = isAuthenticated ? "Ouvrir mon dashboard" : "Creer mon plan gratuit"
  const heroSecondaryHref = isAuthenticated ? "/advisor" : "#example"
  const heroSecondaryLabel = isAuthenticated ? "Nouvelle analyse" : "Voir un exemple d'analyse"
  const pricingHref = isAuthenticated ? "/pricing" : "/register"
  const bottomCtaHref = isAuthenticated ? "/dashboard" : "/register"
  const bottomCtaLabel = isAuthenticated ? "Ouvrir mon dashboard" : "Creer mon plan gratuit"

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <AxiomLogo />
          <div className="hidden items-center gap-7 md:flex">
            <Link href="#product" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Produit
            </Link>
            <Link href="#method" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Methode
            </Link>
            <Link href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Tarifs
            </Link>
            <Link
              href={navPrimaryHref}
              data-testid="home-nav-primary"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {navPrimaryLabel}
            </Link>
            <Link
              href={navSecondaryHref}
              data-testid="home-nav-secondary"
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/92"
            >
              {navSecondaryLabel}
            </Link>
          </div>
          <Link
            href={navSecondaryHref}
            data-testid="home-mobile-primary"
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background md:hidden"
          >
            {isAuthenticated ? "Dashboard" : "Tester"}
          </Link>
        </div>
      </nav>

      <section className="px-5 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
              Strategie crypto personnalisee, donnee marche reelle, plan d&apos;action concret
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[0.98] tracking-tighter text-foreground sm:text-5xl md:text-6xl xl:text-7xl">
              Une strategie crypto
              <span className="block text-muted-foreground">personnalisee, claire et suivable.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Axiom AI transforme votre budget, votre tolerance au risque et le contexte marche en allocation,
              plan d&apos;entree et suivi portefeuille. Vous savez quoi acheter, combien allouer, quand lisser votre
              entree et quels risques garder sous controle.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={heroPrimaryHref}
                data-testid="home-hero-primary"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-8 py-4 text-base font-semibold text-background transition-colors hover:bg-foreground/92 sm:w-auto"
              >
                {heroPrimaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={heroSecondaryHref}
                data-testid="home-hero-secondary"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-8 py-4 text-base font-semibold text-foreground transition-colors hover:bg-secondary/80 sm:w-auto"
              >
                {heroSecondaryLabel}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HERO_METRICS.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card-xs">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 max-w-2xl text-xs leading-6 text-muted-foreground">
              Les cryptomonnaies comportent un risque de perte en capital. Axiom structure une strategie; il ne promet
              ni gain, ni prediction de marche.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_42%)] blur-3xl" />
            <div className="rounded-[32px] border border-white/10 bg-[#08090d] p-4 shadow-[0_40px_120px_rgba(0,0,0,0.45)]">
              <div className="rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AxiomLogo showBadge={false} />
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/60">
                      Produit
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-white/50">Derniere mise a jour 14:28</span>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                          Advisor IA
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-white">Profil, risque, plan</h2>
                      </div>
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-300">
                        1 min
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: "Budget", value: "1 000 EUR" },
                        { label: "Risque", value: "Modere" },
                        { label: "Objectif", value: "Construire un portefeuille progressif" },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                            {item.label}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-white">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                            Dashboard
                          </p>
                          <p className="mt-1 text-lg font-semibold text-white">Historique reel</p>
                        </div>
                        <div className="rounded-full border border-amber-400/20 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold text-amber-200">
                          Prix live
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                              Capital investi
                            </p>
                            <p className="mt-1 text-2xl font-semibold text-white">2 000 EUR</p>
                          </div>
                          <div className="rounded-xl bg-emerald-400/10 px-3 py-1.5 text-sm font-semibold text-emerald-300">
                            +8.4%
                          </div>
                        </div>

                        <div className="mt-4 h-28 rounded-2xl border border-white/10 bg-gradient-to-b from-amber-400/10 to-transparent p-3">
                          <div className="flex h-full items-end gap-2">
                            {[24, 32, 28, 40, 52, 60, 56, 70, 82].map((height, index) => (
                              <div key={index} className="flex-1 rounded-full bg-white/5">
                                <div
                                  className="w-full rounded-full bg-gradient-to-t from-amber-400 to-blue-400"
                                  style={{ height: `${height}%` }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
                          Allocation
                        </p>
                        <span className="text-[11px] font-medium text-white/50">Pourquoi cette allocation ?</span>
                      </div>

                      <div className="space-y-3">
                        {PRODUCT_ALLOCATION.map((item) => (
                          <div key={item.asset}>
                            <div className="mb-1.5 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${item.tone}`} />
                                <span className="text-sm font-semibold text-white">{item.asset}</span>
                                <span className="text-xs text-white/45">{item.label}</span>
                              </div>
                              <span className="text-sm font-semibold text-white">{item.pct}%</span>
                            </div>
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                              <div className={`h-1.5 rounded-full ${item.tone}`} style={{ width: `${item.pct}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {PRODUCT_TIMELINE.map((item, index) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                        Etape 0{index + 1}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-white/85">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="product" className="border-y border-border bg-secondary px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Ce que vous obtenez concretement
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              En environ 1 minute, vous passez du flou a un plan exploitable
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                icon: Brain,
                title: "Savoir quoi acheter",
                body: "Une allocation lisible entre actifs coeur, satellites et reserve, au lieu d'un mix improvise.",
              },
              {
                icon: Wallet,
                title: "Savoir combien allouer",
                body: "Une repartition adaptee a votre budget, votre horizon et votre tolerance au risque.",
              },
              {
                icon: Activity,
                title: "Savoir quand lisser votre entree",
                body: "Un plan d'entree progressif pour eviter les decisions impulsives au pire moment.",
              },
              {
                icon: MessageSquare,
                title: "Savoir comment suivre",
                body: "Un dashboard et un chat IA pour revoir le plan, comprendre le risque et suivre le portefeuille.",
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="rounded-3xl border border-border bg-card p-6 shadow-card">
                  <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background">
                    <Icon className="h-5 w-5 text-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.body}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section id="method" className="px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[32px] border border-border bg-card p-7 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Methodologie</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Axiom ne predit pas le marche. Il structure une strategie.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">
              L&apos;allocation ne sort pas d&apos;un slogan. Elle combine votre profil, votre budget, votre horizon,
              la liquidite des actifs, la volatilite et la diversification. Si une donnee manque, le produit
              doit le dire. Si une periode n&apos;a pas assez d&apos;historique, le dashboard doit l&apos;assumer.
            </p>
            <div className="mt-6 grid gap-3">
              {[
                "Profil utilisateur et tolerance au risque",
                "Budget initial et apports eventuels",
                "Conditions de marche et liquidite des actifs",
                "Diversification, exposition coeur, satellites et reserve",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary px-4 py-3">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/guide"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-colors hover:bg-foreground/92"
              >
                Voir la methode complete
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={heroSecondaryHref}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Voir un exemple d&apos;analyse
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[32px] border border-emerald-200 bg-emerald-50 p-6 shadow-card-xs">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Pour qui</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">Pour les investisseurs qui veulent une methode.</h3>
              <ul className="mt-5 space-y-3">
                {FIT_ITEMS.yes.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[32px] border border-amber-200 bg-amber-50 p-6 shadow-card-xs">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">Pas pour qui</p>
              <h3 className="mt-3 text-2xl font-semibold text-foreground">Pas pour une logique casino crypto.</h3>
              <ul className="mt-5 space-y-3">
                {FIT_ITEMS.no.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <span className="text-sm leading-6 text-slate-700">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[32px] border border-border bg-card p-6 shadow-card sm:col-span-2">
              <div className="grid gap-4 md:grid-cols-2">
                {TRUST_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-3xl border border-border bg-secondary p-5">
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-background">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="example" className="border-y border-border bg-secondary px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Exemple d&apos;analyse
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Un plan lisible avant les prix
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Avant de payer, vous devez comprendre ce que le produit livre vraiment: une allocation, un plan
              d&apos;entree, une logique de risque et une facon concrete de suivre le portefeuille.
            </p>
          </div>

          <div className="overflow-hidden rounded-[32px] border border-border bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <AxiomLogo />
                <span className="text-sm font-medium text-muted-foreground">Exemple produit</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <span className="rounded-full border border-border bg-secondary px-3 py-1">Profil modere</span>
                <span className="rounded-full border border-border bg-secondary px-3 py-1">Capital 5 000 EUR</span>
                <span className="rounded-full border border-border bg-secondary px-3 py-1">Horizon 3-5 ans</span>
              </div>
            </div>

            <div className="grid gap-0 lg:grid-cols-[1fr_0.92fr]">
              <div className="p-5 sm:p-6">
                <div className="mb-6 rounded-3xl border border-border bg-secondary p-4">
                  <div className="flex items-center gap-4">
                    <div className="tabular-nums text-5xl font-semibold text-foreground">82</div>
                    <div>
                      <div className="font-bold text-foreground">Score de strategie solide</div>
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">
                        Diversification correcte, risque modere, plan d&apos;entree compatible avec un investisseur patient.
                      </div>
                      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">Risque modere</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {PRODUCT_ALLOCATION.map((item) => (
                    <div key={item.asset}>
                      <div className="mb-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${item.tone}`} />
                          <span className="text-sm font-bold text-foreground">{item.asset}</span>
                          <span className="text-xs text-muted-foreground">{item.label}</span>
                        </div>
                        <span className="text-sm font-bold text-foreground">{item.pct}%</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-background">
                        <div className={`h-1.5 rounded-full ${item.tone}`} style={{ width: `${item.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-border p-5 sm:p-6 lg:border-l lg:border-t-0">
                <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
                    Ce que vous devez faire maintenant
                  </p>
                  <ol className="mt-4 space-y-3">
                    {[
                      "Entrer sur BTC et ETH avec une taille de position supportable.",
                      "Lisser SOL et BNB sur plusieurs points d'entree au lieu de tout acheter d'un coup.",
                      "Garder une reserve pour ne pas transformer la volatilite en panique.",
                    ].map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[11px] font-bold text-white">
                          {index + 1}
                        </div>
                        <p className="text-sm leading-6 text-slate-700">{step}</p>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-4 rounded-3xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" />
                    Pourquoi cette allocation ?
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    BTC et ETH jouent le role de socle liquide. Les satellites restent minoritaires pour garder
                    de l&apos;upside sans transformer le portefeuille en pari. Le plan d&apos;entree progressif sert a
                    limiter les achats impulsifs pendant les pics de volatilite.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tarifs</p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Comparez les offres avant de vous engager
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Free sert a tester la methode. Pro sert a investir avec une vraie discipline. Premium sert a suivre,
              comparer des scenarios et garder plus de contexte dans le temps.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {HOME_PRICING_PLANS.map((plan) => {
              const Icon = plan.icon
              return (
                <div
                  key={plan.name}
                  className={`relative flex flex-col rounded-[30px] border p-6 shadow-card ${
                    plan.highlighted ? "border-foreground bg-card" : "border-border bg-card"
                  }`}
                >
                  {plan.badge ? (
                    <div className="absolute -top-3 left-6 rounded-full border border-border bg-background px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground">
                      {plan.badge}
                    </div>
                  ) : null}

                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-secondary">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground">{plan.audience}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="text-4xl font-semibold text-foreground">
                      {plan.price.monthly === 0 ? "Gratuit" : formatHomePrice(plan.price.monthly)}
                      {plan.price.monthly > 0 ? <span className="ml-1 text-sm text-muted-foreground">/mois</span> : null}
                    </div>
                    {plan.price.yearly > 0 ? (
                      <p className="mt-2 text-xs text-muted-foreground">
                        ou {formatHomePrice(plan.price.yearly)} / an
                      </p>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-emerald-700">Aucune carte requise</p>
                    )}
                  </div>

                  <p className="mb-5 text-sm leading-6 text-muted-foreground">{plan.summary}</p>

                  <ul className="mb-6 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <span className="leading-6 text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={pricingHref}
                    className={`block rounded-2xl py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-foreground text-background hover:bg-foreground/92"
                        : "border border-border bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {isAuthenticated ? "Comparer les offres" : plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-secondary px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Questions frequentes
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Ce que les utilisateurs veulent comprendre avant de commencer
            </h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {FAQ_ITEMS.map((item) => (
              <div key={item.question} className="rounded-3xl border border-border bg-card p-6 shadow-card-xs">
                <h3 className="text-lg font-semibold text-foreground">{item.question}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-background px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            Donnees live, historique reel, cadre transparent
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Passez de l&apos;intuition a une methode que vous pouvez suivre
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Creez votre plan gratuit, voyez un exemple d&apos;analyse et comparez les offres seulement si vous avez besoin
            de plus de contexte, plus d&apos;historique et plus de suivi.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href={bottomCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-foreground px-8 py-4 font-semibold text-background transition-colors hover:bg-foreground/92"
            >
              {bottomCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={pricingHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary px-8 py-4 font-semibold text-foreground transition-colors hover:bg-secondary/80"
            >
              Comparer les offres
            </Link>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 py-3 shadow-[0_-10px_30px_rgba(17,24,39,0.08)] md:hidden">
        <Link
          href={bottomCtaHref}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground py-3.5 font-semibold text-background transition-colors hover:bg-foreground/92"
        >
          {bottomCtaLabel}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <footer className="border-t border-border bg-secondary px-5 py-10 pb-24 sm:px-6 md:pb-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <AxiomLogo />
          <p className="text-center text-xs leading-6 text-muted-foreground">
            Donnees live si disponibles, paiements via Stripe, authentification via Supabase, et cadre produit
            transparent sur les risques.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/guide" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Guide
            </Link>
            <Link href="/legal/cgu" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              CGU
            </Link>
            <Link href="/legal/privacy" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Confidentialite
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
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
import type { MarketSnapshot } from "@/lib/coingecko"
import { MetricCard } from "@/components/ui/MetricCard"
import { PremiumBadge } from "@/components/ui/PremiumBadge"
import { SectionHeader } from "@/components/ui/SectionHeader"
import { TrustBar } from "@/components/ui/TrustBar"
import { SocialProofStrip } from "@/components/home/SocialProofStrip"

const PRODUCT_ALLOCATION = [
  { asset: "BTC", pct: 42, label: "Bitcoin", tone: "bg-amber-400" },
  { asset: "ETH", pct: 28, label: "Ethereum", tone: "bg-blue-500" },
  { asset: "SOL", pct: 14, label: "Solana", tone: "bg-violet-500" },
  { asset: "BNB", pct: 9, label: "BNB", tone: "bg-yellow-400" },
  { asset: "USDC", pct: 7, label: "Reserve", tone: "bg-emerald-500" },
] as const

const PRODUCT_TIMELINE = [
  "Profil investisseur clarifié en moins d'une minute",
  "Allocation structurée par niveau de risque",
  "Plan d'entrée progressif et suivi du portefeuille",
] as const

const ADVISOR_PREVIEW_FIELDS = [
  {
    label: "Budget",
    value: "1 000 EUR",
    detail: "Point de depart clair",
    icon: Wallet,
  },
  {
    label: "Risque",
    value: "Modere",
    detail: "Reponse a une baisse de 20%",
    icon: Shield,
  },
  {
    label: "Objectif",
    value: "Construire progressivement",
    detail: "Horizon 3-5 ans",
    icon: Activity,
  },
] as const

const DASHBOARD_PREVIEW_AXIS = [
  "09 mai",
  "11 mai",
  "Aujourd'hui",
] as const

const HERO_METRICS = [
  { label: "Prix live", value: "CoinGecko + Kraken" },
  { label: "Historique", value: "Snapshots reels" },
  { label: "Sortie", value: "Allocation + plan d'action" },
] as const

const HERO_TRUST_ITEMS = [
  { icon: Database, text: "Données marché mises à jour automatiquement" },
  { icon: Shield, text: "Paiement sécurisé via Stripe" },
  { icon: Lock, text: "Aucune donnée vendue à des tiers" },
  { icon: Brain, text: "Portefeuille basé sur votre profil réel" },
] as const

const HOME_PRICING_PLANS = [
  {
    name: "Gratuit",
    price: { monthly: 0, yearly: 0 },
    icon: Sparkles,
    audience: "Pour tester la méthode sans carte bancaire.",
    summary: "Decouvrir le produit et voir si la logique vous convient.",
    features: [
      "1 analyse IA par mois",
      "12 messages de chat IA",
      "Allocation de base et plan initial",
      "Historique limite a 3 analyses",
    ],
    cta: "Créer mon plan gratuit",
    highlighted: false,
    href: "/register",
    badge: "Aucune carte requise",
  },
  {
    name: "Pro",
    price: { monthly: 24.99, yearly: 219.99 },
    icon: Zap,
    audience: "Pour investir avec méthode et plus de contexte marché.",
    summary: "Le bon niveau si vous voulez un cadre, pas seulement une premiere opinion.",
    features: [
      "20 analyses IA par mois",
      "Signal marché détaillé",
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
    title: "Données de marché réelles",
    body: "Les prix et variations viennent de CoinGecko, avec Kraken quand disponible pour les snapshots portefeuille.",
    icon: Database,
  },
  {
    title: "Paiement et abonnement fiables",
    body: "Stripe gere le paiement, le checkout et l'espace de facturation. Les cartes ne transitent pas par l'application.",
    icon: Shield,
  },
  {
    title: "Compte sécurisé",
    body: "Authentification Supabase, routes protégées et données utilisateur séparées par compte.",
    icon: Lock,
  },
  {
    title: "Cadre clair",
    body: "Axiom ne promet pas de gains. Le produit structure une strategie, aide a lire le risque et montre ce qui manque quand une donnee n'est pas disponible.",
    icon: Cpu,
  },
] as const

const EXPECTATION_ITEMS = {
  does: [
    "structure une strategie personnalisee a partir du budget, du risque et de l'horizon",
    "explique les risques et les compromis avant l'execution",
    "utilise des donnees marche live et des snapshots reels pour le suivi",
    "aide a eviter les decisions impulsives et les changements de plan a chaud",
  ],
  doesNot: [
    "ne promet pas de gains ni de prediction magique",
    "ne pousse pas aux memecoins ni au trading agressif",
    "ne remplace pas un conseiller financier reglemente",
    "n'invente pas de donnees quand une source manque",
  ],
} as const

const TESTIMONIALS = [
  {
    quote: "J'avais 200€ et aucune idée de quoi faire. Je passais des heures sur des forums sans rien comprendre. Axiom m'a donné une allocation concrète en moins d'une minute, avec une explication que j'ai vraiment comprise.",
    author: "Léa, 26 ans",
    context: "Première fois avec les cryptos",
  },
  {
    quote: "Je voulais investir 5 000€ mais j'avais peur de tout mettre sur Bitcoin. Axiom m'a aidé à voir pourquoi une répartition sur 4 actifs avait plus de sens pour mon profil. C'est la première fois qu'une décision crypto me paraissait rationnelle.",
    author: "Thomas, 34 ans",
    context: "Investisseur prudent, horizon 3 ans",
  },
  {
    quote: "Ce que j'apprécie c'est l'honnêteté. Le produit me dit clairement ce que l'IA ne peut pas faire. Il ne promet pas que BTC va monter. Il m'aide juste à structurer un plan cohérent avec ce que j'ai réellement.",
    author: "Marc, 41 ans",
    context: "Ingénieur, suivi mensuel",
  },
  {
    quote: "J'avais déjà un portefeuille mais sans vraie logique derrière. Le dashboard m'a aidé à voir que mon exposition aux altcoins était trop élevée pour mon horizon. Un vrai recadrage.",
    author: "Sophie, 29 ans",
    context: "Deux ans d'expérience, rééquilibrage",
  },
] as const

const FAQ_ITEMS = [
  {
    question: "Qu'est-ce que je recois concretement apres 1 minute ?",
    answer:
      "Un profil investisseur clarifié, une allocation crypto, un score de risque lisible, des actions à faire maintenant et un dashboard qui suit le portefeuille réel.",
  },
  {
    question: "Est-ce que l'IA prédit le marché ?",
    answer:
      "Non. Axiom ne prédit pas le marché. Il structure une stratégie à partir de votre profil, de la volatilité, de la liquidité et du contexte marché disponible.",
  },
  {
    question: "Est-ce adapté aux débutants ?",
    answer:
      "Oui. Le questionnaire reste simple, le vocabulaire peut être guidé et le produit explique pourquoi une allocation est proposée.",
  },
  {
    question: "Comment eviter de confondre performance et nouveau capital ?",
    answer:
      "Le dashboard distingue le capital investi des snapshots portefeuille. Les nouveaux apports ne sont pas presentes comme des gains.",
  },
] as const

const LANDING_LIVE_MARKET_SYMBOLS = [
  "BTC",
  "ETH",
  "SOL",
  "XRP",
  "AVAX",
  "LINK",
  "DOGE",
  "RENDER",
  "TAO",
  "FET",
  "ONDO",
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

interface HomePageClientProps {
  marketSnapshot?: MarketSnapshot
}

export function HomePageClient({ marketSnapshot }: HomePageClientProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [analysesCount, setAnalysesCount] = useState<number | null>(null)

  useEffect(() => {
    fetch("/api/public/stats", { next: { revalidate: 60 } })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.analysesCount != null) setAnalysesCount(data.analysesCount)
      })
      .catch(() => {})
  }, [])
  const liveMarketRows = useMemo(
    () => LANDING_LIVE_MARKET_SYMBOLS
      .map((symbol) => marketSnapshot?.prices.find((coin) => coin.symbol === symbol) ?? null)
      .filter((coin): coin is NonNullable<typeof coin> => (
        coin !== null
        && Number.isFinite(coin.price)
        && coin.price > 0
        && Number.isFinite(coin.change24h)
      ))
      .slice(0, 8),
    [marketSnapshot]
  )
  const marketLead = liveMarketRows
  const topMover = liveMarketRows.length
    ? [...liveMarketRows].sort((left, right) => right.change24h - left.change24h)[0]
    : null
  const liveDataSummary = marketSnapshot?.global
    ? {
        cap: `$${(marketSnapshot.global.totalMarketCapUsd / 1e12).toFixed(2)}T`,
        dominance: `${marketSnapshot.global.btcDominance.toFixed(1)}%`,
      }
    : null
  const liveMarketPulse = marketSnapshot?.summary
    ? {
        tracked: marketSnapshot.summary.trackedAssets,
        positive: marketSnapshot.summary.positiveAssets,
        negative: marketSnapshot.summary.negativeAssets,
        fallback: marketSnapshot.summary.fallbackAssets,
      }
    : null
  const liveDataLabel = marketSnapshot?.fetchedAt
    ? new Date(marketSnapshot.fetchedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null

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
  const navSecondaryLabel = isAuthenticated ? "Nouvelle analyse" : "Créer mon plan gratuit"
  const heroPrimaryHref = isAuthenticated ? "/dashboard" : "/register"
  const heroPrimaryLabel = isAuthenticated ? "Ouvrir mon dashboard" : "Créer mon plan gratuit"
  const heroSecondaryHref = isAuthenticated ? "/advisor" : "#example"
  const heroSecondaryLabel = isAuthenticated ? "Nouvelle analyse" : "Voir un exemple d'analyse"
  const pricingHref = isAuthenticated ? "/pricing" : "/register"
  const bottomCtaHref = isAuthenticated ? "/dashboard" : "/register"
  const bottomCtaLabel = isAuthenticated ? "Ouvrir mon dashboard" : "Créer mon plan gratuit"

  return (
    <div className="min-h-screen overflow-hidden bg-background">
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-border/70 bg-background/88 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <AxiomLogo />
            <span className="hidden rounded-full border border-border bg-card px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground lg:inline-flex">
              Plan crypto guide
            </span>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="#product"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              Produit
            </Link>
            <Link
              href="#method"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              Methode
            </Link>
            <Link
              href="#pricing"
              className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            >
              Tarifs
            </Link>
            <Link
              href={navPrimaryHref}
              data-testid="home-nav-primary"
              className="rounded-full border border-transparent px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-border hover:bg-card hover:text-foreground"
            >
              {navPrimaryLabel}
            </Link>
            <Link
              href={navSecondaryHref}
              data-testid="home-nav-secondary"
              className="btn-primary min-h-0 rounded-full px-4 py-2 text-sm shadow-card-xs"
            >
              {navSecondaryLabel}
            </Link>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={navPrimaryHref}
              className="rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              {isAuthenticated ? "Dashboard" : "Login"}
            </Link>
            <Link
              href={navSecondaryHref}
              data-testid="home-mobile-primary"
              className="btn-primary min-h-0 rounded-full px-3.5 py-2 text-sm shadow-card-xs"
            >
              {isAuthenticated ? "Analyse" : "Tester"}
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-5 pb-20 pt-28 sm:px-6 sm:pb-24 sm:pt-32">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-5 inline-flex max-w-full items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-card-xs">
              <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse" />
              Strategie crypto personnalisee, donnees live et cadre de risque
            </div>

            <h1 className="text-balance text-4xl font-bold leading-[0.98] tracking-tighter text-foreground sm:text-5xl md:text-6xl xl:text-7xl">
              Dans 2 minutes, tu sais quoi acheter,
              <span className="block text-muted-foreground">combien investir, et pourquoi.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Axiom construit un plan crypto personnalise a partir de ton budget, ton niveau de risque
              et des donnees de marche live. Tu obtiens une repartition, un plan d&apos;entree, une lecture
              du risque et la prochaine action, sans jargon inutile.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href={heroPrimaryHref}
                data-testid="home-hero-primary"
                className="btn-primary w-full sm:w-auto"
              >
                {heroPrimaryLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href={heroSecondaryHref}
                data-testid="home-hero-secondary"
                className="btn-secondary w-full sm:w-auto"
              >
                {heroSecondaryLabel}
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HERO_METRICS.map((item) => (
                <MetricCard
                  key={item.label}
                  label={item.label}
                  value={<span className="text-base font-semibold tracking-normal">{item.value}</span>}
                  className="rounded-2xl p-4"
                  valueClassName="mt-2 text-base font-semibold tracking-normal"
                />
              ))}
              {analysesCount !== null && analysesCount > 0 && (
                <MetricCard
                  label="Analyses générées"
                  value={
                    <span className="text-base font-semibold tracking-normal tabular-nums">
                      {analysesCount.toLocaleString("fr-FR")}
                    </span>
                  }
                  className="rounded-2xl p-4"
                  valueClassName="mt-2 text-base font-semibold tracking-normal"
                />
              )}
            </div>

            <div className="mt-6">
              <TrustBar items={HERO_TRUST_ITEMS.map((item) => ({ ...item }))} />
            </div>

            <p className="mt-6 max-w-2xl text-xs leading-6 text-muted-foreground">
              Les cryptomonnaies comportent un risque de perte en capital. Axiom structure une strategie; il ne promet
              ni gain, ni prediction de marche.
            </p>

            {liveMarketRows.length > 0 && (
              <div className="mt-6 rounded-[28px] border border-border bg-card p-4 shadow-card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      Marche observe maintenant
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {liveDataSummary
                        ? `${liveDataSummary.cap} de capitalisation · BTC dominance ${liveDataSummary.dominance}`
                        : "Prix live avec fallback transparent si Kraken ne couvre pas un actif"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {topMover && (
                      <div className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-semibold text-emerald-700">
                        Top mover: {topMover.symbol} {topMover.change24h >= 0 ? "+" : ""}{topMover.change24h.toFixed(1)}%
                      </div>
                    )}
                    <div className="rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold text-muted-foreground">
                      Live market
                    </div>
                  </div>
                </div>
                {liveMarketPulse && (
                  <div className="mt-4 grid gap-2 sm:grid-cols-4">
                    {[
                      { label: "Actifs suivis", value: String(liveMarketPulse.tracked) },
                      { label: "Hausse 24h", value: String(liveMarketPulse.positive) },
                      { label: "Baisse 24h", value: String(liveMarketPulse.negative) },
                      { label: "Fallback", value: liveMarketPulse.fallback > 0 ? `${liveMarketPulse.fallback} actif(s)` : "Aucun" },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-border bg-secondary px-3 py-3">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {marketLead.map((coin) => (
                    <div key={coin.symbol} className="rounded-2xl border border-border bg-secondary p-4 transition-transform hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            {coin.symbol}
                          </p>
                          <p className="mt-1 text-base font-semibold text-foreground">
                            ${coin.price.toLocaleString("en-US", {
                              maximumFractionDigits: coin.price >= 1000 ? 0 : coin.price >= 1 ? 2 : 4,
                            })}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">{coin.name}</p>
                        </div>
                        <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          coin.change24h >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                        }`}>
                          {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold text-foreground">
                          Source : {coin.source === "Kraken" ? "Kraken" : coin.source === "fallback" ? "Fallback" : "CoinGecko"}
                        </span>
                        {(coin.categories ?? []).slice(0, 2).map((category) => (
                          <span
                            key={category}
                            className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1 text-[10px] text-muted-foreground"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Axiom lit les prix live, les variations 24 h et le contexte de marche avant de generer une allocation. Si Kraken ne couvre pas un actif, le fallback CoinGecko est visible.
                </p>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-x-10 inset-y-8 -z-10 rounded-[32px] bg-[radial-gradient(circle_at_top,rgba(182,147,87,0.12),transparent_62%)] blur-3xl" />
            <div className="surface-card overflow-hidden rounded-[34px] p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <AxiomLogo showBadge={false} />
                  <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Apercu produit
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                    Live
                  </span>
                  <span className="rounded-full border border-border bg-background px-2.5 py-1">
                    {liveDataLabel ? `Mis a jour ${liveDataLabel}` : "Mise a jour en cours"}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[0.92fr_1.08fr]">
                <div className="space-y-4">
                  <div className="surface-soft rounded-[28px] p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Advisor preview
                        </p>
                        <h2 className="mt-1 text-lg font-semibold text-foreground">Profil, risque, plan</h2>
                      </div>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        1 min
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {ADVISOR_PREVIEW_FIELDS.map((item) => {
                        const Icon = item.icon
                        return (
                          <div
                            key={item.label}
                            className="rounded-2xl border border-border bg-background px-3.5 py-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary">
                                <Icon className="h-4 w-4 text-foreground" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                                  {item.label}
                                </p>
                                <p className="mt-1 text-sm font-semibold leading-5 text-foreground">{item.value}</p>
                                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="surface-soft rounded-[28px] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Allocation preview
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">Repartition cible et logique d&apos;equilibre</p>
                      </div>
                      <span className="text-[11px] font-medium text-muted-foreground">Exposition coeur + satellites</span>
                    </div>

                    <div className="space-y-3">
                      {PRODUCT_ALLOCATION.map((item) => (
                        <div key={item.asset} className="rounded-2xl border border-border bg-background px-3.5 py-3">
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2.5">
                              <div className={`h-2 w-2 rounded-full ${item.tone}`} />
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-foreground">{item.asset}</p>
                                <p className="text-[11px] text-muted-foreground">{item.label}</p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold tabular-nums text-foreground">{item.pct}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                            <div className={`h-1.5 rounded-full ${item.tone}`} style={{ width: `${item.pct}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="surface-soft rounded-[28px] p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                          Dashboard preview
                        </p>
                        <p className="mt-1 text-lg font-semibold text-foreground">Historique reel</p>
                      </div>
                      <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Prix live
                      </span>
                    </div>

                    <div className="rounded-[24px] border border-border bg-background p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Valeur portefeuille
                          </p>
                          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">28 781 EUR</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">09 mai {"->"} aujourd&apos;hui</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-700">+4,10%</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">Tendance stable</p>
                        </div>
                      </div>

                      <div className="mt-4 overflow-hidden rounded-[22px] border border-border bg-[linear-gradient(180deg,#ffffff_0%,#fbfbf8_100%)] px-3 py-3">
                        <div className="mb-3 grid grid-cols-4 gap-2 text-[10px] text-muted-foreground">
                          <span>Prix live</span>
                          <span>Historique reel</span>
                          <span>Dernier snapshot</span>
                          <span className="text-right">Kraken / CoinGecko</span>
                        </div>
                        <div className="relative h-28">
                          <div className="absolute inset-0 grid grid-rows-4">
                            {[0, 1, 2, 3].map((row) => (
                              <div key={row} className="border-t border-border/70" />
                            ))}
                          </div>
                          <div className="absolute inset-x-0 bottom-4 top-4">
                            <div className="absolute inset-0">
                              <svg viewBox="0 0 320 120" className="h-full w-full" preserveAspectRatio="none">
                                <defs>
                                  <linearGradient id="axiom-preview-fill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#b69357" stopOpacity="0.16" />
                                    <stop offset="100%" stopColor="#b69357" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <path
                                  d="M 0 90 C 20 78, 30 72, 40 74 C 55 76, 65 86, 80 82 C 95 78, 110 60, 125 54 C 142 47, 160 44, 175 48 C 192 52, 205 67, 220 60 C 238 51, 252 24, 270 18 C 288 12, 304 16, 320 10 L 320 120 L 0 120 Z"
                                  fill="url(#axiom-preview-fill)"
                                />
                                <path
                                  d="M 0 90 C 20 78, 30 72, 40 74 C 55 76, 65 86, 80 82 C 95 78, 110 60, 125 54 C 142 47, 160 44, 175 48 C 192 52, 205 67, 220 60 C 238 51, 252 24, 270 18 C 288 12, 304 16, 320 10"
                                  fill="none"
                                  stroke="#3f5f93"
                                  strokeWidth="2.25"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                          {DASHBOARD_PREVIEW_AXIS.map((label) => (
                            <span key={label}>{label}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {PRODUCT_TIMELINE.map((item, index) => (
                      <div
                        key={item}
                        className="relative rounded-[24px] border border-border bg-card px-4 py-4 shadow-card-xs transition-transform duration-150 hover:-translate-y-0.5"
                      >
                        {index < PRODUCT_TIMELINE.length - 1 ? (
                          <span className="absolute right-[-12px] top-1/2 hidden h-px w-6 -translate-y-1/2 bg-border md:block" />
                        ) : null}
                        <div className="mb-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-border bg-secondary px-2 text-[10px] font-semibold text-muted-foreground">
                          0{index + 1}
                        </div>
                        <p className="text-sm leading-6 text-foreground">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SocialProofStrip
        btcPrice={marketSnapshot?.prices.find((p) => p.symbol === "BTC")?.price}
        btcChange24h={marketSnapshot?.prices.find((p) => p.symbol === "BTC")?.change24h}
        marketCapT={marketSnapshot?.global ? marketSnapshot.global.totalMarketCapUsd / 1e12 : undefined}
        btcDominance={marketSnapshot?.global?.btcDominance}
      />

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
              Axiom ne prédit pas le marché. Il structure une stratégie.
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
            <div className="surface-card p-6">
              <PremiumBadge tone="success" size="sm">Axiom fait</PremiumBadge>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Une logique d&apos;investissement, pas un casino crypto.</h3>
              <ul className="mt-5 space-y-3">
                {EXPECTATION_ITEMS.does.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                    <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-6">
              <PremiumBadge tone="warning" size="sm">Axiom ne fait pas</PremiumBadge>
              <h3 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Une promesse forte, mais des limites claires.</h3>
              <ul className="mt-5 space-y-3">
                {EXPECTATION_ITEMS.doesNot.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <span className="text-sm leading-6 text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="surface-card p-6 sm:col-span-2">
              <SectionHeader
                eyebrow="Confiance"
                title="Pourquoi le produit parait plus serieux que la moyenne"
                description="On prefere montrer les sources, les limites et les vraies donnees plutot que surjouer des promesses."
              />
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {TRUST_ITEMS.map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="surface-soft p-5">
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
          <SectionHeader
            eyebrow="Exemple d'analyse"
            title="Voila ce que tu obtiens en 90 secondes"
            description="Exemple d'analyse fictif, non personnalise. Il montre la structure reelle du resultat: une repartition, un niveau de risque, une action recommandee et les donnees marche utilisees."
            align="center"
            className="mb-10"
          />

          <div className="overflow-hidden rounded-[32px] border border-border bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border bg-background px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <AxiomLogo />
                <span className="text-sm font-medium text-muted-foreground">Exemple d&apos;analyse</span>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                <PremiumBadge>Profil modere</PremiumBadge>
                <PremiumBadge>Capital 5 000 EUR</PremiumBadge>
                <PremiumBadge>Horizon 3-5 ans</PremiumBadge>
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
                        Diversification lisible, risque modere et plan d&apos;entree progressif compatible avec un investisseur patient.
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
                <div className="mt-4 rounded-3xl border border-border bg-background p-4">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    <Database className="h-3.5 w-3.5" />
                    Donnees marche utilisees
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">
                    Prix live, variation 24 h, contexte de volatilite, liquidite disponible et regime BTC/ETH vs altcoins.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Tarifs"
            title="Comparez les offres avant de vous engager"
            description="Free sert a tester la methode. Pro sert a investir avec une vraie discipline. Premium sert a suivre, comparer des scenarios et garder plus de contexte dans le temps."
            align="center"
            className="mb-12"
          />

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
                    className={plan.highlighted ? "btn-primary block text-center" : "btn-secondary block text-center"}
                  >
                    {isAuthenticated ? "Comparer les offres" : plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-background px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="Retours utilisateurs"
            title="Ce que ça change concrètement"
            description="Pas de gains promis, pas de traders fictifs. Des situations réelles dans lesquelles le produit a aidé à structurer une décision."
            align="center"
            className="mb-10"
          />
          <div className="grid gap-4 md:grid-cols-2">
            {TESTIMONIALS.map((item) => (
              <div key={item.author} className="surface-card flex flex-col gap-4 p-6">
                <p className="text-sm leading-7 text-muted-foreground">
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div className="mt-auto pt-3 border-t border-border">
                  <p className="text-sm font-semibold text-foreground">{item.author}</p>
                  <p className="text-[11px] text-muted-foreground">{item.context}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Les témoignages sont représentatifs des cas d&apos;usage observés. Aucun résultat financier n&apos;est garanti.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-secondary px-5 py-18 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <SectionHeader
            eyebrow="Questions frequentes"
            title="Ce que les utilisateurs veulent comprendre avant de commencer"
            align="center"
            className="mb-10"
          />

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
              className="btn-primary"
            >
              {bottomCtaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={pricingHref}
              className="btn-secondary"
            >
              Comparer les offres
            </Link>
          </div>
        </div>
      </section>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background px-4 py-3 shadow-[0_-10px_30px_rgba(17,24,39,0.08)] md:hidden">
        <Link
          href={bottomCtaHref}
          className="btn-primary flex w-full"
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
          <div className="flex flex-wrap items-center justify-center gap-5">
            <Link href="/how-it-works" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Comment ça marche
            </Link>
            <Link href="/transparency" className="text-xs text-muted-foreground transition-colors hover:text-foreground">
              Transparence
            </Link>
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

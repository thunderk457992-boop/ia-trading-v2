import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Database,
  FileText,
  RefreshCw,
  Shield,
  Sliders,
  TrendingUp,
  User,
} from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Comment ça marche — Axiom AI",
  description:
    "Découvrez comment Axiom AI construit une allocation crypto : données utilisées, logique de l'IA, ce qu'elle fait et ce qu'elle ne fait pas. Sans jargon.",
  path: "/how-it-works",
  keywords: [
    "comment fonctionne axiom",
    "ia allocation crypto",
    "construction portefeuille crypto ia",
    "données coingecko kraken",
    "transparent ai crypto",
  ],
})

const steps = [
  {
    icon: User,
    step: "01",
    title: "Vous décrivez votre profil",
    body: "Capital initial, apports mensuels, horizon d'investissement, tolérance à la perte, objectif prioritaire. Ces données ne sont pas des paramètres techniques — elles définissent ce que le portefeuille doit supporter en pratique.",
    details: [
      "Risque réel que vous pouvez absorber psychologiquement",
      "Horizon de blocage effectif des fonds",
      "Apports futurs comme décisions séparées",
      "Niveau de complexité souhaité",
    ],
  },
  {
    icon: Database,
    step: "02",
    title: "Axiom collecte les données marché en temps réel",
    body: "Avant de produire une analyse, Axiom interroge CoinGecko pour les prix, capitalisations et variations, puis Kraken pour les prix spot live et les volumes d'échange. Ces données contextualisent l'allocation au moment précis où vous analysez.",
    details: [
      "Prix et capitalisation des top 50 actifs (CoinGecko)",
      "Prix spot, bid/ask, spread et volume 24h (Kraken)",
      "Dominance BTC et capitalisation totale du marché",
      "Sentiment global basé sur les variations 24h",
    ],
  },
  {
    icon: Brain,
    step: "03",
    title: "Le modèle IA construit l'allocation",
    body: "Un modèle Claude (Anthropic) reçoit votre profil et le contexte marché. Il produit une allocation pondérée, un plan d'entrée, une lecture de risque et des recommandations concrètes. La qualité du modèle dépend de votre plan.",
    details: [
      "Plan Gratuit — Claude Haiku 4.5 (analyse de base)",
      "Plan Pro — Claude Sonnet 4.6 (signal marché, plan dans le temps)",
      "Plan Premium — Claude Opus 4.7 avec raisonnement adaptatif",
      "Aucune hallucination de prix : seules les données live sont utilisées",
    ],
  },
  {
    icon: FileText,
    step: "04",
    title: "Vous recevez un plan structuré",
    body: "L'analyse n'est pas une liste de signaux. C'est une note d'investissement : allocation pondérée par actif, justification par rapport au contexte marché, risques explicites, actions concrètes à court terme et cadre de suivi.",
    details: [
      "Allocation recommandée avec pourcentages par actif",
      "Justification liée au contexte marché actuel",
      "Risques principaux identifiés pour ce profil",
      "Plan d'entrée progressif ou lump-sum selon la stratégie",
    ],
  },
  {
    icon: BarChart3,
    step: "05",
    title: "Le dashboard suit votre portefeuille réel",
    body: "Après chaque analyse, un snapshot est créé dans votre dashboard. Ces snapshots sont basés sur les montants réellement investis, pas sur une simulation. La courbe reflète votre capital et vos contributions, pas une performance fictive.",
    details: [
      "Snapshots basés sur capital déclaré + apports",
      "Courbe réelle (pas une simulation market)",
      "Comparaison entre capital investi et valeur estimée",
      "Historique limité selon le plan (3 / 10 / 20 analyses)",
    ],
  },
] as const

const notDoneItems = [
  "Prédire les cours futurs du marché",
  "Garantir des rendements ou une performance minimale",
  "Émettre des conseils financiers agréés au sens légal",
  "Gérer ou déplacer vos actifs à votre place",
  "Vous donner des signaux \"achetez maintenant\" avec certitude",
  "Remplacer un conseiller en gestion de patrimoine certifié",
]

const doneItems = [
  "Structurer une allocation rationnelle selon votre profil réel",
  "Contextualiser cette allocation au marché du moment",
  "Identifier les risques principaux pour ce profil",
  "Proposer un plan d'entrée concret et un rythme de suivi",
  "Rendre visible l'évolution de votre capital investi",
]

const dataPoints = [
  { source: "CoinGecko", usage: "Prix, capitalisation, variation 24h/7j des top 50 actifs", frequency: "Toutes les ~5 min" },
  { source: "Kraken", usage: "Prix spot live, volumes, bid/ask, spread en temps réel", frequency: "Live via API" },
  { source: "Supabase", usage: "Authentification, analyses sauvegardées, snapshots portefeuille", frequency: "Temps réel" },
  { source: "Stripe", usage: "Gestion des abonnements et paiements sécurisés", frequency: "Par événement" },
  { source: "Anthropic (Claude)", usage: "Génération de l'analyse IA, allocation, plan et lecture de marché", frequency: "À la demande" },
]

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-6xl animate-slide-up">

      {/* Hero */}
      <section className="rounded-[32px] border border-border bg-card px-6 py-8 shadow-card sm:px-8 sm:py-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse-dot" />
          Comment ça marche
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <AxiomLogo showBadge={false} nameClassName="text-base font-bold text-foreground" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Une logique claire,
              <span className="block text-muted-foreground">pas une boîte noire.</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Axiom AI prend votre profil et le contexte marché en entrée, produit une allocation structurée en sortie.
              Ce document explique exactement ce qui se passe entre les deux.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Données d'entrée", value: "Profil + marché live" },
              { label: "Moteur IA", value: "Claude (Anthropic)" },
              { label: "Sortie", value: "Allocation + plan" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="mt-6 space-y-4">
        {steps.map((step) => {
          const Icon = step.icon
          return (
            <article key={step.step} className="rounded-[28px] border border-border bg-card p-6 shadow-card sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    Étape {step.step}
                  </p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-foreground">{step.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">{step.body}</p>
                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {step.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <span className="text-sm leading-6 text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {/* Ce que l'IA fait / ne fait pas */}
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[28px] border border-border bg-card p-6 shadow-card sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp className="h-4 w-4 text-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ce qu&apos;Axiom fait</p>
          </div>
          <ul className="space-y-3">
            {doneItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                <span className="text-sm leading-6 text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[28px] border border-border bg-card p-6 shadow-card sm:p-7">
          <div className="flex items-center gap-2 mb-5">
            <Shield className="h-4 w-4 text-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ce qu&apos;Axiom ne fait pas</p>
          </div>
          <ul className="space-y-3">
            {notDoneItems.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <div className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
                <span className="text-sm leading-6 text-muted-foreground">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Sources de données */}
      <section className="mt-6 rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sources de données</p>
          </div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Ce qu&apos;Axiom utilise, et d&apos;où ça vient.</h2>
        </div>

        <div className="divide-y divide-border rounded-2xl border border-border overflow-hidden">
          {dataPoints.map((dp) => (
            <div key={dp.source} className="flex flex-col gap-1 px-4 py-3.5 bg-card sm:flex-row sm:items-center sm:gap-4">
              <div className="w-32 shrink-0">
                <span className="text-sm font-semibold text-foreground">{dp.source}</span>
              </div>
              <div className="flex-1 text-sm text-muted-foreground">{dp.usage}</div>
              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                  {dp.frequency}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Logique de pondération */}
      <section className="mt-6 rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <Sliders className="h-4 w-4 text-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Logique de pondération</p>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Comment l&apos;IA pondère les actifs.</h2>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Dominance BTC", body: "Si la dominance BTC dépasse 55%, les capitaux restent concentrés sur BTC/ETH. L'exposition altcoins est réduite mécaniquement." },
            { label: "Capitalisation", body: "Les grandes caps (BTC, ETH) forment le socle. Les mid et small caps sont des satellites, jamais le cœur du portefeuille." },
            { label: "Volatilité 24h", body: "Un actif très volatile reçoit une position plus petite si le profil est prudent. La taille est ajustée au risque, pas au potentiel." },
            { label: "Liquidité", body: "L'allocation reste sur des actifs qu'on peut acheter, vendre et rééquilibrer sans friction excessive sur les exchanges majeurs." },
            { label: "Corrélation", body: "En correction violente, les actifs crypto convergent. La diversification aide mais ne protège pas d'un choc systémique brutal." },
            { label: "Profil investisseur", body: "Horizon court = moins de volatilité acceptable. Tolérance à la perte déclarée = plafond de risque pour les satellites." },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-border bg-secondary px-4 py-4">
              <h3 className="text-sm font-semibold text-foreground">{item.label}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Disclaimer */}
      <section className="mt-6 rounded-[32px] border border-amber-200 bg-amber-50 px-6 py-7 sm:px-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Limite claire du produit</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Axiom AI est un outil d&apos;aide à la décision pédagogique. Il ne constitue pas un service de conseil en investissement
              financier agréé. Aucune allocation produite par Axiom ne garantit de performance future. Les marchés crypto
              peuvent subir des baisses sévères et imprévisibles. Vous restez responsable de vos décisions d&apos;investissement.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Pour en savoir plus sur notre approche de la transparence, consultez{" "}
              <Link href="/transparency" className="font-semibold underline underline-offset-2">
                la page Transparence
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-6 rounded-[32px] border border-foreground bg-foreground px-6 py-7 text-background shadow-card sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/70">
              Prochaine étape
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Tester la méthode en pratique</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-background/72">
              Décrivez votre profil, obtenez une allocation structurée et un plan d&apos;entrée en moins d&apos;une minute. Gratuit, sans carte bancaire.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/92"
            >
              Créer mon plan gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/transparency"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Page transparence
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

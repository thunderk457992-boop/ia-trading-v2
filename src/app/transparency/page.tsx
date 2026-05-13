import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  CreditCard,
  Database,
  Lock,
  RefreshCw,
  Server,
  Shield,
  ShieldOff,
  Zap,
} from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Transparence — Axiom AI",
  description:
    "Sources de données, fréquence de mise à jour, limites du modèle IA et statut légal d'Axiom AI. Nous expliquons ce que nous faisons, et ce que nous ne faisons pas.",
  path: "/transparency",
  keywords: [
    "axiom transparence",
    "données coingecko crypto",
    "kraken api trading",
    "limites ia crypto",
    "conseiller financier agrée crypto",
  ],
})

const dataSources = [
  {
    icon: Database,
    name: "CoinGecko",
    role: "Prix et données de marché",
    details: [
      "Prix actuel (USD) de plus de 50 actifs crypto",
      "Capitalisation boursière en temps réel",
      "Variation 24h et 7 jours",
      "Volume d'échange quotidien",
      "Dominance BTC et capitalisation totale du marché",
    ],
    frequency: "Rafraîchissement toutes les ~5 minutes",
    limitation: "CoinGecko peut être momentanément indisponible. Dans ce cas, Axiom l'indique clairement et aucun prix n'est inventé.",
    color: "border-emerald-200 bg-emerald-50",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    icon: Zap,
    name: "Kraken",
    role: "Prix spot live et liquidité",
    details: [
      "Prix spot en temps réel via l'API Kraken",
      "Bid/ask et spread de marché",
      "Volume 24h par paire",
      "Données utilisées pour affiner le contexte d'entrée",
    ],
    frequency: "Données live interrogées à chaque analyse",
    limitation: "La disponibilité dépend des API Kraken. En cas d'indisponibilité, le fallback CoinGecko est utilisé.",
    color: "border-blue-200 bg-blue-50",
    badge: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    icon: Brain,
    name: "Anthropic (Claude)",
    role: "Moteur IA d'analyse",
    details: [
      "Claude Haiku 4.5 (plan Gratuit) — analyse de base",
      "Claude Sonnet 4.6 (plan Pro) — signal marché + plan dans le temps",
      "Claude Opus 4.7 avec raisonnement étendu (plan Premium)",
      "Chaque requête reçoit les données de marché live en contexte",
      "Aucun résultat mis en cache — chaque analyse est fraîche",
    ],
    frequency: "Appelé à la demande, lors de chaque analyse",
    limitation: "Le modèle peut commettre des erreurs d'interprétation. Il ne prédit pas les prix futurs et ne garantit aucun rendement.",
    color: "border-violet-200 bg-violet-50",
    badge: "border-violet-200 bg-violet-50 text-violet-700",
  },
  {
    icon: Server,
    name: "Supabase",
    role: "Base de données et authentification",
    details: [
      "Authentification sécurisée (email + mot de passe)",
      "Stockage de vos analyses et allocations",
      "Snapshots de portefeuille (capital, performance)",
      "Données chiffrées et hébergées en Europe (Frankfurt)",
    ],
    frequency: "Persistance en temps réel",
    limitation: "Aucune donnée n'est partagée ou revendue à des tiers. Vous pouvez demander la suppression de votre compte à tout moment.",
    color: "border-slate-200 bg-slate-50",
    badge: "border-slate-200 bg-slate-50 text-slate-600",
  },
  {
    icon: CreditCard,
    name: "Stripe",
    role: "Paiements sécurisés",
    details: [
      "Gestion des abonnements Pro et Premium",
      "Aucune donnée bancaire stockée chez Axiom",
      "Facturation certifiée PCI-DSS par Stripe",
      "Portail client pour modifier ou annuler à tout moment",
    ],
    frequency: "Par événement (abonnement, renouvellement, annulation)",
    limitation: "Axiom n'accède jamais à vos coordonnées bancaires. Stripe gère l'intégralité du traitement des paiements.",
    color: "border-indigo-200 bg-indigo-50",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
  },
]

const aiLimits = [
  "Le modèle ne connaît pas les événements survenus après sa date de coupure — il ne prédit pas l'avenir",
  "Les allocations sont des suggestions basées sur les données disponibles, pas des certitudes",
  "En phase de correction brutale, même une allocation bien construite peut subir des pertes significatives",
  "La dominance BTC et les indicateurs de sentiment sont des signaux contextuels, pas des prédictions",
  "Le modèle peut se tromper sur des micro-caps peu représentées dans les données de marché",
  "Les projections de scénarios (plan Premium) sont illustratives, pas des prévisions chiffrées fiables",
]

const privacyPoints = [
  "Aucune donnée vendue à des tiers à des fins marketing",
  "Aucun tracking publicitaire (pas de pixel Meta, Google Ads, etc.)",
  "Analyse d'usage via PostHog (auto-hébergeable) pour améliorer le produit",
  "Données de compte supprimables à tout moment via Paramètres → Sécurité",
  "Mots de passe jamais stockés en clair — gestion par Supabase Auth",
]

export default function TransparencyPage() {
  return (
    <div className="mx-auto max-w-6xl animate-slide-up">

      {/* Hero */}
      <section className="rounded-[32px] border border-border bg-card px-6 py-8 shadow-card sm:px-8 sm:py-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse-dot" />
          Transparence totale
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <AxiomLogo showBadge={false} nameClassName="text-base font-bold text-foreground" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Ce qu&apos;on utilise.
              <span className="block text-muted-foreground">Ce qu&apos;on ne fait pas.</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              Axiom AI est bâti sur des données réelles et des partenaires audités. Cette page documente chaque source,
              sa fréquence de mise à jour, et ses limites honnêtes.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Données vendues", value: "Aucune" },
              { label: "Prix inventés", value: "Jamais" },
              { label: "Statut légal", value: "Pas CGP agréé" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data sources */}
      <section className="mt-6 space-y-4">
        <div className="px-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sources de données</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Chaque source documentée.</h2>
        </div>

        {dataSources.map((source) => {
          const Icon = source.icon
          return (
            <article key={source.name} className="rounded-[28px] border border-border bg-card p-6 shadow-card sm:p-7">
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${source.color}`}>
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-foreground">{source.name}</h3>
                    <span className="text-sm text-muted-foreground">{source.role}</span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${source.badge}`}>
                      <RefreshCw className="h-3 w-3" />
                      {source.frequency}
                    </span>
                  </div>

                  <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                    {source.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2.5">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <span className="text-sm leading-6 text-muted-foreground">{detail}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                    <p className="text-[12px] leading-5 text-amber-900">{source.limitation}</p>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </section>

      {/* Limites IA */}
      <section className="mt-6 rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <ShieldOff className="h-4 w-4 text-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Limites du modèle IA</p>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-2">Ce que l&apos;IA ne peut pas faire.</h2>
        <p className="text-sm leading-6 text-muted-foreground mb-5">
          Ces limites sont structurelles. Elles ne seront pas résolues avec un meilleur modèle.
          Elles font partie de la réalité de tout outil IA appliqué aux marchés financiers.
        </p>

        <ul className="space-y-3">
          {aiLimits.map((limit) => (
            <li key={limit} className="flex items-start gap-3 rounded-xl border border-border bg-secondary px-4 py-3">
              <div className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-muted-foreground/30" />
              <span className="text-sm leading-6 text-muted-foreground">{limit}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Vie privée */}
      <section className="mt-6 rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="flex items-center gap-2 mb-5">
          <Lock className="h-4 w-4 text-foreground" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Vie privée et données personnelles</p>
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-4">Vos données restent les vôtres.</h2>

        <ul className="space-y-3">
          {privacyPoints.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              <span className="text-sm leading-6 text-muted-foreground">{point}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/legal/privacy" className="text-sm font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity">
            Politique de confidentialité
          </Link>
          <Link href="/legal/cgu" className="text-sm font-medium text-foreground underline underline-offset-2 hover:opacity-70 transition-opacity">
            Conditions générales d&apos;utilisation
          </Link>
        </div>
      </section>

      {/* Statut légal */}
      <section className="mt-6 rounded-[32px] border border-amber-200 bg-amber-50 px-6 py-7 sm:px-8">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Statut légal — Important</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              <strong>Axiom AI n&apos;est pas un conseiller en investissements financiers agréé (CIF).</strong> Les analyses
              produites sont des outils pédagogiques d&apos;aide à la décision. Elles ne constituent pas des recommandations
              financières au sens réglementaire du terme (AMF, ESMA).
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Les marchés crypto peuvent subir des baisses sévères et imprévisibles. Investir comporte un risque de perte
              en capital, potentiellement total. Axiom ne gère pas vos actifs et ne peut pas être tenu responsable des
              décisions prises à partir de ses analyses.
            </p>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Si vous gérez des sommes significatives, nous recommandons de consulter un professionnel réglementé.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mt-6 rounded-[32px] border border-foreground bg-foreground px-6 py-7 text-background shadow-card sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/70">
              Comprendre le produit
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Voir comment ça marche en pratique</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-background/72">
              La page &ldquo;Comment ça marche&rdquo; détaille chaque étape, de votre profil à l&apos;allocation finale.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/92"
            >
              Comment ça marche
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Créer mon plan gratuit
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

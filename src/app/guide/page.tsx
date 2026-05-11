import type { Metadata } from "next"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Layers3,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Guide — Méthodologie Axiom AI",
  description:
    "Découvrez comment Axiom AI structure une stratégie crypto : diversification, gestion du risque, DCA, dominance BTC et lecture de marché. Sans jargon.",
  path: "/guide",
  keywords: [
    "crypto methodology",
    "crypto risk management",
    "bitcoin dominance portfolio",
    "crypto dca strategy",
    "ai crypto allocation method",
  ],
})

const methodologyPillars = [
  {
    icon: Shield,
    eyebrow: "Risque",
    title: "Le risque passe avant l'allocation",
    body:
      "Axiom commence par votre tolerance a la perte, votre horizon et votre rythme d'investissement. Le portefeuille doit etre supportable avant de chercher le meilleur rendement theorique.",
  },
  {
    icon: Layers3,
    eyebrow: "Diversification",
    title: "Le coeur du portefeuille reste liquide",
    body:
      "Les actifs coeur servent d'ancrage. Les satellites servent a diversifier ou chercher plus de potentiel, sans faire basculer l'ensemble dans une logique de pari.",
  },
  {
    icon: TrendingUp,
    eyebrow: "Marche",
    title: "Le contexte marche change la lecture",
    body:
      "Dominance BTC, volatilite, momentum et liquidite servent a ajuster l'exposition. Axiom ne lit pas le marche comme une prediction, mais comme un regime de risque.",
  },
] as const

const methodologySections = [
  {
    title: "1. Profil utilisateur",
    points: [
      "budget initial et apports futurs",
      "tolerance au risque et a la perte",
      "horizon d'investissement",
      "niveau d'experience et besoin de pedagogie",
      "objectif prioritaire: croissance, diversification, preservation, discipline",
    ],
  },
  {
    title: "2. Conditions de marche",
    points: [
      "market cap et liquidite des actifs",
      "dominance BTC et lecture risk-on / risk-off",
      "volatilite 24h et structure du momentum",
      "dispersion entre BTC, ETH et altcoins",
      "qualite du marche disponible via CoinGecko et Kraken",
    ],
  },
  {
    title: "3. Construction de l'allocation",
    points: [
      "pondere un coeur de portefeuille liquide",
      "limite les satellites en fonction du profil",
      "evite de faire passer un nouveau capital pour une performance",
      "transforme l'allocation en plan d'entree concret",
      "prepare le suivi avec des snapshots reels dans le dashboard",
    ],
  },
] as const

const rationaleGrid = [
  {
    title: "Market cap",
    body: "Les grandes capitalisations apportent plus de liquidite et en general moins de violence qu'un panier de micro-caps.",
  },
  {
    title: "Dominance BTC",
    body: "Une dominance BTC elevee signale souvent un marche plus defensif. Une dominance plus basse peut ouvrir plus de place aux altcoins, avec plus de risque.",
  },
  {
    title: "Volatilite",
    body: "Un actif tres volatil ne peut pas porter la meme taille de position qu'un actif plus stable si le profil est prudent.",
  },
  {
    title: "Liquidite",
    body: "Une bonne allocation ne doit pas etre prisonniere d'actifs trop difficiles a acheter, vendre ou reequilibrer.",
  },
  {
    title: "Correlation",
    body: "En correction violente, beaucoup d'actifs crypto convergent. La diversification aide, mais ne transforme pas le marche en zone sans risque.",
  },
  {
    title: "DCA",
    body: "Le DCA sert a lisser l'entree quand la visibilite est faible ou que le profil ne veut pas tout deployer d'un coup.",
  },
] as const

const assetSelectionNotes = [
  {
    title: "BTC",
    body: "souvent retenu pour sa liquidite, sa dominance marche et son role de socle plus resilient",
  },
  {
    title: "ETH",
    body: "retenu pour son role d'infrastructure, sa profondeur de marche et son poids dans l'ecosysteme",
  },
  {
    title: "Layer 1 / DeFi / AI",
    body: "ajoutes seulement si le profil accepte plus de volatilite et si le contexte marche le justifie",
  },
  {
    title: "Memecoins",
    body: "jamais au coeur du portefeuille; seulement en satellite mineur si le profil est offensif et que le risque est explicite",
  },
] as const

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-6xl animate-slide-up">
      <section className="rounded-[32px] border border-border bg-card px-6 py-8 shadow-card sm:px-8 sm:py-10">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse-dot" />
          Methodologie Axiom AI
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div>
            <AxiomLogo showBadge={false} nameClassName="text-base font-bold text-foreground" />
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Axiom ne predit pas le marche.
              <span className="block text-muted-foreground">Axiom structure une strategie rationnelle basee sur des donnees reelles.</span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
              L&apos;objectif n&apos;est pas de vous promettre un gain. L&apos;objectif est de transformer un profil investisseur,
              un budget et un contexte marche en allocation, plan d&apos;entree, suivi et cadre de risque coherents.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            {[
              { label: "Donnees", value: "CoinGecko + Kraken" },
              { label: "Historique", value: "Snapshots reels" },
              { label: "Sortie", value: "Allocation + actions" },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {methodologyPillars.map((pillar) => {
          const Icon = pillar.icon
          return (
            <article key={pillar.title} className="rounded-[28px] border border-border bg-card p-6 shadow-card">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {pillar.eyebrow}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{pillar.body}</p>
            </article>
          )
        })}
      </section>

      <section className="mt-6 rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
        <div className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Comment l&apos;IA construit une allocation</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Une logique d&apos;investissement, pas un tirage au sort.</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {methodologySections.map((section) => (
            <div key={section.title} className="rounded-3xl border border-border bg-secondary p-5">
              <h3 className="text-lg font-semibold text-foreground">{section.title}</h3>
              <ul className="mt-4 space-y-2.5">
                {section.points.map((point) => (
                  <li key={point} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                    <span className="text-sm leading-6 text-muted-foreground">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Ce que l&apos;IA regarde vraiment</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {rationaleGrid.map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-secondary px-4 py-4">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-border bg-card p-6 shadow-card sm:p-8">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-foreground" />
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Pourquoi certains actifs sont retenus</p>
          </div>
          <div className="mt-5 space-y-3">
            {assetSelectionNotes.map((item) => (
              <div key={item.title} className="rounded-3xl border border-border bg-secondary px-4 py-4">
                <h3 className="text-base font-semibold text-foreground">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-amber-200 bg-amber-50 px-6 py-7 shadow-card sm:px-8">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Limite claire du produit</h2>
            <p className="mt-3 text-sm leading-7 text-slate-700">
              Axiom ne promet pas de gains, ne cache pas le risque et ne fait pas semblant de savoir ou ira le marche.
              Le produit sert a structurer une strategie, a expliciter le risque et a transformer des donnees marche
              en decisions plus rationnelles.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-foreground bg-foreground px-6 py-7 text-background shadow-card sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/70">
              Prochaine etape
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Voir la methode dans un vrai plan portefeuille</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-background/72">
              Lancez une analyse, comparez l&apos;allocation, puis revenez sur le dashboard pour suivre le capital investi,
              les snapshots reels et les explications de risque.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/92"
            >
              Creer mon plan gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-transparent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Comparer les offres
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

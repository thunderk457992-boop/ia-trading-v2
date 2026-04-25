import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Rocket,
  Target,
} from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"

type GuideSection =
  | {
      icon: typeof Target
      title: string
      eyebrow: string
      content: string[]
      steps?: never
      items?: never
    }
  | {
      icon: typeof Target
      title: string
      eyebrow: string
      content?: never
      steps: string[]
      items?: never
    }
  | {
      icon: typeof Target
      title: string
      eyebrow: string
      content?: never
      steps?: never
      items: string[]
    }

const sections: GuideSection[] = [
  {
    icon: Target,
    eyebrow: "Utilité",
    title: "À quoi sert Axiom",
    content: [
      "Axiom vous aide à structurer vos décisions crypto avec plus de méthode et moins d'improvisation.",
      "Vous décrivez votre profil, vos objectifs et votre niveau de risque. Le produit transforme ensuite ces éléments en allocation, en plan d'action et en lecture de marché.",
      "Le service reste utilisable même si vous n'êtes pas expert. Les explications sont faites pour rester claires et directement exploitables.",
    ],
  },
  {
    icon: Cpu,
    eyebrow: "Méthode",
    title: "Comment ça marche",
    steps: [
      "Vous répondez à quelques questions simples sur votre budget, votre objectif, votre horizon et votre tolérance au risque.",
      "Le moteur IA croise votre profil avec les données de marché disponibles et les limites de votre plan.",
      "Vous recevez une analyse exploitable, puis vous pouvez continuer avec le chat IA pour demander des clarifications ou la prochaine action logique.",
    ],
  },
  {
    icon: BarChart3,
    eyebrow: "Résultat",
    title: "Ce que vous recevez",
    items: [
      "Une allocation lisible entre les actifs principaux du portefeuille.",
      "Une synthèse claire sur le niveau de risque et la logique retenue.",
      "Des actions concrètes : entrer maintenant, avancer par paliers, attendre ou rééquilibrer.",
      "Un dashboard cohérent entre capital, performance, périodes réelles et graphique portefeuille.",
    ],
  },
  {
    icon: AlertTriangle,
    eyebrow: "Prudence",
    title: "Ce qu'il faut garder en tête",
    items: [
      "Le produit aide à décider, mais ne remplace pas votre responsabilité d'investisseur.",
      "Les marchés crypto restent volatils, même quand le plan paraît solide.",
      "Il vaut mieux respecter une taille de position supportable que chercher un timing parfait.",
      "Si une donnée manque ou n'est pas disponible, l'application doit le dire clairement au lieu d'inventer.",
    ],
  },
  {
    icon: Rocket,
    eyebrow: "Bénéfice",
    title: "Ce que vous allez gagner",
    items: [
      "Moins d'erreurs impulsives et plus de régularité dans vos décisions.",
      "Une meilleure compréhension du pourquoi derrière chaque allocation.",
      "Un usage plus simple du DCA, du risque et des périodes d'analyse.",
      "Un produit qui vous accompagne de la première analyse jusqu'au suivi du portefeuille.",
    ],
  },
]

export default function GuidePage() {
  return (
    <div className="mx-auto max-w-4xl animate-slide-up">
      <section className="rounded-[32px] border border-border bg-card px-6 py-7 shadow-card sm:px-8 sm:py-9">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-foreground animate-pulse-dot" />
          Guide utilisateur
        </div>

        <div className="flex flex-col gap-5 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <AxiomLogo showBadge={false} nameClassName="text-base font-bold text-foreground" />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Comprendre le produit rapidement
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Le guide va à l&apos;essentiel : ce que fait Axiom, comment l&apos;utiliser, ce qu&apos;il faut en attendre
                et les réflexes à garder pour rester cohérent.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:min-w-[220px]">
            <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Temps de lecture
              </p>
              <p className="mt-2 text-lg font-semibold text-foreground">2 minutes</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {sections.map((section) => {
            const Icon = section.icon

            return (
              <article
                key={section.title}
                className="rounded-3xl border border-border bg-white px-5 py-5 shadow-card-xs sm:px-6"
              >
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                      {section.eyebrow}
                    </p>
                    <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">
                      {section.title}
                    </h2>
                  </div>
                </div>

                {section.content ? (
                  <div className="space-y-3">
                    {section.content.map((line) => (
                      <p key={line} className="text-sm leading-6 text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                ) : null}

                {section.steps ? (
                  <ol className="space-y-3">
                    {section.steps.map((step, index) => (
                      <li key={step} className="flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-[11px] font-semibold text-foreground">
                          {index + 1}
                        </div>
                        <p className="pt-0.5 text-sm leading-6 text-muted-foreground">{step}</p>
                      </li>
                    ))}
                  </ol>
                ) : null}

                {section.items ? (
                  <ul className="space-y-3">
                    {section.items.map((item) => (
                      <li key={item} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <p className="text-sm leading-6 text-muted-foreground">{item}</p>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            )
          })}
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-foreground bg-foreground px-6 py-7 text-background shadow-card sm:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/70">
              Prochaine étape
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">Prêt à lancer votre première analyse ?</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-background/72">
              Commencez par l&apos;Advisor pour générer une allocation cohérente, puis utilisez le dashboard et le
              chat IA pour la relire, la comprendre et l&apos;ajuster avec plus de calme.
            </p>
          </div>

          <Link
            href="/advisor"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/92"
          >
            Lancer mon analyse
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}

import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"

type SeoArticleSection = {
  title: string
  paragraphs: string[]
  bullets?: string[]
}

type SeoArticlePageProps = {
  eyebrow: string
  title: string
  intro: string[]
  sections: SeoArticleSection[]
}

export function SeoArticlePage({
  eyebrow,
  title,
  intro,
  sections,
}: SeoArticlePageProps) {
  return (
    <div className="min-h-screen bg-background px-5 py-12 sm:px-6 sm:py-16">
      <main className="mx-auto max-w-4xl">
        <section className="rounded-[32px] border border-border bg-card px-6 py-8 shadow-card sm:px-8 sm:py-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-foreground" />
            {eyebrow}
          </div>

          <div className="space-y-5 border-b border-border pb-6">
            <AxiomLogo showBadge={false} nameClassName="text-base font-bold text-foreground" />
            <div>
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              <div className="mt-4 space-y-3">
                {intro.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7 text-muted-foreground sm:text-base">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-3xl border border-border bg-background px-5 py-5 shadow-card-xs sm:px-6"
              >
                <h2 className="text-xl font-semibold tracking-tight text-foreground">{section.title}</h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-muted-foreground sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {section.bullets?.length ? (
                  <ul className="mt-5 space-y-3">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                        <span className="text-sm leading-6 text-muted-foreground">{bullet}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-[32px] border border-foreground bg-foreground px-6 py-7 text-background shadow-card sm:px-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-background/70">
            Prochaine etape
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight">
            Creez votre plan avec Axiom AI
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-background/72">
            Utilisez l&apos;Advisor pour transformer votre profil de risque, votre horizon et votre capital en allocation crypto structuree, relisible et ajustable.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-xs leading-6 text-background/70">
              Les crypto-actifs peuvent chuter fortement. Ce contenu est pedagogique et ne constitue ni un conseil financier, ni une promesse de rendement.
            </p>
            <Link
              href="/advisor"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-white/92"
            >
              Lancer mon analyse
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
        <footer className="mt-6 flex flex-col gap-4 rounded-[28px] border border-border bg-card px-6 py-5 shadow-card-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-6 text-muted-foreground">
            Axiom AI est un outil pedagogique. Il aide a structurer une strategie, pas a promettre des gains ni a remplacer un conseiller financier reglemente.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <Link href="/guide" className="transition-colors hover:text-foreground">Guide</Link>
            <Link href="/how-it-works" className="transition-colors hover:text-foreground">Comment ca marche</Link>
            <Link href="/transparency" className="transition-colors hover:text-foreground">Transparence</Link>
            <Link href="/pricing" className="transition-colors hover:text-foreground">Tarifs</Link>
          </div>
        </footer>
      </main>
    </div>
  )
}

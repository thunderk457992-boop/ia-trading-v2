import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/92 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <AxiomLogo />
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Comment ça marche
            </Link>
            <Link href="/transparency" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Transparence
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Tarifs
            </Link>
            <Link
              href="/advisor"
              className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/92"
            >
              Creer mon plan gratuit
              <ArrowRight className="h-4 w-4" />
            </Link>
          </nav>
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/92 md:hidden"
          >
            Creer mon plan
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  )
}

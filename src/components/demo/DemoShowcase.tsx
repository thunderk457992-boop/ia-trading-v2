import type { ReactNode } from "react"
import Link from "next/link"
import {
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  Crown,
  MessageSquareText,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { PortfolioChart } from "@/components/advisor/PortfolioChart"
import { DemoPortfolioLineChart } from "@/components/demo/DemoPortfolioLineChart"
import { cn } from "@/lib/utils"

const landingStats = [
  { label: "Temps d'analyse", value: "~ 1 min" },
  { label: "Portefeuille suivi", value: "15 000 EUR" },
  { label: "Conversations IA", value: "Actives" },
]

const advisorSummary = [
  { label: "Profil", value: "Modere" },
  { label: "Capital initial", value: "5 000 EUR" },
  { label: "DCA mensuel", value: "400 EUR" },
  { label: "Horizon", value: "3 a 5 ans" },
]

const allocations = [
  { asset: "BTC", percentage: 42, note: "Base de conviction" },
  { asset: "ETH", percentage: 28, note: "Croissance liquide" },
  { asset: "SOL", percentage: 14, note: "Beta mesure" },
  { asset: "BNB", percentage: 9, note: "Rendement" },
  { asset: "AVAX", percentage: 7, note: "Satellite" },
]

const dashboardSnapshots = [
  { dateLabel: "03 Apr 2026", shortLabel: "03 Apr", value: 15040, invested: 15000, pnl: 40 },
  { dateLabel: "08 Apr 2026", shortLabel: "08 Apr", value: 15420, invested: 15400, pnl: 20 },
  { dateLabel: "13 Apr 2026", shortLabel: "13 Apr", value: 16080, invested: 15800, pnl: 280 },
  { dateLabel: "18 Apr 2026", shortLabel: "18 Apr", value: 16650, invested: 16200, pnl: 450 },
  { dateLabel: "23 Apr 2026", shortLabel: "23 Apr", value: 17120, invested: 16600, pnl: 520 },
  { dateLabel: "28 Apr 2026", shortLabel: "28 Apr", value: 17680, invested: 17000, pnl: 680 },
  { dateLabel: "03 May 2026", shortLabel: "03 May", value: 18160, invested: 17400, pnl: 760 },
  { dateLabel: "08 May 2026", shortLabel: "08 May", value: 18420, invested: 17800, pnl: 620 },
]

const timeframeChips = [
  { label: "1H", active: false, disabled: true },
  { label: "Recent", active: false, disabled: false },
  { label: "7D", active: false, disabled: false },
  { label: "1M", active: true, disabled: false },
  { label: "ALL", active: false, disabled: false },
]

const pricingPlans = [
  {
    name: "Free",
    price: "0 EUR",
    subtitle: "Starter workflow",
    features: ["1 analyse IA / mois", "12 messages de chat", "Dashboard essentiel"],
    accent: "border-white/10 bg-white/[0.03]",
  },
  {
    name: "Pro",
    price: "24.99 EUR",
    subtitle: "Most popular",
    features: ["20 analyses IA", "Signal marche detaille", "PDF + historique etendu"],
    accent: "border-amber-300/45 bg-amber-300/[0.08]",
    badge: "Populaire",
  },
  {
    name: "Premium",
    price: "59.99 EUR",
    subtitle: "Deep research mode",
    features: ["Analyses illimitees", "Chat premium", "Projections + alertes de risque"],
    accent: "border-white/10 bg-white/[0.03]",
  },
]

function ScreenFrame({
  title,
  eyebrow,
  children,
  className,
}: {
  title: string
  eyebrow: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-[30px] border border-white/10 bg-[#0b0d12]/88 shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-white/8 px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">{eyebrow}</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/90" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/90" />
        </div>
      </div>
      {children}
    </section>
  )
}

export function DemoShowcase({ videoMode }: { videoMode: boolean }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(212,175,55,0.10),transparent_28%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_24%),linear-gradient(180deg,#050607_0%,#0a0d11_45%,#050608_100%)]">
      <div className="mx-auto max-w-[1480px] px-5 py-8 sm:px-6 sm:py-10">
        {videoMode ? (
          <div className="mb-8 flex items-center justify-between">
            <AxiomLogo
              markClassName="bg-white text-[#080a0d]"
              nameClassName="text-white"
              badgeClassName="border-amber-300/30 bg-amber-300/10 text-amber-200"
            />
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/90">
              <Sparkles className="h-3.5 w-3.5" />
              Demo data - video mode
            </div>
          </div>
        ) : (
          <div className="mb-10 rounded-[30px] border border-white/10 bg-white/[0.03] px-6 py-5 shadow-[0_30px_80px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/90">
                  <Sparkles className="h-3.5 w-3.5" />
                  Demo showcase
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    Axiom AI, pret a etre filme
                  </h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-white/65 sm:text-base">
                    Cette page rassemble les ecrans les plus forts du produit avec des donnees realistes
                    mais fictives. Le mode video masque les elements parasites pour faciliter un screen
                    recording propre.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/demo?video=true"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-300/16"
                >
                  Mode video
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/[0.06]"
                >
                  Mode edit
                </Link>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-xs text-white/52">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <Shield className="h-3.5 w-3.5 text-amber-200" />
                Donnees fictives clairement signalees
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-amber-200" />
                Sans impact sur les vraies routes produit
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5">
                <Clock3 className="h-3.5 w-3.5 text-amber-200" />
                Pensee pour capture desktop 16:9
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          <ScreenFrame eyebrow="Landing" title="Hero produit">
            <div className="grid gap-8 px-6 py-7 lg:grid-cols-[1.2fr_0.85fr]">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-100/90">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
                  AI-powered crypto investing platform
                </div>
                <div>
                  <h3 className="max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl">
                    Une vitrine claire du produit, sans bruit inutile.
                  </h3>
                  <p className="mt-4 max-w-2xl text-base leading-8 text-white/65">
                    Advisor IA, allocation crypto, snapshots portefeuille et pricing: tout ce qu&apos;il
                    faut montrer dans une video de presentation, avec un rendu premium noir et or.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {landingStats.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/42">{item.label}</p>
                      <p className="mt-2 text-xl font-semibold tracking-tight text-white">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-5">
                <div className="flex items-center justify-between">
                  <AxiomLogo
                    markClassName="bg-white text-[#050608]"
                    nameClassName="text-white"
                    badgeClassName="border-amber-300/30 bg-amber-300/10 text-amber-200"
                  />
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">Demo card</p>
                    <p className="mt-1 text-sm font-medium text-white/70">Fictive - realistic</p>
                  </div>
                </div>

                <div className="mt-10 space-y-4">
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <Brain className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <div>
                      <p className="text-sm font-semibold text-white">Advisor IA branche au profil</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">
                        Allocation, plan d&apos;action et lecture de marche en une seule passe.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <div>
                      <p className="text-sm font-semibold text-white">Courbe portefeuille basee sur les snapshots</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">
                        Pas de faux graphes. Des points reels, lisibles, et une source de donnees transparente.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
                    <Wallet className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                    <div>
                      <p className="text-sm font-semibold text-white">Pricing et dashboard alignes</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">
                        Une experience produit assez propre pour passer en screen recording sans bricolage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScreenFrame>

          <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr]">
            <ScreenFrame eyebrow="Advisor" title="Questionnaire investisseur">
              <div className="space-y-5 px-6 py-6">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/38">Question 7 / 8</p>
                    <p className="mt-1 text-sm font-medium text-white">Rythme d&apos;investissement et strategie d&apos;entree</p>
                  </div>
                  <div className="w-28 rounded-full bg-white/8 p-1">
                    <div className="h-1.5 w-24 rounded-full bg-amber-300" />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Target className="h-4 w-4 text-amber-200" />
                      <p className="text-sm font-semibold text-white">Frequence d&apos;investissement</p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Une fois", active: false },
                        { label: "Chaque semaine", active: false },
                        { label: "Chaque mois", active: true },
                        { label: "Opportuniste", active: false },
                      ].map(({ label, active }) => (
                        <div
                          key={label}
                          className={cn(
                            "rounded-2xl border px-3 py-3 text-sm transition-colors",
                            active
                              ? "border-amber-300/50 bg-amber-300/10 text-white"
                              : "border-white/10 bg-white/[0.03] text-white/58"
                          )}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/18 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-amber-200" />
                      <p className="text-sm font-semibold text-white">Strategie d&apos;entree</p>
                    </div>
                    <div className="space-y-2.5">
                      {[
                        { label: "Lump sum", active: false },
                        { label: "DCA mensuel", active: true },
                        { label: "DCA hebdomadaire", active: false },
                      ].map(({ label, active }) => (
                        <div
                          key={label}
                          className={cn(
                            "rounded-2xl border px-3 py-3 text-sm transition-colors",
                            active
                              ? "border-amber-300/50 bg-amber-300/10 text-white"
                              : "border-white/10 bg-white/[0.03] text-white/58"
                          )}
                        >
                          {label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {advisorSummary.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">{item.label}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <div>
                    <p className="text-sm font-semibold text-white">Objectif principal</p>
                    <p className="mt-1 text-sm leading-6 text-white/58">
                      Construire un portefeuille long terme, lisser les points d&apos;entree et limiter les erreurs emotionnelles.
                    </p>
                  </div>
                  <div className="hidden rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100 md:block">
                    Pret a analyser
                  </div>
                </div>
              </div>
            </ScreenFrame>

            <ScreenFrame eyebrow="Advisor output" title="Resultat d'analyse IA">
              <div className="grid gap-5 px-6 py-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="space-y-4">
                  <div className="rounded-3xl border border-emerald-300/25 bg-emerald-300/[0.08] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-100/75">Score IA</p>
                        <p className="mt-2 text-5xl font-semibold tracking-tight text-white">84</p>
                      </div>
                      <div className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-emerald-100">
                        Risque modere
                      </div>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-emerald-50/78">
                      Le profil accepte une exposition mesuree aux altcoins, mais la base doit rester concentree sur les actifs les plus liquides.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/18 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-amber-200" />
                      <p className="text-sm font-semibold text-white">Recommandation principale</p>
                    </div>
                    <p className="text-sm leading-7 text-white/65">
                      Entrer progressivement sur BTC et ETH, conserver une poche satellite limitee pour SOL et AVAX, puis reevaluer apres deux snapshots supplementaires.
                    </p>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-black/18 p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-amber-200" />
                      <p className="text-sm font-semibold text-white">Plan d&apos;action</p>
                    </div>
                    <ol className="space-y-3">
                      {[
                        "Executer un premier bloc de 2 500 EUR sur les actifs coeur.",
                        "Programmer 400 EUR de DCA mensuel sur 90 jours.",
                        "Revenir sur le dashboard pour verifier les snapshots quotidiens.",
                      ].map((step, index) => (
                        <li key={step} className="flex gap-3">
                          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#0a0c10]">
                            {index + 1}
                          </div>
                          <p className="text-sm leading-6 text-white/65">{step}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/38">Allocation crypto</p>
                      <p className="mt-1 text-sm text-white/58">Portefeuille modele - donnees fictives</p>
                    </div>
                    <div className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-amber-100">
                      Demo
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="h-56">
                      <PortfolioChart allocations={allocations.map((item) => ({ asset: item.asset, percentage: item.percentage }))} />
                    </div>
                    <div className="space-y-3">
                      {allocations.map((item) => (
                        <div key={item.asset} className="rounded-2xl border border-white/10 bg-black/16 px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">{item.asset}</p>
                              <p className="mt-1 text-xs text-white/48">{item.note}</p>
                            </div>
                            <p className="text-sm font-semibold text-amber-100">{item.percentage}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </ScreenFrame>
          </div>

          <ScreenFrame eyebrow="Dashboard" title="Portefeuille, snapshots et courbe">
            <div className="space-y-5 px-6 py-6">
              <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1.25fr]">
                {[
                  { icon: Wallet, label: "Capital investi", value: "15 000 EUR", hint: "2 analyses + DCA en cours" },
                  { icon: TrendingUp, label: "Valeur portefeuille", value: "18 420 EUR", hint: "+620 EUR sur la periode" },
                  { icon: Shield, label: "Source", value: "portfolio_history", hint: "Dernier snapshot 09:12" },
                  { icon: MessageSquareText, label: "Lecture IA", value: "Variation recente saine", hint: "Pas de performance inventee" },
                ].map((item) => (
                  <div key={item.label} className="rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-amber-200" />
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/38">{item.label}</p>
                    </div>
                    <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{item.value}</p>
                    <p className="mt-2 text-xs text-white/48">{item.hint}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-[30px] border border-white/10 bg-black/16 p-5">
                <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/38">Courbe portefeuille</p>
                    <p className="mt-1 text-sm text-white/58">Snapshots globaux agreges, valorisation fictive de demonstration.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {timeframeChips.map((chip) => (
                      <span
                        key={chip.label}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                          chip.active
                            ? "border border-amber-300/40 bg-amber-300/12 text-amber-100"
                            : chip.disabled
                              ? "border border-white/8 bg-white/[0.02] text-white/28"
                              : "border border-white/10 bg-white/[0.03] text-white/60"
                        )}
                      >
                        {chip.label}
                      </span>
                    ))}
                  </div>
                </div>

                <DemoPortfolioLineChart data={dashboardSnapshots} />

                <div className="mt-4 flex flex-col gap-2 border-t border-white/8 pt-4 text-xs text-white/48 lg:flex-row lg:items-center lg:justify-between">
                  <span>La courbe se construit avec vos analyses et les snapshots quotidiens.</span>
                  <span>Historique de demo - derniers points reels simules pour la video.</span>
                </div>
              </div>
            </div>
          </ScreenFrame>

          <ScreenFrame eyebrow="Pricing" title="Plans et upgrade path">
            <div className="grid gap-5 px-6 py-6 lg:grid-cols-3">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn("relative flex h-full flex-col rounded-[28px] border p-5", plan.accent)}
                >
                  {plan.badge ? (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-100">
                      {plan.badge}
                    </div>
                  ) : null}

                  <div className="mb-5">
                    <div className="mb-3 flex items-center gap-2">
                      {plan.name === "Pro" ? (
                        <Zap className="h-4 w-4 text-amber-200" />
                      ) : plan.name === "Premium" ? (
                        <Crown className="h-4 w-4 text-amber-200" />
                      ) : (
                        <Sparkles className="h-4 w-4 text-amber-200" />
                      )}
                      <p className="text-lg font-semibold text-white">{plan.name}</p>
                    </div>
                    <p className="text-3xl font-semibold tracking-tight text-white">{plan.price}</p>
                    <p className="mt-2 text-sm text-white/52">{plan.subtitle}</p>
                  </div>

                  <ul className="flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/[0.05]">
                          <CheckCircle2 className="h-2.5 w-2.5 text-amber-200" />
                        </div>
                        <span className="text-sm leading-6 text-white/68">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-300/28 bg-amber-300/10 px-4 py-3 text-sm font-semibold text-amber-100">
                    Choisir {plan.name}
                  </div>
                </div>
              ))}
            </div>
          </ScreenFrame>
        </div>

        <div className={cn("mt-8 text-center text-xs text-white/42", videoMode && "mt-10")}>
          Donnees fictives de demonstration. Aucune performance reelle ni promesse de rendement.
        </div>
      </div>
    </div>
  )
}

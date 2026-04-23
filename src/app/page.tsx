"use client"

import Link from "next/link"
import { ArrowRight, Check, Zap, Crown, Sparkles } from "lucide-react"

const EXAMPLE_ALLOCATION = [
  { asset: "BTC",  pct: 40, label: "Bitcoin" },
  { asset: "ETH",  pct: 30, label: "Ethereum" },
  { asset: "SOL",  pct: 15, label: "Solana" },
  { asset: "BNB",  pct: 10, label: "BNB" },
  { asset: "AVAX", pct: 5,  label: "Avalanche" },
]

const BAR_COLORS: Record<string, string> = {
  BTC: "bg-amber-400", ETH: "bg-blue-500", SOL: "bg-violet-500",
  BNB: "bg-yellow-400", AVAX: "bg-rose-500",
}

function VelaLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 4L8 13L14 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <span className="font-black text-foreground text-lg tracking-tight">Vela</span>
      <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md">AI</span>
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <VelaLogo />
          <div className="hidden md:flex items-center gap-8">
            <Link href="#how" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Fonctionnement</Link>
            <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Tarifs</Link>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Connexion</Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-lg transition-colors"
            >
              Tester gratuitement
            </Link>
          </div>
          <Link href="/register" className="md:hidden px-4 py-2 bg-amber-500 text-black text-sm font-bold rounded-lg">
            Tester
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-28 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium mb-10 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Propulsé par Claude AI · Analyses en 30 secondes
          </div>

          <h1 className="font-bold tracking-tighter text-foreground mb-4 leading-[1.02]">
            <span className="block text-5xl md:text-7xl">Arrêtez de deviner.</span>
            <span className="block text-5xl md:text-7xl text-muted-foreground mt-1">Investissez avec méthode.</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-lg mx-auto mb-10 leading-relaxed mt-8">
            Décrivez votre profil. L&apos;IA analyse vos objectifs et génère une allocation crypto sur mesure en 30 secondes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors text-base"
            >
              Tester gratuitement
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="#how"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary border border-border text-foreground font-semibold rounded-xl transition-colors hover:bg-secondary/80 text-base"
            >
              Voir un exemple
            </Link>
          </div>

          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-muted-foreground">
            {["Sans carte de crédit", "30 secondes chrono", "Claude AI"].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 px-6 bg-secondary border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Fonctionnement</p>
            <h2 className="text-4xl font-bold text-foreground tracking-tight">3 étapes, 30 secondes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-10 mb-20">
            {[
              { n: "01", title: "Renseignez votre profil", desc: "Capital, tolérance au risque, horizon, objectifs. 5 questions, pas plus." },
              { n: "02", title: "L'IA analyse",            desc: "Claude AI croise votre profil avec les conditions de marché en temps réel." },
              { n: "03", title: "Recevez votre plan",      desc: "Allocation en % par crypto, score de confiance, plan d'action en étapes." },
            ].map((item) => (
              <div key={item.n} className="relative">
                <div className="text-5xl font-black text-border mb-4 tracking-tighter select-none">{item.n}</div>
                <h3 className="font-semibold text-foreground mb-2 text-lg">{item.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Example card */}
          <div className="max-w-xl mx-auto rounded-2xl border border-border bg-card overflow-hidden">
            <div className="bg-secondary px-6 py-4 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <VelaLogo />
                <span className="text-sm text-muted-foreground font-medium">Exemple de résultat</span>
              </div>
              <span className="text-xs text-muted-foreground">Modéré · 5 000€ · Moyen terme</span>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-secondary border border-border">
                <div className="text-5xl font-black text-amber-500 tabular-nums">82</div>
                <div>
                  <div className="font-bold text-foreground">Bon profil</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Stratégie solide, bonne diversification</div>
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-semibold text-amber-700">Risque modéré</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-5">
                {EXAMPLE_ALLOCATION.map((item) => (
                  <div key={item.asset}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${BAR_COLORS[item.asset]}`} />
                        <span className="text-sm font-bold text-foreground">{item.asset}</span>
                        <span className="text-xs text-muted-foreground">{item.label}</span>
                      </div>
                      <span className="text-sm font-bold text-foreground">{item.pct}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <div className={`h-1.5 rounded-full ${BAR_COLORS[item.asset]}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 mb-5">
                <p className="text-xs font-semibold text-emerald-700 mb-1">Plan d&apos;action recommandé</p>
                <p className="text-xs text-emerald-600 leading-relaxed">
                  Acheter BTC + ETH immédiatement · DCA sur SOL sur 3 mois · Conserver 10% de liquidités
                </p>
              </div>

              <div className="text-center">
                <Link href="/register"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-colors">
                  Obtenir mon analyse personnalisée
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Fonctionnalités</p>
            <h2 className="text-4xl font-bold text-foreground tracking-tight">Tout ce dont vous avez besoin</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border border-border">
            {[
              { title: "IA Conseiller",         desc: "Profil investisseur → allocation optimale en 30 secondes. Propulsé par Claude AI." },
              { title: "Données en temps réel", desc: "Prix et capitalisation des principales cryptos mis à jour automatiquement." },
              { title: "Gestion du risque",     desc: "Profils conservateur, modéré ou agressif — diversification adaptée à chaque cas." },
              { title: "Plan d'action concret", desc: "Pas que des chiffres — un plan étape par étape pour mettre en œuvre la stratégie." },
              { title: "Historique complet",    desc: "Toutes vos analyses sauvegardées. Suivez l'évolution de votre stratégie dans le temps." },
              { title: "Dashboard clair",       desc: "Score moyen, marchés en direct, dernière recommandation — tout en un coup d'œil." },
            ].map((f) => (
              <div key={f.title} className="p-7 bg-card hover:bg-secondary transition-colors">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center mb-4">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4L8 13L14 4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 px-6 bg-secondary border-y border-border">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-widest mb-3">Tarifs</p>
            <h2 className="text-4xl font-bold text-foreground tracking-tight">Commencez gratuitement</h2>
            <p className="text-muted-foreground mt-3">Évoluez quand vous êtes prêt.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 items-stretch">
            {[
              {
                name: "Gratuit", price: "0€", icon: Sparkles,
                features: ["1 analyse IA par mois", "Dashboard marché en direct", "8 cryptos majeures", "Historique 3 analyses"],
                cta: "Commencer gratuitement", highlighted: false, href: "/register", badge: null,
              },
              {
                name: "Pro", price: "29€", icon: Zap,
                features: ["20 analyses IA par mois", "Historique complet", "Données marché enrichies", "Priorité de traitement", "Support prioritaire"],
                cta: "Choisir Pro", highlighted: true, href: "/register", badge: "Populaire",
              },
              {
                name: "Premium", price: "79€", icon: Crown,
                features: ["Analyses illimitées", "Historique 20 analyses", "Claude Opus (modèle premium)", "Accès anticipé", "Support dédié < 4h"],
                cta: "Choisir Premium", highlighted: false, href: "/register", badge: null,
              },
            ].map((plan) => {
              const Icon = plan.icon
              return (
                <div key={plan.name} className={`relative flex flex-col rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-amber-50 to-card border border-amber-200"
                    : "bg-card border border-border"
                }`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-amber-500 text-black text-xs font-bold rounded-full shadow-sm">
                      {plan.badge}
                    </div>
                  )}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.highlighted ? "bg-amber-100" : "bg-secondary"}`}>
                        <Icon className={`w-4 h-4 ${plan.highlighted ? "text-amber-600" : "text-muted-foreground"}`} />
                      </div>
                      <h3 className="font-bold text-foreground">{plan.name}</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      {plan.price !== "0€" && <span className="text-sm text-muted-foreground">/mois</span>}
                    </div>
                  </div>
                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <Check className={`w-4 h-4 shrink-0 ${plan.highlighted ? "text-amber-500" : "text-muted-foreground"}`} />
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={`block text-center py-3 rounded-xl font-bold text-sm transition-colors ${
                      plan.highlighted
                        ? "bg-amber-500 hover:bg-amber-400 text-black"
                        : "bg-secondary hover:bg-secondary/80 text-foreground border border-border"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              )
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            Paiement sécurisé par Stripe · Sans engagement · Annulez à tout moment
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 bg-background">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 text-xs font-medium mb-8 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            1 analyse gratuite dès l&apos;inscription
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4 tracking-tight">
            Votre premier plan crypto IA<br />en 30 secondes.
          </h2>
          <p className="text-muted-foreground mb-10 text-lg">
            Créez un compte gratuit. Aucune carte requise.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
          >
            Tester gratuitement
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Mobile sticky CTA */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border px-4 py-3 safe-area-bottom">
        <Link
          href="/register"
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-colors"
        >
          Tester gratuitement — c&apos;est gratuit
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Footer */}
      <footer className="bg-secondary border-t border-border py-10 px-6 pb-24 md:pb-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <VelaLogo />
          <p className="text-xs text-muted-foreground text-center">
            © 2026 Vela. Les cryptomonnaies comportent des risques de perte en capital. Ce n&apos;est pas un conseil financier.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/legal/cgu" className="text-xs text-muted-foreground hover:text-foreground transition-colors">CGU</Link>
            <Link href="/legal/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

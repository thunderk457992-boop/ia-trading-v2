"use client"

import Link from "next/link"
import { ArrowRight, Brain, TrendingUp, Shield, Zap, Star, ChevronDown } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-white">IA Trading Sens</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-white/60 hover:text-white transition-colors">Fonctionnalités</Link>
            <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Tarifs</Link>
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Connexion</Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Commencer gratuitement
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/4 w-[400px] h-[400px] bg-purple-600/8 rounded-full blur-[80px]" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[80px]" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-sm mb-8">
            <Zap className="w-3.5 h-3.5" />
            <span>Propulsé par Claude AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
            Votre conseiller crypto{" "}
            <span className="gradient-text">intelligent</span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Obtenez des allocations de portfolio personnalisées basées sur votre profil,
            vos objectifs et les conditions du marché — en quelques secondes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all glow-purple hover:scale-[1.02] active:scale-[0.98]"
            >
              Analyser mon portfolio gratuitement
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 glass-strong text-white font-semibold rounded-2xl transition-all hover:bg-white/10"
            >
              Voir les fonctionnalités
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "10K+", label: "Utilisateurs" },
              { value: "98%", label: "Satisfaction" },
              { value: "€2.4M", label: "Gérés" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold gradient-text">{stat.value}</div>
                <div className="text-xs text-white/40 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-white/50 text-lg max-w-2xl mx-auto">
              De l&apos;analyse IA avancée aux alertes en temps réel.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "IA Conseiller", desc: "Profil d'investisseur → allocation optimale générée par Claude AI en quelques secondes.", gradient: "from-indigo-600/20 to-purple-600/20" },
              { icon: TrendingUp, title: "Signaux de trading", desc: "Alertes personnalisées basées sur vos cryptos préférées et votre tolérance au risque.", gradient: "from-emerald-600/20 to-teal-600/20" },
              { icon: Shield, title: "Gestion du risque", desc: "Analyse de corrélation et diversification pour protéger votre capital.", gradient: "from-amber-600/20 to-orange-600/20" },
              { icon: Zap, title: "Temps réel", desc: "Prix et données de marché mis à jour en continu pour des décisions éclairées.", gradient: "from-pink-600/20 to-rose-600/20" },
              { icon: Star, title: "Rapports PDF", desc: "Générez des rapports professionnels de votre portfolio.", gradient: "from-violet-600/20 to-purple-600/20" },
              { icon: ArrowRight, title: "API Access", desc: "Intégrez nos analyses dans vos propres outils et dashboards.", gradient: "from-cyan-600/20 to-blue-600/20" },
            ].map((feature) => (
              <div key={feature.title} className="p-6 rounded-2xl glass border border-white/5 hover:border-white/10 transition-all group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Tarifs simples</h2>
            <p className="text-white/50 text-lg">Commencez gratuitement, évoluez selon vos besoins.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Free", price: "0€", features: ["1 analyse IA/mois", "Portfolio basique", "Données (15min délai)", "Support email"], cta: "Commencer", highlighted: false },
              { name: "Pro", price: "29€", features: ["20 analyses IA/mois", "3 portfolios", "Données temps réel", "Alertes prix", "Rapports PDF"], cta: "Essayer 14 jours gratuit", highlighted: true },
              { name: "Premium", price: "79€", features: ["Analyses illimitées", "Portfolios illimités", "Signaux avancés", "API Access", "Gestionnaire dédié"], cta: "Contacter", highlighted: false },
            ].map((plan) => (
              <div key={plan.name} className={`p-8 rounded-2xl relative ${plan.highlighted ? "bg-indigo-600/20 border border-indigo-500/40 glow-purple" : "glass border border-white/5"}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-semibold rounded-full">Populaire</div>
                )}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-white/40 text-sm">/mois</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block text-center py-3 rounded-xl font-medium text-sm transition-all ${plan.highlighted ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "glass-strong hover:bg-white/10 text-white"}`}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl glass border border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Prêt à optimiser vos cryptos ?</h2>
              <p className="text-white/50 mb-8">Rejoignez des milliers d&apos;investisseurs qui font confiance à notre IA.</p>
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all glow-purple">
                Démarrer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <Brain className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium">IA Trading Sens</span>
          </div>
          <p className="text-sm text-white/30">© 2025 IA Trading Sens. Les cryptomonnaies comportent des risques.</p>
        </div>
      </footer>
    </div>
  )
}

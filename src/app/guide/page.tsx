import Link from "next/link"
import { Target, Cpu, BarChart3, AlertTriangle, Rocket, ArrowRight, CheckCircle } from "lucide-react"

const sections = [
  {
    icon: Target,
    emoji: "🎯",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    title: "À quoi sert ce site",
    content: [
      "Ce site t'aide à savoir quoi faire avec ton argent en crypto.",
      "Tu donnes ton profil. L'IA analyse le marché. Elle te donne un plan clair.",
      "Tu n'as pas besoin d'être expert. Le site s'adapte à ton niveau.",
    ],
  },
  {
    icon: Cpu,
    emoji: "⚙️",
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    title: "Comment ça marche",
    steps: [
      "Tu réponds à quelques questions simples (budget, objectif, horizon)",
      "L'IA lit les prix du marché en temps réel",
      "Elle génère un plan personnalisé en quelques secondes",
    ],
  },
  {
    icon: BarChart3,
    emoji: "📊",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    title: "Ce que tu reçois",
    items: [
      "Une répartition claire : BTC 50%, ETH 30%, SOL 20%…",
      "Des actions concrètes : acheter maintenant, attendre, réviser",
      "Deux scénarios : que faire si le marché monte ou baisse",
      "Un timing précis : dans combien de temps revoir ton portefeuille",
    ],
  },
  {
    icon: AlertTriangle,
    emoji: "⚠️",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-100",
    title: "Ce que tu dois savoir",
    items: [
      "Ce n'est pas magique. L'IA se base sur les données du moment.",
      "Le marché monte et descend. C'est normal.",
      "Ne mets jamais plus que ce que tu peux perdre.",
      "Suis le plan. Ne panique pas à chaque variation.",
    ],
  },
  {
    icon: Rocket,
    emoji: "🚀",
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
    title: "Ce que tu vas gagner",
    items: [
      "Éviter les erreurs classiques du débutant",
      "Investir de façon logique, pas au feeling",
      "Comprendre pourquoi tu fais chaque choix",
      "Progresser à chaque analyse",
    ],
  },
]

export default function GuidePage() {
  return (
    <div className="max-w-2xl mx-auto animate-slide-up">

      {/* Header */}
      <div className="mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse-dot" />
          <span className="text-xs font-bold text-amber-700 uppercase tracking-widest">Guide</span>
        </div>
        <h1 className="text-4xl font-black text-foreground tracking-tight mb-3">
          Comment utiliser ce site
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Tout comprendre en 30 secondes.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <div key={section.title} className={`rounded-2xl border p-6 ${section.bg} ${section.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white border ${section.border} shrink-0`}>
                  <Icon className={`w-4.5 h-4.5 ${section.color}`} />
                </div>
                <h2 className={`font-black text-lg ${section.color}`}>{section.title}</h2>
              </div>

              {section.content && (
                <div className="space-y-2">
                  {section.content.map((line, i) => (
                    <p key={i} className="text-sm text-foreground leading-relaxed">{line}</p>
                  ))}
                </div>
              )}

              {section.steps && (
                <ol className="space-y-2.5">
                  {section.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5 ${section.bg} border ${section.border} ${section.color}`}>
                        {i + 1}
                      </div>
                      <p className="text-sm text-foreground leading-relaxed pt-0.5">{step}</p>
                    </li>
                  ))}
                </ol>
              )}

              {section.items && (
                <ul className="space-y-2.5">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle className={`w-4 h-4 shrink-0 mt-0.5 ${section.color}`} />
                      <p className="text-sm text-foreground leading-relaxed">{item}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div className="mt-8 p-6 rounded-2xl bg-card border border-border text-center">
        <p className="text-foreground font-bold mb-1">Prêt à commencer ?</p>
        <p className="text-sm text-muted-foreground mb-5">
          Lance ta première analyse. C&apos;est gratuit.
        </p>
        <Link
          href="/advisor"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-2xl text-sm transition-all glow-sm-gold"
        >
          Lancer mon analyse
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}

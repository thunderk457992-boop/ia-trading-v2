"use client"

import { Gauge } from "lucide-react"

interface DisciplineCardProps {
  lastAnalysisDate: string | null
  snapshotCount: number
}

function buildDisciplineMessage(lastAnalysisDate: string | null, snapshotCount: number) {
  if (!lastAnalysisDate) {
    return "La discipline commence avec un premier plan. Une fois l'analyse lancee, laisse au marche le temps de respirer avant de tout remettre en question."
  }

  const analysisTimestamp = Date.parse(lastAnalysisDate)
  const hoursSinceAnalysis = Math.max(0, Math.round((Date.now() - analysisTimestamp) / (60 * 60 * 1000)))

  if (hoursSinceAnalysis < 24) {
    return "Ton plan reste tres recent. Laisse-lui un peu de temps avant d'en tirer une conclusion."
  }

  if (hoursSinceAnalysis < 72 || snapshotCount < 3) {
    return "Quelques snapshots ne suffisent pas encore pour conclure. Evite de changer de strategie a chaud."
  }

  if (hoursSinceAnalysis < 14 * 24) {
    return "Le marche peut faire beaucoup de bruit a court terme. La discipline compte plus que le timing parfait."
  }

  return "Un bon plan se juge sur sa coherence et sa tenue dans le temps, pas sur un seul mouvement de marche."
}

export function DisciplineCard({ lastAnalysisDate, snapshotCount }: DisciplineCardProps) {
  const message = buildDisciplineMessage(lastAnalysisDate, snapshotCount)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Gauge className="h-4 w-4 text-slate-500" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Discipline</p>
          <h3 className="text-[15px] font-semibold text-slate-950">Rester rationnel</h3>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-6 text-slate-600">{message}</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Repere coach</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          {snapshotCount} snapshot{snapshotCount > 1 ? "s" : ""} disponible{snapshotCount > 1 ? "s" : ""} pour nourrir le suivi. Le but n&apos;est pas de reagir a chaque mouvement, mais de garder un plan coherent avec ton horizon.
        </p>
      </div>
    </div>
  )
}

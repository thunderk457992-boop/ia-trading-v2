"use client"

import { Gauge } from "lucide-react"

interface DisciplineCardProps {
  lastAnalysisDate: string | null
  snapshotCount: number
  analysisCount?: number
}

function buildStreak(lastAnalysisDate: string | null, analysisCount: number): {
  weeksActive: number
  streak: string
  note: string
} {
  if (!lastAnalysisDate || analysisCount === 0) {
    return { weeksActive: 0, streak: "—", note: "La discipline commence avec la première analyse." }
  }

  const daysSince = Math.floor((Date.now() - new Date(lastAnalysisDate).getTime()) / 86400000)
  const weeksActive = Math.min(analysisCount, Math.max(1, Math.floor(daysSince / 7) + 1))

  let streak: string
  let note: string

  if (analysisCount >= 10) {
    streak = `${analysisCount} analyses`
    note = "Régularité confirmée. Continuer à réviser le plan selon le contexte marché, pas selon les émotions."
  } else if (analysisCount >= 4) {
    streak = `${analysisCount} analyses`
    note = "Bon rythme. L'accumulation de snapshots rend le suivi de performance plus fiable."
  } else if (analysisCount >= 2) {
    streak = `${analysisCount} analyses`
    note = "Début de suivi. Revenir régulièrement construit un historique plus exploitable."
  } else {
    streak = "1ère analyse"
    note = "Laisser au plan le temps de travailler avant de le remettre en question."
  }

  return { weeksActive, streak, note }
}

function buildDisciplineMessage(lastAnalysisDate: string | null, snapshotCount: number) {
  if (!lastAnalysisDate) {
    return "La discipline commence avec un premier plan. Une fois l'analyse lancée, laissez au marché le temps de respirer avant de tout remettre en question."
  }

  const hoursSinceAnalysis = Math.max(0, Math.round((Date.now() - new Date(lastAnalysisDate).getTime()) / 3600000))

  if (hoursSinceAnalysis < 24) {
    return "Votre plan est très récent. Laissez-lui un peu de temps avant d'en tirer une conclusion."
  }

  if (hoursSinceAnalysis < 72 || snapshotCount < 3) {
    return "Quelques snapshots ne suffisent pas encore pour conclure. Évitez de changer de stratégie à chaud."
  }

  if (hoursSinceAnalysis < 14 * 24) {
    return "Le marché peut faire beaucoup de bruit à court terme. La discipline compte plus que le timing parfait."
  }

  return "Un bon plan se juge sur sa cohérence et sa tenue dans le temps, pas sur un seul mouvement de marché."
}

export function DisciplineCard({ lastAnalysisDate, snapshotCount, analysisCount = 0 }: DisciplineCardProps) {
  const message = buildDisciplineMessage(lastAnalysisDate, snapshotCount)
  const { streak, note } = buildStreak(lastAnalysisDate, analysisCount)

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <Gauge className="h-4 w-4 text-slate-500" />
          <div>
            <p className="eyebrow">Discipline</p>
            <h3 className="text-[15px] font-semibold text-slate-950">Rester rationnel</h3>
          </div>
        </div>
        {analysisCount > 0 && (
          <div className="rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
            {streak}
          </div>
        )}
      </div>

      <p className="text-[13px] leading-6 text-slate-600">{message}</p>

      <div className="surface-soft mt-3 px-3 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Repère</p>
        <p className="mt-1 text-[11px] leading-5 text-slate-500">{note}</p>
        <p className="mt-1 text-[11px] text-slate-400">
          {snapshotCount} snapshot{snapshotCount !== 1 ? "s" : ""} · {analysisCount} analyse{analysisCount !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  )
}

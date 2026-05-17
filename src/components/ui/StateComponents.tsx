import { AlertTriangle, BarChart3, Clock, Construction, Lock } from "lucide-react"
import Link from "next/link"

// ── BuildingHistoryState ──────────────────────────────────────────────────────

interface BuildingHistoryStateProps {
  snapshotCount?: number
  message?: string
  ctaHref?: string
  ctaLabel?: string
}

export function BuildingHistoryState({
  snapshotCount = 0,
  message,
  ctaHref,
  ctaLabel,
}: BuildingHistoryStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-secondary/40 px-6 py-10 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
        <Construction className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">Historique en construction</p>
      <p className="mt-2 max-w-xs text-[13px] leading-6 text-muted-foreground">
        {message ?? "Chaque analyse ajoute un point de données. L'historique devient exploitable après quelques sessions."}
      </p>
      {snapshotCount > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground/70">
          {snapshotCount} snapshot{snapshotCount > 1 ? "s" : ""} enregistré{snapshotCount > 1 ? "s" : ""}
        </p>
      )}
      {ctaHref && ctaLabel && (
        <Link
          href={ctaHref}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
        >
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}

// ── DataUnavailableState ──────────────────────────────────────────────────────

interface DataUnavailableStateProps {
  title?: string
  message?: string
  retryLabel?: string
  onRetry?: () => void
  lastUpdated?: string | null
}

export function DataUnavailableState({
  title = "Données temporairement indisponibles",
  message,
  retryLabel,
  onRetry,
  lastUpdated,
}: DataUnavailableStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-warning/30 bg-warning/8 px-6 py-8 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-warning/30 bg-card">
        <AlertTriangle className="h-4.5 w-4.5 text-warning" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1.5 max-w-xs text-[13px] leading-6 text-muted-foreground">
        {message ?? "Les données de marché sont temporairement inaccessibles. La page se met à jour automatiquement."}
      </p>
      {lastUpdated && (
        <div className="mt-2 flex items-center gap-1.5 text-[11px] text-warning">
          <Clock className="h-3 w-3" />
          <span>Dernière donnée : {lastUpdated}</span>
        </div>
      )}
      {onRetry && retryLabel && (
        <button
          onClick={onRetry}
          className="mt-4 rounded-xl border border-border bg-card px-4 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}

// ── PartialDataState ──────────────────────────────────────────────────────────

interface PartialDataStateProps {
  availableCount: number
  totalCount: number
  source?: string
  message?: string
}

export function PartialDataState({ availableCount, totalCount, source, message }: PartialDataStateProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/50 px-4 py-3">
      <BarChart3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-[12px] font-semibold text-foreground">
          Données partielles — {availableCount}/{totalCount} actifs disponibles
        </p>
        <p className="mt-0.5 text-[11px] leading-5 text-muted-foreground">
          {message ?? `${source ?? "La source principale"} ne couvre pas encore tous les actifs. Le fallback CoinGecko est actif pour le reste.`}
        </p>
      </div>
    </div>
  )
}

// ── PremiumLockedState ────────────────────────────────────────────────────────

interface PremiumLockedStateProps {
  feature: string
  target: "pro" | "premium"
  description?: string
  onClick?: () => void
}

export function PremiumLockedState({ feature, target, description, onClick }: PremiumLockedStateProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col items-center justify-center rounded-2xl border border-border bg-secondary/40 px-6 py-8 text-center transition-colors hover:bg-secondary/70"
    >
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-border bg-card">
        <Lock className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mb-1 flex items-center gap-2">
        <p className="text-sm font-semibold text-foreground">{feature}</p>
        <span className="rounded-full border border-border bg-foreground px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-background">
          {target === "premium" ? "Premium" : "Pro"}
        </span>
      </div>
      <p className="max-w-xs text-[12px] leading-5 text-muted-foreground">
        {description ?? "Cette fonctionnalité est disponible dans le plan supérieur."}
      </p>
      <p className="mt-3 text-[12px] font-semibold text-foreground underline underline-offset-2">
        Débloquer →
      </p>
    </button>
  )
}

// ── EmptyAnalysisState ────────────────────────────────────────────────────────

interface EmptyAnalysisStateProps {
  ctaHref: string
}

export function EmptyAnalysisState({ ctaHref }: EmptyAnalysisStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-secondary/30 px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
        <BarChart3 className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">Aucune analyse pour le moment</p>
      <p className="mt-2 max-w-xs text-[13px] leading-6 text-muted-foreground">
        Lancez votre première analyse pour obtenir une allocation personnalisée et commencer le suivi de votre portefeuille.
      </p>
      <Link
        href={ctaHref}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
      >
        Lancer l&apos;analyse
      </Link>
    </div>
  )
}

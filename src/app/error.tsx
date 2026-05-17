"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[global-error]", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        Une erreur inattendue s&apos;est produite
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        La page n&apos;a pas pu se charger. Cela peut être temporaire — réessayez ou revenez au tableau de bord.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-opacity hover:opacity-85"
        >
          <RefreshCw className="h-4 w-4" />
          Réessayer
        </button>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Tableau de bord
        </Link>
      </div>
      {error.digest && (
        <p className="mt-6 text-[11px] text-muted-foreground/60">Réf. erreur : {error.digest}</p>
      )}
    </div>
  )
}

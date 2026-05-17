"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RefreshCw } from "lucide-react"

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[chat-error]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-card">
        <AlertTriangle className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-base font-semibold text-foreground">Le chat est temporairement indisponible</p>
      <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
        La session de chat n&apos;a pas pu démarrer. Réessayez dans quelques instants.
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
          href="/advisor"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
        >
          Analyse complète
        </Link>
      </div>
    </div>
  )
}

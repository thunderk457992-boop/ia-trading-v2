"use client"

import { useEffect, useRef, useState } from "react"
import { AlertCircle, Check, Loader2, Mail } from "lucide-react"

interface ResendConfirmationButtonProps {
  email: string
  nextPath?: string | null
  className?: string
}

function getResendErrorMessage(message: string) {
  if (/rate limit|too many/i.test(message)) {
    return "Trop de tentatives. Reessayez dans quelques minutes."
  }

  if (/email/i.test(message)) {
    return "Entrez un email valide pour renvoyer la confirmation."
  }

  return "Impossible de renvoyer l'email de confirmation pour le moment."
}

export function ResendConfirmationButton({
  email,
  nextPath = "/dashboard",
  className = "",
}: ResendConfirmationButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    setReady(true)
  }, [])

  const resolveEmail = () => {
    const trimmedEmail = email.trim()
    if (trimmedEmail) return trimmedEmail

    const form = containerRef.current?.closest("form")
    const emailInput = form?.querySelector('input[type="email"]')
    return emailInput instanceof HTMLInputElement ? emailInput.value.trim() : ""
  }

  const handleResend = async () => {
    const trimmedEmail = resolveEmail()
    if (!trimmedEmail) {
      setError("Entrez votre email pour renvoyer la confirmation.")
      setSuccess("")
      return
    }

    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/auth/resend-confirmation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          nextPath,
        }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(
          getResendErrorMessage(
            typeof data.error === "string" ? data.error : "Impossible de renvoyer l'email de confirmation pour le moment."
          )
        )
        return
      }

      setSuccess("Email renvoye. Verifiez vos spams et l'onglet Promotions.")
    } catch {
      setError("Impossible de renvoyer l'email de confirmation pour le moment.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div ref={containerRef} className={className}>
      <button
        type="button"
        onClick={handleResend}
        disabled={!ready || loading}
        data-testid="resend-confirmation-button"
        className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className="inline-flex items-center justify-center gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {loading ? "Envoi..." : "Renvoyer l'email de confirmation"}
        </span>
      </button>

      {success ? (
        <div
          data-testid="resend-confirmation-success"
          className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700"
        >
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{success}</p>
        </div>
      ) : null}

      {error ? (
        <div
          data-testid="resend-confirmation-error"
          className="mt-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <p>{error}</p>
        </div>
      ) : null}
    </div>
  )
}

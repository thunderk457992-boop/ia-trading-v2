"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react"
import { ResendConfirmationButton } from "@/components/auth/ResendConfirmationButton"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { buildAuthCallbackUrl } from "@/lib/auth-redirect"
import { createClient } from "@/lib/supabase/client"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [info, setInfo] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const nextPath = searchParams.get("next") || "/dashboard"

  useEffect(() => {
    const errorParam = searchParams.get("error")
    if (errorParam === "link_expired" || errorParam === "auth_error") {
      setError("Lien expire ou deja utilise. Demandez un nouveau lien de confirmation.")
    }
    if (searchParams.get("deleted") === "true") {
      setInfo("Votre compte a ete supprime definitivement.")
    }
    if (searchParams.get("reason") === "auth_required") {
      setInfo("Connectez-vous pour acceder a cette page.")
    }
  }, [searchParams])

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Entrez votre email pour reinitialiser le mot de passe")
      return
    }

    setResetLoading(true)
    setError("")
    try {
      const supabase = createClient()
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildAuthCallbackUrl(window.location.origin, "/settings"),
      })
      setResetSent(true)
    } catch {
      setError("La reinitialisation est indisponible pour le moment. Reessayez un peu plus tard.")
    } finally {
      setResetLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        const message = signInError.message.includes("Invalid login credentials")
          ? "Email ou mot de passe incorrect."
          : signInError.message.includes("Email not confirmed")
          ? "Confirmez votre email avant de vous connecter."
          : signInError.message.includes("Too many requests")
          ? "Trop de tentatives. Reessayez dans quelques minutes."
          : signInError.message
        setError(message)
        return
      }

      router.push(nextPath)
      router.refresh()
    } catch {
      setError("La connexion est temporairement indisponible. Verifiez la configuration Supabase ou reessayez.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="block text-sm font-medium text-muted-foreground mb-1.5">
          Email
        </label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all text-sm"
        />
      </div>

      <div>
        <label htmlFor="login-password" className="block text-sm font-medium text-muted-foreground mb-1.5">
          Mot de passe
        </label>
        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Votre mot de passe"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Masquer le contenu saisi" : "Afficher le contenu saisi"}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {info ? (
        <div className="flex items-start gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {info}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed text-background font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-1"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        {loading ? "Connexion..." : "Se connecter"}
      </button>

      {resetSent ? (
        <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
          <Check className="w-3.5 h-3.5 shrink-0" />
          Email envoye ! Verifiez votre boite mail.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          {resetLoading ? "Envoi..." : "Mot de passe oublie ?"}
        </button>
      )}

      <ResendConfirmationButton email={email} nextPath={nextPath} className="pt-1" />

      <p className="text-center text-xs text-muted-foreground">
        Si vous attendez l&apos;email de confirmation, pensez a verifier vos spams.
      </p>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background overflow-y-auto flex items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <AxiomLogo />
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1.5">Bon retour</h1>
          <p className="text-muted-foreground text-sm">Connectez-vous a votre compte</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <Suspense
            fallback={
              <div className="space-y-4 animate-pulse">
                <div className="h-12 bg-secondary rounded-xl" />
                <div className="h-12 bg-secondary rounded-xl" />
                <div className="h-11 bg-secondary rounded-xl" />
              </div>
            }
          >
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-foreground font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity">
              Creer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

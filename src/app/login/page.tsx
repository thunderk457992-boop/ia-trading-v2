"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react"
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

  useEffect(() => {
    if (searchParams.get("error") === "auth_error") {
      setError("Le lien de confirmation est invalide ou a expiré. Réessayez.")
    }
    if (searchParams.get("deleted") === "true") {
      setInfo("Votre compte a été déconnecté. Vos données seront supprimées sous 30 jours.")
    }
  }, [searchParams])

  const handleForgotPassword = async () => {
    if (!email) { setError("Entrez votre email pour réinitialiser le mot de passe"); return }
    setResetLoading(true)
    setError("")
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      const msg = error.message.includes("Invalid login credentials")
        ? "Email ou mot de passe incorrect."
        : error.message.includes("Email not confirmed")
        ? "Confirmez votre email avant de vous connecter."
        : error.message.includes("Too many requests")
        ? "Trop de tentatives. Réessayez dans quelques minutes."
        : error.message
      setError(msg)
      setLoading(false)
    } else {
      router.push("/dashboard")
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleLogin} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@exemple.com"
          required
          autoComplete="email"
          className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Mot de passe</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500/50 transition-all text-sm pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {info && (
        <div className="flex items-start gap-2 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {info}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-1"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      {resetSent ? (
        <div className="flex items-center gap-2 text-emerald-700 text-xs bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
          <Check className="w-3.5 h-3.5 shrink-0" />
          Email envoyé ! Vérifiez votre boîte mail.
        </div>
      ) : (
        <button
          type="button"
          onClick={handleForgotPassword}
          disabled={resetLoading}
          className="w-full text-center text-xs text-muted-foreground hover:text-amber-500 transition-colors py-1"
        >
          {resetLoading ? "Envoi…" : "Mot de passe oublié ?"}
        </button>
      )}
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 4L8 13L14 4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-black text-foreground text-lg tracking-tight">Vela</span>
            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded-md">AI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1.5">Bon retour</h1>
          <p className="text-muted-foreground text-sm">Connectez-vous à votre compte</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
          <Suspense fallback={
            <div className="space-y-4 animate-pulse">
              <div className="h-12 bg-secondary rounded-xl"/>
              <div className="h-12 bg-secondary rounded-xl"/>
              <div className="h-11 bg-secondary rounded-xl"/>
            </div>
          }>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-amber-600 hover:text-amber-500 transition-colors font-semibold">
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Check, AlertCircle, Mail } from "lucide-react"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const passwordStrength = (() => {
    if (password.length === 0) return 0
    let score = 0
    if (password.length >= 8) score++
    if (password.length >= 12) score++
    if (/[A-Z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    return Math.min(score, 4)
  })()

  const strengthLabel = ["", "Faible", "Moyen", "Bon", "Fort"][passwordStrength]
  const strengthColor = ["", "bg-red-400", "bg-amber-400", "bg-blue-500", "bg-emerald-500"][passwordStrength]

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères"); return }
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signUpError) {
      const msg =
        signUpError.message.includes("already registered") ||
        signUpError.message.includes("already been registered") ||
        signUpError.message.includes("User already registered")
          ? "Un compte existe déjà avec cet email."
          : signUpError.message.includes("Password should be")
          ? "Le mot de passe doit contenir au moins 6 caractères."
          : signUpError.message.includes("Unable to validate")
          ? "Email invalide."
          : signUpError.message
      setError(msg)
      setLoading(false)
      return
    }

    if (data.session) {
      router.push("/dashboard")
      router.refresh()
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto flex items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Vérifiez votre email</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Un lien de confirmation a été envoyé à{" "}
            <strong className="text-foreground">{email}</strong>.
            <br />Cliquez sur le lien pour activer votre compte.
          </p>
          <Link href="/login" className="text-foreground text-sm font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity">
            ← Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-y-auto flex items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-7 sm:mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <AxiomLogo />
          </Link>
          <h1 className="text-2xl font-bold text-foreground mb-1.5">Créer votre compte</h1>
          <p className="text-muted-foreground text-sm">Commencez gratuitement, sans carte de crédit</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
                autoComplete="name"
                className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
              <input
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
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  autoComplete="new-password"
                  className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div key={level} className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength ? strengthColor : "bg-secondary"}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed text-background font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? "Création du compte..." : "Créer mon compte gratuit"}
            </button>

            <p className="text-xs text-muted-foreground text-center">
              En créant un compte, vous acceptez nos{" "}
              <Link href="/legal/cgu" className="text-muted-foreground hover:text-foreground underline">CGU</Link>{" "}
              et notre{" "}
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground underline">politique de confidentialité</Link>.
            </p>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-foreground font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          {["Gratuit pour commencer", "Sans carte de crédit"].map((text) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

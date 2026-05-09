"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Loader2, Check, AlertCircle, Mail } from "lucide-react"
import { ResendConfirmationButton } from "@/components/auth/ResendConfirmationButton"
import { AxiomLogo } from "@/components/branding/AxiomLogo"
import { buildAuthCallbackUrl } from "@/lib/auth-redirect"
import { createClient } from "@/lib/supabase/client"

function getSignUpErrorMessage(message: string) {
  if (
    message.includes("already registered") ||
    message.includes("already been registered") ||
    message.includes("User already registered")
  ) {
    return "Un compte existe deja avec cet email."
  }

  if (message.includes("Password should be")) {
    return "Le mot de passe doit contenir au moins 6 caracteres."
  }

  if (message.includes("Unable to validate")) {
    return "Email invalide."
  }

  return message
}

export default function RegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [confirmationNextPath, setConfirmationNextPath] = useState("/dashboard")

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

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caracteres")
      return
    }

    setLoading(true)
    setError("")

    try {
      const nextPath = typeof window === "undefined"
        ? "/dashboard"
        : new URLSearchParams(window.location.search).get("next") || "/dashboard"

      const supabase = createClient()
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: buildAuthCallbackUrl(window.location.origin, nextPath),
        },
      })

      if (signUpError) {
        setError(getSignUpErrorMessage(signUpError.message))
        return
      }

      const isObfuscatedExistingUser =
        !data.session &&
        Array.isArray(data.user?.identities) &&
        data.user.identities.length === 0

      if (isObfuscatedExistingUser) {
        setError("Cet email semble deja utilise ou en attente de confirmation. Connectez-vous ou renvoyez l'email de confirmation.")
        return
      }

      if (data.session) {
        router.push(nextPath)
        router.refresh()
        return
      }

      setConfirmationNextPath(nextPath)
      setSuccess(true)
    } catch {
      setError("L'inscription est temporairement indisponible. Verifiez la configuration Supabase ou reessayez.")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto flex items-start justify-center px-4 py-10 sm:items-center sm:px-6 sm:py-12">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-7 h-7 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Verifiez votre email</h2>
          <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
            Un lien de confirmation a ete envoye a{" "}
            <strong className="text-foreground">{email}</strong>.
            <br />Cliquez sur le lien pour activer votre compte.
          </p>
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Vous ne voyez rien ?</p>
            <p className="mt-1">Verifiez vos spams et l&apos;onglet Promotions.</p>
          </div>
          <ResendConfirmationButton
            email={email}
            nextPath={confirmationNextPath}
            className="mt-4"
          />
          <Link
            href="/login"
            className="mt-5 inline-block text-foreground text-sm font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity"
          >
            Retour a la connexion
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
          <h1 className="text-2xl font-bold text-foreground mb-1.5">Creer votre compte</h1>
          <p className="text-muted-foreground text-sm">Commencez gratuitement, sans carte de credit</p>
        </div>

        <div className="bg-card rounded-2xl border border-border p-5 sm:p-6">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label htmlFor="register-full-name" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Nom complet
              </label>
              <input
                id="register-full-name"
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
              <label htmlFor="register-email" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Email
              </label>
              <input
                id="register-email"
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
              <label htmlFor="register-password" className="block text-sm font-medium text-muted-foreground mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caracteres minimum"
                  required
                  autoComplete="new-password"
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
              {password.length > 0 ? (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${level <= passwordStrength ? strengthColor : "bg-secondary"}`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{strengthLabel}</p>
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-foreground hover:bg-foreground/90 disabled:opacity-60 disabled:cursor-not-allowed text-background font-bold rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Creation du compte..." : "Creer mon compte gratuit"}
            </button>

            <ResendConfirmationButton
              email={email}
              nextPath={confirmationNextPath}
              className="mt-3"
            />

            <p className="text-xs text-muted-foreground text-center">
              Si l&apos;email tarde a arriver, verifiez aussi vos spams et l&apos;onglet Promotions.
            </p>

            <p className="text-xs text-muted-foreground text-center">
              En creant un compte, vous acceptez nos{" "}
              <Link href="/legal/cgu" className="text-muted-foreground hover:text-foreground underline">
                CGU
              </Link>{" "}
              et notre{" "}
              <Link href="/legal/privacy" className="text-muted-foreground hover:text-foreground underline">
                politique de confidentialite
              </Link>.
            </p>
          </form>

          <div className="mt-5 pt-5 border-t border-border text-center text-sm text-muted-foreground">
            Deja un compte ?{" "}
            <Link href="/login" className="text-foreground font-semibold underline underline-offset-4 hover:opacity-75 transition-opacity">
              Se connecter
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6">
          {["Gratuit pour commencer", "Sans carte de credit"].map((text) => (
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

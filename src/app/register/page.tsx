"use client"

import { useState } from "react"
import Link from "next/link"
import { Brain, Eye, EyeOff, Loader2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function RegisterPage() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères")
      return
    }
    setLoading(true)
    setError("")

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Vérifiez votre email</h2>
          <p className="text-white/50 text-sm mb-6">
            Nous avons envoyé un lien de confirmation à <strong className="text-white">{email}</strong>.
            Cliquez dessus pour activer votre compte.
          </p>
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 text-sm font-medium">
            Retour à la connexion →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">IA Trading Sens</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Créer votre compte</h1>
          <p className="text-white/40 text-sm">Commencez gratuitement, sans carte de crédit</p>
        </div>

        <div className="p-6 rounded-2xl glass border border-white/8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Nom complet</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Jean Dupont"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-500/5 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-500/5 transition-all text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/70 mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-indigo-500/60 focus:bg-indigo-500/5 transition-all text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        password.length >= level * 2
                          ? password.length >= 12 ? "bg-emerald-500" : password.length >= 8 ? "bg-amber-500" : "bg-red-500"
                          : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? "Création du compte..." : "Créer mon compte gratuit"}
            </button>

            <p className="text-xs text-white/30 text-center">
              En créant un compte, vous acceptez nos{" "}
              <Link href="#" className="text-white/50 hover:text-white">CGU</Link>{" "}
              et notre{" "}
              <Link href="#" className="text-white/50 hover:text-white">politique de confidentialité</Link>.
            </p>
          </form>

          <div className="mt-6 text-center text-sm text-white/40">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
              Se connecter
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

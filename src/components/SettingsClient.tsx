"use client"

import { useState } from "react"
import { User, CreditCard, Shield, Bell, Loader2, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface Props {
  user: { email?: string; id: string }
  profile: { full_name?: string; plan?: string; stripe_subscription_id?: string } | null
}

export function SettingsClient({ user, profile }: Props) {
  const [activeTab, setActiveTab] = useState("profile")
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [portalLoading, setPortalLoading] = useState(false)

  const handleSaveProfile = async () => {
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from("profiles")
      .update({ full_name: fullName, updated_at: new Date().toISOString() })
      .eq("id", user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    const res = await fetch("/api/stripe/portal", { method: "POST" })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    setPortalLoading(false)
  }

  const tabs = [
    { id: "profile", label: "Profil", icon: User },
    { id: "billing", label: "Facturation", icon: CreditCard },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
  ]

  const planInfo = {
    free: { label: "Free", color: "text-white/40", bg: "bg-white/5" },
    pro: { label: "Pro", color: "text-indigo-400", bg: "bg-indigo-500/10" },
    premium: { label: "Premium", color: "text-amber-400", bg: "bg-amber-500/10" },
  }
  const plan = (profile?.plan ?? "free") as keyof typeof planInfo
  const planDisplay = planInfo[plan]

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Paramètres</h1>

      <div className="flex gap-1 mb-8 p-1 glass rounded-xl border border-white/5 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
          <h2 className="font-semibold">Informations personnelles</h2>
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500/60 text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-1.5">Email</label>
            <input
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full px-4 py-3 bg-white/3 border border-white/5 rounded-xl text-white/50 text-sm cursor-not-allowed"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-all"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
            {saved ? "Sauvegardé !" : saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
        </div>
      )}

      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl glass border border-white/5">
            <h2 className="font-semibold mb-4">Plan actuel</h2>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${planDisplay.bg} ${planDisplay.color}`}>
                  {planDisplay.label}
                </div>
                <span className="text-sm text-white/50">
                  {plan === "free" ? "Plan gratuit" : "Abonnement actif"}
                </span>
              </div>
              {profile?.stripe_subscription_id ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 glass-strong border border-white/10 text-sm rounded-xl hover:bg-white/10 transition-all"
                >
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  Gérer l&apos;abonnement
                </button>
              ) : (
                <a href="/pricing" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-xl transition-colors font-medium">
                  Upgrader
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "security" && (
        <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
          <h2 className="font-semibold">Sécurité du compte</h2>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="text-sm font-medium mb-1">Changer de mot de passe</div>
            <p className="text-xs text-white/40 mb-3">Un email de réinitialisation sera envoyé à {user.email}</p>
            <button className="px-4 py-2 glass-strong border border-white/10 text-sm rounded-xl hover:bg-white/10 transition-all">
              Envoyer le lien de réinitialisation
            </button>
          </div>
          <div className="p-4 rounded-xl bg-white/3 border border-white/5">
            <div className="text-sm font-medium mb-1 flex items-center gap-2">
              Authentification à deux facteurs
              <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">Bientôt disponible</span>
            </div>
            <p className="text-xs text-white/40">Sécurisez votre compte avec une application d&apos;authentification.</p>
          </div>
        </div>
      )}

      {activeTab === "notifications" && (
        <div className="p-6 rounded-2xl glass border border-white/5 space-y-4">
          <h2 className="font-semibold">Préférences de notifications</h2>
          {[
            { label: "Alertes de prix", desc: "Notifié quand une crypto atteint votre cible" },
            { label: "Nouvelles analyses IA", desc: "Quand l'IA détecte une opportunité" },
            { label: "Résumé hebdomadaire", desc: "Performance de votre portfolio" },
            { label: "Actualités crypto", desc: "Dernières nouvelles du marché" },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-white/3 border border-white/5">
              <div>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-white/40">{item.desc}</div>
              </div>
              <div className="relative">
                <input type="checkbox" className="sr-only" defaultChecked />
                <div className="w-10 h-5 bg-indigo-600 rounded-full cursor-pointer" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

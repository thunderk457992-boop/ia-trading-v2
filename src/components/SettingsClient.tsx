"use client"

import { useEffect, useState } from "react"
import { User, CreditCard, Shield, Bell, Loader2, Check, ExternalLink, AlertCircle, Crown, Zap, Sparkles } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

interface Subscription {
  id: string
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

interface Payment {
  id: string
  amount: number
  currency: string
  status: string
  description: string | null
  invoice_url: string | null
  paid_at: string | null
  created_at: string
}

interface Props {
  user: { email?: string; id: string }
  profile: { full_name?: string; plan?: string; stripe_subscription_id?: string } | null
  subscription: Subscription | null
  payments: Payment[]
}

const TABS = [
  { id: "profile",       label: "Profil",        icon: User },
  { id: "billing",       label: "Facturation",   icon: CreditCard },
  { id: "security",      label: "Sécurité",      icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
]
type SettingsTab = typeof TABS[number]["id"]

const PLAN_META = {
  free:    { label: "Free",    icon: Sparkles, color: "text-slate-600",   bg: "bg-secondary",   border: "border-border" },
  pro:     { label: "Pro",     icon: Zap,      color: "text-blue-600",    bg: "bg-blue-50",     border: "border-blue-200" },
  premium: { label: "Premium", icon: Crown,    color: "text-amber-600",   bg: "bg-amber-50",    border: "border-amber-200" },
} as const

export function SettingsClient({ user, profile, subscription, payments }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [fullName, setFullName] = useState(profile?.full_name ?? "")
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle")
  const [portalLoading, setPortalLoading] = useState(false)
  const [portalError, setPortalError] = useState("")
  const [resetLoading, setResetLoading] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const plan = (profile?.plan ?? "free") as keyof typeof PLAN_META
  const planMeta = PLAN_META[plan] ?? PLAN_META.free
  const PlanIcon = planMeta.icon
  const requestedTab = searchParams.get("tab")

  useEffect(() => {
    if (requestedTab && TABS.some((tab) => tab.id === requestedTab)) {
      setActiveTab(requestedTab as SettingsTab)
    }
  }, [requestedTab])

  const handleSaveProfile = async () => {
    setSaving(true)
    setSaveStatus("idle")
    const supabase = createClient()
    const cleanedFullName = fullName.trim()
    const { data, error } = await supabase
      .from("profiles")
      .update({ full_name: cleanedFullName, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("full_name")
      .maybeSingle()

    setSaving(false)

    if (error || !data) {
      console.error("Failed to save profile", error)
      setSaveStatus("error")
      return
    }

    setFullName(data.full_name ?? "")
    setSaveStatus("success")
    router.refresh()
    setTimeout(() => setSaveStatus("idle"), 3000)
  }

  const handleManageSubscription = async () => {
    setPortalLoading(true)
    setPortalError("")
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      if (data.url) window.location.href = data.url
    } catch (err) {
      setPortalError(err instanceof Error ? err.message : "Le portail de facturation est indisponible pour le moment.")
    } finally {
      setPortalLoading(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/login?deleted=true"
  }

  const handleResetPassword = async () => {
    setResetLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(user.email ?? "", {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    })
    setResetLoading(false)
    setResetSent(true)
  }

  const formatAmount = (amount: number, currency: string) =>
    new Intl.NumberFormat("fr-FR", { style: "currency", currency: currency.toUpperCase() }).format(amount / 100)

  const formatDate = (dateStr: string | null) =>
    dateStr ? new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "—"

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-foreground mb-8">Paramètres</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 bg-secondary rounded-xl border border-border w-full sm:w-fit overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold transition-all shrink-0",
              activeTab === tab.id
                ? "bg-card text-foreground border border-border shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden text-xs">{tab.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>

      {/* Profile */}
      {activeTab === "profile" && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-5">
          <h2 className="font-semibold text-lg text-foreground">Informations personnelles</h2>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
            <input
              type="email"
              value={user.email ?? ""}
              disabled
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-muted-foreground text-sm cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground mt-1">L&apos;email ne peut pas être modifié.</p>
          </div>

          {saveStatus === "error" && (
            <div className="flex items-center gap-2 text-red-600 text-sm px-3 py-2 bg-red-50 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4" />
              Erreur lors de la sauvegarde. Réessayez.
            </div>
          )}

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-foreground hover:bg-foreground/90 text-background rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveStatus === "success" && <Check className="w-4 h-4" />}
            {saveStatus === "success" ? "Sauvegardé !" : saving ? "Sauvegarde…" : "Sauvegarder"}
          </button>
        </div>
      )}

      {/* Billing */}
      {activeTab === "billing" && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-card border border-border">
            <h2 className="font-semibold text-lg text-foreground mb-4">Abonnement actuel</h2>
            <div className={cn("flex items-center justify-between p-4 rounded-xl border", planMeta.bg, planMeta.border)}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border", planMeta.bg, planMeta.border)}>
                  <PlanIcon className={cn("w-5 h-5", planMeta.color)} />
                </div>
                <div>
                  <div className={cn("font-bold", planMeta.color)}>Plan {planMeta.label}</div>
                  {subscription ? (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {subscription.cancel_at_period_end
                        ? `Annulé — actif jusqu'au ${formatDate(subscription.current_period_end)}`
                        : `Renouvellement le ${formatDate(subscription.current_period_end)}`}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground mt-0.5">{plan === "free" ? "1 analyse IA par mois" : "Actif"}</div>
                  )}
                </div>
              </div>

              {subscription ? (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary border border-border text-foreground text-sm rounded-xl hover:bg-secondary/80 transition-all"
                >
                  {portalLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ExternalLink className="w-3.5 h-3.5" />}
                  Gérer
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-foreground hover:bg-foreground/90 text-background text-sm rounded-xl transition-colors font-bold"
                >
                  Upgrader
                </Link>
              )}
            </div>
            {portalError && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>{portalError}</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h2 className="font-semibold text-lg text-foreground mb-4">Historique des paiements</h2>
            {payments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucun paiement pour l&apos;instant.</p>
            ) : (
              <div className="space-y-2">
                {payments.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary border border-border">
                    <div>
                      <div className="text-sm font-semibold text-foreground">{p.description ?? "Paiement"}</div>
                      <div className="text-xs text-muted-foreground">{formatDate(p.paid_at ?? p.created_at)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-medium",
                        p.status === "succeeded"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-red-50 text-red-600 border border-red-200"
                      )}>
                        {p.status === "succeeded" ? "Réussi" : "Échoué"}
                      </span>
                      <span className="font-bold text-sm text-foreground">{formatAmount(p.amount, p.currency)}</span>
                      {p.invoice_url && (
                        <a href={p.invoice_url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security */}
      {activeTab === "security" && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-4">
          <h2 className="font-semibold text-lg text-foreground">Sécurité du compte</h2>

          <div className="p-4 rounded-xl bg-secondary border border-border">
            <div className="text-sm font-semibold text-foreground mb-1">Changer de mot de passe</div>
            <p className="text-xs text-muted-foreground mb-3">
              Un email de réinitialisation sera envoyé à <strong className="text-foreground">{user.email}</strong>
            </p>
            {resetSent ? (
              <div className="flex items-center gap-2 text-emerald-700 text-sm bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">
                <Check className="w-4 h-4" />
                Email envoyé ! Vérifiez votre boîte mail.
              </div>
            ) : (
              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-sm rounded-xl hover:bg-secondary transition-all font-medium"
              >
                {resetLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Envoyer le lien de réinitialisation
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-secondary border border-border">
            <div className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
              Authentification à deux facteurs
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-md font-semibold">Bientôt</span>
            </div>
            <p className="text-xs text-muted-foreground">Sécurisez votre compte avec une application d&apos;authentification.</p>
          </div>

          <div className="p-4 rounded-xl bg-red-50 border border-red-200">
            <div className="text-sm font-semibold text-red-600 mb-1">Zone de danger</div>
            <p className="text-xs text-muted-foreground mb-3">La suppression de votre compte est irréversible et supprime toutes vos données.</p>
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
              >
                Supprimer mon compte
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-red-600">Confirmer la suppression ?</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleting}
                    className="flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-colors hover:bg-foreground/90 disabled:opacity-60"
                  >
                    {deleting && <Loader2 className="w-3 h-3 animate-spin" />}
                    Oui, supprimer
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications */}
      {activeTab === "notifications" && (
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg text-foreground">Préférences de notifications</h2>
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">Bientôt disponible</span>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Les notifications ne sont pas encore actives. Les réglages ci-dessous sont affichés à titre indicatif et resteront désactivés jusqu’à leur mise en service.
          </div>
          {[
            { label: "Alertes de prix",        desc: "Notifié quand une crypto atteint votre cible",           default: true },
            { label: "Nouvelles analyses IA",  desc: "Quand l'IA détecte une opportunité de marché",           default: true },
            { label: "Résumé hebdomadaire",    desc: "Performance de votre portfolio chaque lundi",            default: false },
            { label: "Actualités importantes", desc: "Régulations, hacks, actualités majeures",               default: true },
            { label: "Facturation",            desc: "Renouvellement, paiements, factures",                   default: true },
          ].map((item) => (
            <label key={item.label} className="flex items-center justify-between p-4 rounded-xl bg-secondary border border-border opacity-75 cursor-not-allowed">
              <div>
                <div className="text-sm font-semibold text-foreground">{item.label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
              </div>
              <div className="relative ml-4 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={item.default}
                  readOnly
                  disabled
                  aria-label={`${item.label} indisponible pour le moment`}
                />
                <div className={cn("w-10 h-5 rounded-full transition-colors", item.default ? "bg-foreground/70" : "bg-border")} />
                <div className={cn("absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-all", item.default && "translate-x-5")} />
              </div>
            </label>
          ))}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-border bg-card/80 px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Légal</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link
            href="/legal/cgu"
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Conditions d&apos;utilisation
          </Link>
          <Link
            href="/legal/privacy"
            className="rounded-lg border border-border px-3 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Politique de confidentialité
          </Link>
        </div>
      </div>
    </div>
  )
}

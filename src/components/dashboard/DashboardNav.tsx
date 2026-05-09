"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Activity,
  Bell,
  BookOpen,
  Brain,
  CreditCard,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
} from "lucide-react"
import { useEffect, useState } from "react"
import { AxiomGlyph } from "@/components/branding/AxiomLogo"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", mobileLabel: "Dashboard" },
  { href: "/advisor", icon: Brain, label: "Conseiller IA", mobileLabel: "IA" },
  { href: "/chat", icon: MessageSquare, label: "Chat IA", mobileLabel: "Chat" },
  { href: "/kraken-live", icon: Activity, label: "Kraken Live", mobileLabel: "Kraken" },
  { href: "/pricing", icon: CreditCard, label: "Plans", mobileLabel: "Plans" },
  { href: "/settings", icon: Settings, label: "Paramètres", mobileLabel: "Réglages" },
]

const SUPPORT_EMAIL = "support.axiom.support@gmail.com"
const SUPPORT_SUBJECT = "Support Axiom – Demande utilisateur"
const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(SUPPORT_SUBJECT)}`

interface KrakenTick {
  symbol: string
  price: number
}

interface DashboardNavProps {
  user: { email?: string } | null
  profile: { full_name?: string; plan?: string } | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const plan = (profile?.plan ?? "free") as "free" | "pro" | "premium"
  const [livePrices, setLivePrices] = useState<KrakenTick[]>([])
  const [supportMessage, setSupportMessage] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = () =>
      fetch("/api/kraken", { cache: "no-store" })
        .then((response) => response.json())
        .then((data) => {
          if (mounted) setLivePrices((data.tickers ?? []).slice(0, 3))
        })
        .catch(() => {})

    load()
    const id = setInterval(load, 15000)

    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push("/login")
  }

  const handleSupportClick = async () => {
    setSupportMessage(null)

    try {
      window.location.href = SUPPORT_MAILTO

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(SUPPORT_EMAIL)
        setSupportMessage("Si votre client mail ne s'ouvre pas, l'adresse support a été copiée.")
      } else {
        setSupportMessage(`Si rien ne s'ouvre, écrivez-nous à ${SUPPORT_EMAIL}.`)
      }
    } catch {
      setSupportMessage(`Contactez-nous à ${SUPPORT_EMAIL}.`)
    }
  }

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const planBadge = {
    free: { label: "Free", cls: "border border-border bg-secondary text-muted-foreground" },
    pro: { label: "Pro", cls: "border border-border bg-card text-foreground" },
    premium: { label: "Premium", cls: "border border-foreground bg-foreground text-background" },
  }[plan]

  return (
    <>
      <aside className="fixed left-0 top-0 bottom-0 z-40 hidden w-64 flex-col border-r border-border/80 bg-white/98 backdrop-blur-md md:flex">
        <div className="flex h-14 items-center border-b border-border/80 px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-foreground shadow-card-xs">
              <AxiomGlyph className="h-4 w-4 text-background" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Axiom</span>
            <span className="ml-auto rounded-full border border-border bg-secondary px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              AI
            </span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-all",
                    active
                      ? "bg-foreground text-background shadow-card-xs"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {livePrices.length > 0 && (
            <div className="mt-5 border-t border-border/80 pt-4">
              <div className="mb-2 flex items-center justify-between px-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Kraken Live</p>
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              </div>
              <div className="space-y-0.5">
                {livePrices.map((tick) => (
                  <div key={tick.symbol} className="flex items-center justify-between rounded-xl px-3 py-2 transition-colors hover:bg-secondary">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground">
                        {tick.symbol.charAt(0)}
                      </div>
                      <span className="text-[12px] font-medium text-foreground">{tick.symbol}</span>
                    </div>
                    <span className="tabular-nums text-[11px] font-medium text-foreground">
                      ${tick.price >= 1000
                        ? tick.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                        : tick.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-border/80 pt-4">
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Actions</p>
            <div className="space-y-0.5">
              <Link href="/settings?tab=notifications" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Bell className="h-3.5 w-3.5" />
                <span>Notifications</span>
              </Link>
              <Link href="/advisor" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <Brain className="h-3.5 w-3.5" />
                <span>Nouvelle analyse</span>
              </Link>
              <Link href="/chat" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span>Ouvrir le chat</span>
              </Link>
              <Link href="/guide" className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Guide d&apos;utilisation</span>
              </Link>
              <button
                type="button"
                onClick={() => void handleSupportClick()}
                title="Support Axiom - Contactez-nous pour toute question"
                aria-label="Contacter le support Axiom par email"
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Support</span>
              </button>
              {supportMessage && (
                <p className="px-3 pt-1 text-[11px] leading-5 text-muted-foreground">
                  {supportMessage}
                </p>
              )}
              <div className="px-3 pt-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Légal</p>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/legal/cgu"
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    CGU
                  </Link>
                  <Link
                    href="/legal/privacy"
                    className="rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    Confidentialité
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="border-t border-border/80 p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary">
            <div className="relative shrink-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <span className="text-[11px] font-semibold text-foreground">{initials}</span>
              </div>
              <div className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-success" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {profile?.full_name || user?.email?.split("@")[0] || "Utilisateur"}
              </p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", planBadge.cls)}>
                {planBadge.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Deconnexion"
              className="shrink-0 inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Deconnexion"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-[12px] font-medium">Deconnexion</span>
            </button>
          </div>
        </div>
      </aside>

      <header className="fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-border/80 bg-white/98 px-3.5 backdrop-blur-md md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-foreground shadow-card-xs">
            <AxiomGlyph className="h-3.5 w-3.5 text-background" />
          </div>
          <span className="font-semibold tracking-tight text-foreground">Axiom</span>
        </Link>
        <div className="flex items-center gap-1.5">
          <span className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", planBadge.cls)}>
            {planBadge.label}
          </span>
          <button
            onClick={handleLogout}
            aria-label="Deconnexion"
            title="Deconnexion"
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            <span>Deconnexion</span>
          </button>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border/80 bg-white/95 px-1.5 shadow-[0_-8px_24px_rgba(17,24,39,0.06)] backdrop-blur-md md:hidden safe-area-bottom">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-1 flex-col items-center justify-center gap-1 rounded-2xl py-2.5 text-[9px] font-medium leading-tight transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="whitespace-nowrap">{item.mobileLabel}</span>
              {active && (
                <div className="absolute -top-0.5 left-1/2 h-0.5 w-8 -translate-x-1/2 rounded-full bg-foreground" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

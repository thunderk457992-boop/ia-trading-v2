"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard, Settings, CreditCard, LogOut, User,
  Activity, Brain, Bell, HelpCircle, TrendingUp, TrendingDown, BookOpen,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

function VelaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 4L8 13L14 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const navItems = [
  { href: "/dashboard",   icon: LayoutDashboard, label: "Dashboard" },
  { href: "/advisor",     icon: Brain,           label: "Conseiller IA" },
  { href: "/kraken-live", icon: Activity,        label: "Kraken Live" },
  { href: "/pricing",     icon: CreditCard,      label: "Plans" },
  { href: "/settings",    icon: Settings,        label: "Paramètres" },
]

interface KrakenTick { symbol: string; price: number; change?: number }

interface DashboardNavProps {
  user: { email?: string } | null
  profile: { full_name?: string; plan?: string } | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router   = useRouter()
  const plan     = (profile?.plan ?? "free") as "free" | "pro" | "premium"
  const [livePrices, setLivePrices] = useState<KrakenTick[]>([])

  useEffect(() => {
    let mounted = true
    const load = () =>
      fetch("/api/kraken", { cache: "no-store" })
        .then(r => r.json())
        .then(data => { if (mounted) setLivePrices((data.tickers ?? []).slice(0, 3)) })
        .catch(() => {})
    load()
    const id = setInterval(load, 15000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
    router.push("/login")
  }

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)

  const planBadge = {
    free:    { label: "Free",    cls: "bg-secondary text-muted-foreground" },
    pro:     { label: "Pro",     cls: "bg-blue-50 text-blue-600" },
    premium: { label: "Premium", cls: "bg-amber-50 text-amber-600" },
  }[plan]

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-40">

        {/* Logo */}
        <div className="flex h-14 items-center border-b border-border px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
              <VelaIcon className="w-4 h-4 text-background" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Vela</span>
            <span className="ml-auto text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">AI</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                    active
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>

          {/* Live prices */}
          {livePrices.length > 0 && (
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-center justify-between px-3 mb-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Kraken Live</p>
                <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              </div>
              <div className="space-y-0.5">
                {livePrices.map((t) => (
                  <div key={t.symbol} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground">
                        {t.symbol.charAt(0)}
                      </div>
                      <span className="text-[12px] font-medium text-foreground">{t.symbol}</span>
                    </div>
                    <span className="text-[11px] font-medium text-foreground tabular-nums">
                      ${t.price >= 1000
                        ? t.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
                        : t.price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Actions</p>
            <div className="space-y-0.5">
              <Link
                href="/settings"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Notifications</span>
              </Link>
              <Link
                href="/advisor"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <Brain className="h-3.5 w-3.5" />
                <span>Nouvelle analyse</span>
              </Link>
              <Link
                href="/guide"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Guide d&apos;utilisation</span>
              </Link>
              <a
                href="mailto:support@velacrypto.ai"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>Support</span>
              </a>
            </div>
          </div>
        </nav>

        {/* User footer */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-secondary/60 transition-colors">
            <div className="relative shrink-0">
              <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-[11px] font-semibold text-foreground">{initials}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success border-2 border-card" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-foreground truncate">
                {profile?.full_name || user?.email?.split("@")[0] || "Utilisateur"}
              </p>
              <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", planBadge.cls)}>
                {planBadge.label}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border h-14 flex items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-foreground">
            <VelaIcon className="w-3.5 h-3.5 text-background" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">Vela</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className={cn("text-[10px] font-bold px-2 py-1 rounded", planBadge.cls)}>{planBadge.label}</span>
          <button onClick={handleLogout} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-md border-t border-border flex safe-area-bottom">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-medium transition-colors relative",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>
                {item.label === "Conseiller IA" ? "IA"
                  : item.label === "Kraken Live" ? "Kraken"
                  : item.label === "Paramètres" ? "Réglages"
                  : item.label}
              </span>
              {active && (
                <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-foreground" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}

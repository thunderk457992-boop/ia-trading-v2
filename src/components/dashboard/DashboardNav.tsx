"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Brain, LayoutDashboard, TrendingUp, Settings,
  CreditCard, LogOut, User, Zap
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/advisor", icon: Brain, label: "Conseiller IA" },
  { href: "/pricing", icon: CreditCard, label: "Plans & Tarifs" },
  { href: "/settings", icon: Settings, label: "Paramètres" },
]

interface DashboardNavProps {
  user: { email?: string } | null
  profile: { full_name?: string; plan?: string } | null
}

export function DashboardNav({ user, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  const planColors: Record<string, string> = {
    free: "text-white/40",
    pro: "text-indigo-400",
    premium: "text-amber-400",
  }

  const plan = profile?.plan ?? "free"

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 glass border-r border-white/5 flex flex-col z-40">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-sm">IA Trading Sens</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
              {item.label === "Conseiller IA" && plan === "free" && (
                <span className="ml-auto text-xs bg-indigo-600/30 text-indigo-400 px-1.5 py-0.5 rounded-md">Pro</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Plan badge */}
      {plan !== "premium" && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-indigo-600/10 border border-indigo-500/20">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs font-semibold text-indigo-400">Passer au Pro</span>
          </div>
          <p className="text-xs text-white/40 mb-3">Analyses illimitées et signaux avancés</p>
          <Link
            href="/pricing"
            className="block text-center text-xs py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors font-medium"
          >
            Upgrader maintenant
          </Link>
        </div>
      )}

      {/* User */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center">
            <User className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">{profile?.full_name || "Utilisateur"}</div>
            <div className={cn("text-xs capitalize", planColors[plan])}>
              Plan {plan}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/40 hover:text-white/70 hover:bg-white/5 rounded-lg transition-all"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  )
}

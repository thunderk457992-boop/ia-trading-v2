"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Brain,
  CreditCard,
  Settings,
  LogOut,
  TrendingUp,
  TrendingDown,
  Bell,
  HelpCircle,
  Keyboard,
} from "lucide-react"

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/advisor", icon: Brain, label: "AI Advisor" },
  { href: "/pricing", icon: CreditCard, label: "Plans" },
  { href: "/settings", icon: Settings, label: "Settings" },
]

const liveData = [
  { symbol: "BTC", price: "$67,432", change: 2.34, positive: true },
  { symbol: "ETH", price: "$3,521", change: 1.87, positive: true },
  { symbol: "SOL", price: "$178.92", change: -0.56, positive: false },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-border bg-card lg:flex lg:flex-col">
      <div className="flex h-14 items-center border-b border-border px-5">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground">
            <span className="text-sm font-bold text-background">A</span>
          </div>
          <div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">Aureus</span>
            <span className="ml-1.5 text-[9px] font-medium text-accent bg-accent/10 px-1.5 py-0.5 rounded">PRO</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all",
                  isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {item.href === "/advisor" && (
                  <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-[9px] font-bold text-accent">
                    3
                  </span>
                )}
              </Link>
            )
          })}
        </div>
        
        <div className="mt-6 pt-4 border-t border-border">
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Live Prices</p>
          <div className="space-y-1">
            {liveData.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-secondary/60 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-secondary text-[9px] font-semibold text-foreground">
                    {item.symbol.charAt(0)}
                  </div>
                  <span className="text-[12px] font-medium text-foreground">{item.symbol}</span>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium text-foreground tabular-nums">{item.price}</p>
                  <div className={cn(
                    "flex items-center justify-end gap-0.5 text-[9px] font-medium",
                    item.positive ? "text-success" : "text-destructive"
                  )}>
                    {item.positive ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {item.positive ? "+" : ""}{item.change}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border">
          <p className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
          <div className="space-y-0.5">
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Bell className="h-3.5 w-3.5" />
              <span>Notifications</span>
              <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-white px-1">
                5
              </span>
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Keyboard className="h-3.5 w-3.5" />
              <span>Shortcuts</span>
              <span className="ml-auto text-[10px] text-muted-foreground/60">⌘K</span>
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[12px] text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Help Center</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 hover:bg-secondary/60 transition-colors">
          <div className="relative">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
              <span className="text-[11px] font-semibold text-foreground">JD</span>
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-card" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate">John Doe</p>
            <p className="text-[10px] text-muted-foreground truncate">john@example.com</p>
          </div>
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md lg:hidden safe-area-inset-bottom">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-4 py-1.5 text-[10px] font-medium transition-colors relative",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-foreground")} />
              <span>{item.label}</span>
              {isActive && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-foreground" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

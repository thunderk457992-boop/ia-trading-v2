"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, TrendingUp, RefreshCw, Brain, Zap, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

type NotifType = "market_weekly" | "portfolio_drift" | "analysis_ready" | "upgrade" | "system"

interface Notification {
  id: string
  type: NotifType
  title: string
  message: string
  href: string | null
  read_at: string | null
  created_at: string
}

const TYPE_ICON: Record<NotifType, React.ReactNode> = {
  market_weekly:  <TrendingUp className="h-3.5 w-3.5" />,
  portfolio_drift: <RefreshCw className="h-3.5 w-3.5" />,
  analysis_ready: <Brain className="h-3.5 w-3.5" />,
  upgrade:        <Zap className="h-3.5 w-3.5" />,
  system:         <Info className="h-3.5 w-3.5" />,
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `il y a ${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `il y a ${hours}h`
  const days = Math.floor(hours / 24)
  return `il y a ${days}j`
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const load = async () => {
    setLoading(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("notifications")
      .select("id, type, title, message, href, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
    setNotifications((data as Notification[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  const markAllRead = async () => {
    if (!notifications.some((n) => !n.read_at)) return
    const supabase = createClient()
    const ids = notifications.filter((n) => !n.read_at).map((n) => n.id)
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", ids)
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleOpen = () => {
    setOpen((v) => !v)
    if (!open && unreadCount > 0) {
      setTimeout(markAllRead, 1200)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[9px] font-bold text-background">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h3 className="text-[13px] font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <CheckCheck className="h-3 w-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-[13px] text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const content = (
                  <div className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-secondary/50",
                    !notif.read_at && "bg-secondary/30"
                  )}>
                    <div className={cn(
                      "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border",
                      notif.read_at ? "border-border bg-secondary text-muted-foreground" : "border-foreground/20 bg-foreground/5 text-foreground"
                    )}>
                      {TYPE_ICON[notif.type as NotifType] ?? TYPE_ICON.system}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("text-[13px] font-medium", notif.read_at ? "text-muted-foreground" : "text-foreground")}>
                          {notif.title}
                        </p>
                        {!notif.read_at && (
                          <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-foreground" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[12px] leading-5 text-muted-foreground">{notif.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/60">{timeAgo(notif.created_at)}</p>
                    </div>
                  </div>
                )

                return notif.href ? (
                  <Link key={notif.id} href={notif.href} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

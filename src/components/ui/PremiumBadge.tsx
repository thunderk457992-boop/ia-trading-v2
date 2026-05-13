import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "dark"
type BadgeSize = "xs" | "sm"

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-border bg-secondary text-muted-foreground",
  accent: "border-amber-200 bg-amber-50 text-amber-800",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-orange-200 bg-orange-50 text-orange-700",
  danger: "border-rose-200 bg-rose-50 text-rose-700",
  dark: "border-foreground bg-foreground text-background",
}

const SIZE_CLASSES: Record<BadgeSize, string> = {
  xs: "px-2.5 py-1 text-[10px]",
  sm: "px-3 py-1.5 text-[11px]",
}

export function PremiumBadge({
  children,
  tone = "neutral",
  size = "xs",
  className,
}: {
  children: ReactNode
  tone?: BadgeTone
  size?: BadgeSize
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-[0.16em]",
        TONE_CLASSES[tone],
        SIZE_CLASSES[size],
        className,
      )}
    >
      {children}
    </span>
  )
}

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "dark"
type BadgeSize = "xs" | "sm"

const TONE_CLASSES: Record<BadgeTone, string> = {
  neutral: "border-border bg-secondary text-muted-foreground",
  accent: "border-accent/40 bg-accent/10 text-foreground",
  success: "border-success/30 bg-success/10 text-success",
  warning: "border-warning/30 bg-warning/10 text-warning",
  danger: "border-destructive/30 bg-destructive/10 text-destructive",
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

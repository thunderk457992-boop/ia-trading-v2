import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  hint,
  icon,
  badge,
  className,
  valueClassName,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  badge?: ReactNode
  className?: string
  valueClassName?: string
}) {
  return (
    <div className={cn("surface-card p-4 sm:p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl border border-border bg-secondary text-foreground">
                {icon}
              </div>
            ) : null}
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
          </div>
          <div className={cn("mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-[2rem]", valueClassName)}>
            {value}
          </div>
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>
      {hint ? <p className="mt-3 text-sm leading-6 text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

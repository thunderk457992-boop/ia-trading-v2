import { cn } from "@/lib/utils"

export function AxiomGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M3 13L8 3L13 13"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 9.4H10.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function AxiomMark({
  className,
  glyphClassName,
}: {
  className?: string
  glyphClassName?: string
}) {
  return (
    <div
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-xl bg-foreground text-background shadow-card-xs",
        className
      )}
    >
      <AxiomGlyph className={cn("h-4 w-4", glyphClassName)} />
    </div>
  )
}

export function AxiomLogo({
  className,
  nameClassName,
  markClassName,
  glyphClassName,
  badgeClassName,
  showBadge = true,
}: {
  className?: string
  nameClassName?: string
  markClassName?: string
  glyphClassName?: string
  badgeClassName?: string
  showBadge?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <AxiomMark className={markClassName} glyphClassName={glyphClassName} />
      <span className={cn("text-lg font-black tracking-tight text-foreground", nameClassName)}>
        Axiom
      </span>
      {showBadge ? (
        <span
          className={cn(
            "rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground",
            badgeClassName
          )}
        >
          AI
        </span>
      ) : null}
    </div>
  )
}

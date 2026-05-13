import type { LucideIcon } from "lucide-react"

interface TrustBarItem {
  icon: LucideIcon
  text: string
}

export function TrustBar({ items }: { items: TrustBarItem[] }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(({ icon: Icon, text }) => (
        <div key={text} className="surface-soft flex items-center gap-3 px-4 py-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-border bg-background">
            <Icon className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-sm leading-6 text-muted-foreground">{text}</span>
        </div>
      ))}
    </div>
  )
}

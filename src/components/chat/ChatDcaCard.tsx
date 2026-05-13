"use client"

import { Repeat } from "lucide-react"

export interface DcaBreakdown {
  symbol: string
  amount: number
}

export interface DcaPlan {
  total: number
  frequency: "daily" | "weekly" | "biweekly" | "monthly"
  breakdown: DcaBreakdown[]
  note?: string
}

const FREQUENCY_LABELS: Record<DcaPlan["frequency"], { label: string; sub: string }> = {
  daily:    { label: "Chaque jour",          sub: "~30× par mois" },
  weekly:   { label: "Chaque semaine",       sub: "4× par mois" },
  biweekly: { label: "Toutes les 2 semaines", sub: "2× par mois" },
  monthly:  { label: "Chaque mois",          sub: "1× par mois" },
}

const DOT_COLORS: Record<string, string> = {
  BTC: "bg-amber-400", ETH: "bg-blue-500", SOL: "bg-violet-500",
  BNB: "bg-yellow-400", XRP: "bg-sky-500", ADA: "bg-indigo-400",
  AVAX: "bg-rose-500", DOT: "bg-pink-500", LINK: "bg-blue-600",
}

function dotColor(symbol: string) {
  return DOT_COLORS[symbol.toUpperCase()] ?? "bg-foreground"
}

export function ChatDcaCard({ plan }: { plan: DcaPlan }) {
  const freq = FREQUENCY_LABELS[plan.frequency] ?? { label: plan.frequency, sub: "" }

  return (
    <div className="surface-card mt-3 overflow-hidden">
      {/* Header */}
      <div className="border-b border-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ton plan DCA
        </p>
      </div>

      <div className="p-4">
        {/* Frequency block */}
        <div className="surface-soft mb-4 flex items-center gap-3 px-4 py-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-border bg-background">
            <Repeat className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-base font-bold text-foreground">{plan.total}€ {freq.label.toLowerCase()}</p>
            <p className="text-xs text-muted-foreground">{freq.sub}</p>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex flex-col gap-2">
          {plan.breakdown.map((item) => (
            <div
              key={item.symbol}
              className="flex items-center justify-between rounded-xl border border-border bg-background px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-full ${dotColor(item.symbol)}`} />
                <span className="text-sm font-semibold text-foreground">{item.symbol}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-sm font-bold text-foreground">{item.amount}€</span>
                <span className="text-xs text-muted-foreground">
                  / {FREQUENCY_LABELS[plan.frequency]?.label.split(" ")[0].toLowerCase() ?? "période"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Note */}
        {plan.note && (
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{plan.note}</p>
        )}
      </div>
    </div>
  )
}

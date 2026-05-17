"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PortfolioAsset {
  symbol: string
  pct: number
  role: string
  why?: string
}

export interface PortfolioPlan {
  assets: PortfolioAsset[]
  avoid?: string[]
  profile?: string
}

const ASSET_PALETTE: Record<string, { bg: string; text: string; bar: string; dot: string }> = {
  BTC:  { bg: "bg-background", text: "text-foreground", bar: "bg-amber-400", dot: "bg-amber-400" },
  ETH:  { bg: "bg-background", text: "text-foreground", bar: "bg-blue-500", dot: "bg-blue-500" },
  SOL:  { bg: "bg-background", text: "text-foreground", bar: "bg-violet-500", dot: "bg-violet-500" },
  BNB:  { bg: "bg-background", text: "text-foreground", bar: "bg-yellow-400", dot: "bg-yellow-400" },
  XRP:  { bg: "bg-background", text: "text-foreground", bar: "bg-sky-500", dot: "bg-sky-500" },
  ADA:  { bg: "bg-background", text: "text-foreground", bar: "bg-indigo-400", dot: "bg-indigo-400" },
  AVAX: { bg: "bg-background", text: "text-foreground", bar: "bg-rose-500", dot: "bg-rose-500" },
  DOT:  { bg: "bg-background", text: "text-foreground", bar: "bg-pink-500", dot: "bg-pink-500" },
  LINK: { bg: "bg-background", text: "text-foreground", bar: "bg-blue-600", dot: "bg-blue-600" },
  MATIC:{ bg: "bg-background", text: "text-foreground", bar: "bg-violet-600", dot: "bg-violet-600" },
  POL:  { bg: "bg-background", text: "text-foreground", bar: "bg-violet-600", dot: "bg-violet-600" },
  DOGE: { bg: "bg-background", text: "text-foreground", bar: "bg-amber-500", dot: "bg-amber-500" },
  TON:  { bg: "bg-background", text: "text-foreground", bar: "bg-sky-400", dot: "bg-sky-400" },
  USDC: { bg: "bg-background", text: "text-foreground", bar: "bg-success", dot: "bg-success" },
  USDT: { bg: "bg-background", text: "text-foreground", bar: "bg-green-500", dot: "bg-green-500" },
}

function getPalette(symbol: string) {
  return ASSET_PALETTE[symbol.toUpperCase()] ?? {
    bg: "bg-secondary", text: "text-foreground", bar: "bg-foreground", dot: "bg-foreground",
  }
}

function AssetRow({ asset }: { asset: PortfolioAsset }) {
  const [open, setOpen] = useState(false)
  const p = getPalette(asset.symbol)

  return (
    <div className={cn("rounded-2xl border border-border px-4 py-3 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]", p.bg)}>
      <div className="flex items-center gap-3">
        {/* Icon */}
          <div className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white shadow-sm",
            p.dot
          )}>
          {asset.symbol.slice(0, 2)}
        </div>

        {/* Name + role */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-sm font-bold", p.text)}>{asset.symbol}</span>
            <span className="text-xs text-muted-foreground">{asset.role}</span>
          </div>
          {/* Progress bar */}
          <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-black/8">
            <div
              className={cn("h-full rounded-full", p.bar)}
              style={{ width: `${asset.pct}%` }}
            />
          </div>
        </div>

        {/* Percentage */}
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-xl font-black tabular-nums", p.text)}>{asset.pct}%</span>
          {asset.why && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Masquer l'explication" : "Voir pourquoi"}
              className="flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground transition hover:bg-secondary active:scale-95"
            >
              Pourquoi ?
              {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable explanation */}
      {open && asset.why && (
        <p className={cn("mt-2.5 text-xs leading-relaxed text-muted-foreground")}>
          {asset.why}
        </p>
      )}
    </div>
  )
}

export function ChatPortfolioCard({ plan }: { plan: PortfolioPlan }) {
  return (
    <div className="surface-card mt-3 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Ton plan
        </p>
        {plan.profile && (
          <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {plan.profile}
          </span>
        )}
      </div>

      {/* Asset rows */}
        <div className="flex flex-col gap-2 p-3">
          {plan.assets.map((asset) => (
            <AssetRow key={asset.symbol} asset={asset} />
          ))}
        </div>

      {/* Avoid section */}
      {plan.avoid && plan.avoid.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <div className="mb-2 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              À éviter pour l&apos;instant
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {plan.avoid.map((item) => (
              <span
                key={item}
                className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

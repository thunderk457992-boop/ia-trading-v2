"use client"

import Link from "next/link"
import { ArrowRight, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CryptoPrice } from "@/lib/coingecko"

interface AllocationItem {
  symbol: string
  percentage: number
}

interface PortfolioDriftCardProps {
  targetAllocation: AllocationItem[]
  cryptoPrices: CryptoPrice[]
}

const ASSET_COLOR: Record<string, string> = {
  BTC: "bg-amber-500", ETH: "bg-blue-500", SOL: "bg-purple-500",
  BNB: "bg-yellow-500", XRP: "bg-sky-500", ADA: "bg-blue-600",
  AVAX: "bg-red-500", DOT: "bg-pink-500", LINK: "bg-blue-700",
  NEAR: "bg-green-500", MATIC: "bg-violet-500", POL: "bg-violet-500",
}

function estimateCurrentWeights(
  target: AllocationItem[],
  prices: CryptoPrice[]
): { symbol: string; target: number; estimated: number; drift: number }[] {
  const priceMap = new Map(prices.map((p) => [p.symbol, p]))

  const weighted = target.map((item) => {
    const price = priceMap.get(item.symbol)
    const change7d = price?.change7d ?? 0
    const growthFactor = 1 + change7d / 100
    return { symbol: item.symbol, target: item.percentage, rawValue: item.percentage * growthFactor }
  })

  const totalRaw = weighted.reduce((s, w) => s + w.rawValue, 0)

  return weighted.map((w) => {
    const estimated = totalRaw > 0 ? (w.rawValue / totalRaw) * 100 : w.target
    const drift = estimated - w.target
    return { symbol: w.symbol, target: w.target, estimated, drift }
  })
}

function getMaxAbsDrift(drifts: { drift: number }[]): number {
  return Math.max(...drifts.map((d) => Math.abs(d.drift)))
}

export function PortfolioDriftCard({ targetAllocation, cryptoPrices }: PortfolioDriftCardProps) {
  if (!targetAllocation.length) return null

  const top5 = targetAllocation.slice(0, 5)
  const drifts = estimateCurrentWeights(top5, cryptoPrices)
  const maxDrift = getMaxAbsDrift(drifts)
  const hasDrift = maxDrift >= 2.5

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-1">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Allocation</p>
          <h3 className="mt-0.5 text-[15px] font-semibold text-foreground">Drift du portefeuille</h3>
        </div>
        <RefreshCw className="h-4 w-4 text-muted-foreground" />
      </div>

      <p className="mb-4 text-[13px] leading-6 text-muted-foreground">
        {hasDrift
          ? `Votre portefeuille s'est éloigné de l'allocation cible (jusqu'à ${maxDrift.toFixed(1)} pts). Une mise à jour peut être pertinente.`
          : "Votre portefeuille reste proche de l'allocation cible. Aucun rééquilibrage urgent."}
      </p>

      <div className="space-y-3">
        {drifts.map((item) => {
          const barColor = ASSET_COLOR[item.symbol] ?? "bg-slate-400"
          const driftSign = item.drift >= 0 ? "+" : ""
          const driftColor = Math.abs(item.drift) >= 3
            ? item.drift > 0 ? "text-success" : "text-destructive"
            : "text-muted-foreground"

          return (
            <div key={item.symbol}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[12px] font-semibold text-foreground">{item.symbol}</span>
                <div className="flex items-center gap-3 text-[12px]">
                  <span className="text-muted-foreground tabular-nums">{item.target.toFixed(0)}% cible</span>
                  <span className="font-medium text-foreground tabular-nums">{item.estimated.toFixed(1)}% est.</span>
                  <span className={cn("font-semibold tabular-nums", driftColor)}>
                    {driftSign}{item.drift.toFixed(1)} pts
                  </span>
                </div>
              </div>
              <div className="relative h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", barColor)}
                  style={{ width: `${Math.min(100, item.estimated)}%` }}
                />
                <div
                  className="absolute top-0 h-full w-0.5 bg-foreground/40 rounded-full"
                  style={{ left: `${Math.min(100, item.target)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-3 text-[11px] text-muted-foreground">
        Estimation basée sur les variations 7j de chaque actif. Barre verticale = allocation cible.
      </p>

      {hasDrift && (
        <div className="mt-4">
          <Link
            href="/advisor"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Rééquilibrer mon allocation
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

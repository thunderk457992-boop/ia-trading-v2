"use client"

import { useState } from "react"
import { Activity, CalendarClock } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketSeriesPoint } from "@/lib/coingecko"

interface PortfolioSnapshotInput {
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
}

interface SinceAnalysisCardProps {
  lastAnalysisDate: string | null
  portfolioSnapshots: PortfolioSnapshotInput[]
  btcSeries: MarketSeriesPoint[]
  ethSeries: MarketSeriesPoint[]
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizeSnapshots(snapshots: PortfolioSnapshotInput[]) {
  return snapshots
    .map((snapshot) => {
      const timestamp = Date.parse(snapshot.created_at)
      const portfolioValue = parseFiniteNumber(snapshot.portfolio_value)
      const investedAmount = parseFiniteNumber(snapshot.invested_amount)
      if (!Number.isFinite(timestamp) || portfolioValue === null || portfolioValue <= 0) return null
      return { timestamp, portfolioValue, investedAmount }
    })
    .filter((snapshot): snapshot is { timestamp: number; portfolioValue: number; investedAmount: number | null } => snapshot !== null)
    .sort((left, right) => left.timestamp - right.timestamp)
}

function getPortfolioChangeSince(analysisTimestamp: number, snapshots: PortfolioSnapshotInput[]) {
  const filtered = normalizeSnapshots(snapshots).filter((snapshot) => snapshot.timestamp >= analysisTimestamp)
  if (filtered.length < 2) return null
  const baseline = filtered[0]
  const baselineInvested = baseline.investedAmount ?? 0
  const latest = filtered[filtered.length - 1]
  const adjustedDelta = latest.portfolioValue
    - baseline.portfolioValue
    - ((latest.investedAmount ?? baselineInvested) - baselineInvested)
  return { euro: adjustedDelta, percent: (adjustedDelta / baseline.portfolioValue) * 100 }
}

function getSeriesChangeSince(analysisTimestamp: number, series: MarketSeriesPoint[]) {
  if (!series.length) return null
  const start = series.find((point) => point.timestamp >= analysisTimestamp)
  const latest = series[series.length - 1]
  if (!start || latest.timestamp <= start.timestamp) return null
  return ((latest.price - start.price) / start.price) * 100
}

function formatPercent(value: number | null): { text: string; positive: boolean | null } {
  if (value === null || !Number.isFinite(value)) return { text: "Insuffisant", positive: null }
  return {
    text: `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`,
    positive: value >= 0,
  }
}

function formatEuro(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return ""
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: Math.abs(value) >= 100 ? 0 : 2,
  })
}

function formatAnalysisDate(value: string) {
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  })
}

export function SinceAnalysisCard({ lastAnalysisDate, portfolioSnapshots, btcSeries, ethSeries }: SinceAnalysisCardProps) {
  const [renderedAt] = useState(() => Date.now())

  if (!lastAnalysisDate) {
    return (
      <div className="surface-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="eyebrow">Depuis ton analyse</p>
            <h3 className="text-[15px] font-semibold text-foreground">Aucune analyse récente</h3>
          </div>
        </div>
        <p className="text-[13px] leading-6 text-muted-foreground">
          Lance une première analyse pour commencer à comparer ton plan avec l&apos;évolution du marché.
        </p>
      </div>
    )
  }

  const analysisTimestamp = Date.parse(lastAnalysisDate)
  const portfolioChange = getPortfolioChangeSince(analysisTimestamp, portfolioSnapshots)
  const btcChange = getSeriesChangeSince(analysisTimestamp, btcSeries)
  const ethChange = getSeriesChangeSince(analysisTimestamp, ethSeries)
  const marketProxy = btcChange !== null && ethChange !== null ? (btcChange + ethChange) / 2 : null
  const hoursSinceAnalysis = Math.max(0, Math.round((renderedAt - analysisTimestamp) / (60 * 60 * 1000)))

  const message = hoursSinceAnalysis < 24
    ? "Ton plan est encore récent. Il est trop tôt pour juger la qualité de l'allocation sur quelques heures."
    : marketProxy !== null && Math.abs(marketProxy) >= 4
    ? "Le marché a déjà bougé depuis ton analyse. Relis le plan avant de le modifier trop vite."
    : "Le contexte a peu changé depuis ton analyse. La discipline compte plus qu'un ajustement précipité."

  const portfolioFmt = formatPercent(portfolioChange?.percent ?? null)
  const btcFmt = formatPercent(btcChange)
  const ethFmt = formatPercent(ethChange)
  const marketFmt = formatPercent(marketProxy)

  const metrics = [
    {
      label: "Portefeuille",
      main: portfolioFmt,
      sub: portfolioChange ? formatEuro(portfolioChange.euro) : null,
    },
    { label: "BTC depuis analyse", main: btcFmt, sub: null },
    { label: "ETH depuis analyse", main: ethFmt, sub: null },
    { label: "Proxy large cap", main: marketFmt, sub: "BTC + ETH" },
  ]

  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="eyebrow">Depuis ton analyse</p>
          <h3 className="text-[15px] font-semibold text-foreground">{formatAnalysisDate(lastAnalysisDate)}</h3>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, main, sub }) => (
          <div key={label} className="surface-soft px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
            <p className={cn(
              "mt-1 text-sm font-semibold",
              main.positive === null ? "text-muted-foreground" :
              main.positive ? "text-success" : "text-destructive"
            )}>
              {main.text}
            </p>
            {sub && <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="mt-3 rounded-xl border border-border bg-secondary/40 px-3.5 py-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          <p className="text-[12px] font-semibold text-foreground">Lecture rapide</p>
        </div>
        <p className="text-[12px] leading-6 text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

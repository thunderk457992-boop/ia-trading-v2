"use client"

import { useState } from "react"
import { Activity, CalendarClock } from "lucide-react"
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

  return {
    euro: adjustedDelta,
    percent: (adjustedDelta / baseline.portfolioValue) * 100,
  }
}

function getSeriesChangeSince(analysisTimestamp: number, series: MarketSeriesPoint[]) {
  if (!series.length) return null

  const start = series.find((point) => point.timestamp >= analysisTimestamp)
  const latest = series[series.length - 1]

  if (!start || latest.timestamp <= start.timestamp) return null

  return ((latest.price - start.price) / start.price) * 100
}

function formatPercent(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Indisponible"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function formatEuro(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "Indisponible"
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

export function SinceAnalysisCard({
  lastAnalysisDate,
  portfolioSnapshots,
  btcSeries,
  ethSeries,
}: SinceAnalysisCardProps) {
  const [renderedAt] = useState(() => Date.now())

  if (!lastAnalysisDate) {
    return (
      <div className="surface-card p-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-slate-500" />
          <div>
            <p className="eyebrow">Depuis ton analyse</p>
            <h3 className="text-[15px] font-semibold text-slate-950">Aucune analyse recente</h3>
          </div>
        </div>
        <p className="mt-3 text-[13px] leading-6 text-slate-600">
          Lance une premiere analyse pour commencer a comparer ton plan avec l&apos;evolution du marche.
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
    ? "Ton plan est encore recent. Il est trop tot pour juger la qualite de l'allocation sur quelques heures."
    : marketProxy !== null && Math.abs(marketProxy) >= 4
    ? "Le marche a deja bouge depuis ton analyse. Relis le plan avant de le modifier trop vite."
    : "Le contexte a peu change depuis ton analyse. La discipline compte plus qu'un ajustement precipite."

  return (
    <div className="surface-card p-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-slate-500" />
        <div>
          <p className="eyebrow">Depuis ton analyse</p>
          <h3 className="text-[15px] font-semibold text-slate-950">{formatAnalysisDate(lastAnalysisDate)}</h3>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Portefeuille</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(portfolioChange?.percent ?? null)}</p>
          <p className="mt-1 text-[11px] text-slate-500">{formatEuro(portfolioChange?.euro ?? null)}</p>
        </div>
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">BTC depuis analyse</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(btcChange)}</p>
        </div>
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">ETH depuis analyse</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(ethChange)}</p>
        </div>
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Barometre marche</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{formatPercent(marketProxy)}</p>
          <p className="mt-1 text-[11px] text-slate-500">Proxy large cap BTC + ETH</p>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background px-3.5 py-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />
          <p className="text-[12px] font-semibold text-slate-900">Lecture rapide</p>
        </div>
        <p className="mt-2 text-[12px] leading-6 text-slate-600">{message}</p>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Activity,
  ArrowRight,
  Clock3,
  Info,
  Radar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CryptoPrice, MarketSeriesPoint } from "@/lib/coingecko"
import {
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

const DISPLAY_LOCALE = "fr-FR"
const DISPLAY_TIME_ZONE = "Europe/Paris"
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const ZONE_DISCLAIMER = "Zone indicative basée sur le profil et les données actuelles, pas une garantie de marché."
const FALLBACK_EXPLANATION = "Ce graphique utilise vos snapshots réels quand disponibles. Sinon, il affiche les données marché disponibles."

const CHART_PERIODS = [
  { id: "24H", label: "24h", windowMs: DAY_MS },
  { id: "7D", label: "7j", windowMs: 7 * DAY_MS },
  { id: "30D", label: "30j", windowMs: 30 * DAY_MS },
  { id: "90D", label: "90j", windowMs: 90 * DAY_MS },
  { id: "ALL", label: "All", windowMs: null },
] as const

type ChartPeriod = typeof CHART_PERIODS[number]["id"]
type ChartMode = "portfolio" | "market"

interface PortfolioSnapshotInput {
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
}

interface ProfessionalMarketChartProps {
  portfolioSnapshots: PortfolioSnapshotInput[]
  marketReferenceAsset: CryptoPrice | null
  marketSeriesShort: MarketSeriesPoint[]
  marketSeriesAll: MarketSeriesPoint[]
  capital: number
  lastSnapshotLabel: string | null
  marketUpdatedLabel: string | null
}

interface NormalizedPortfolioSnapshot {
  timestamp: number
  portfolioValue: number
  investedAmount: number | null
}

interface BaseChartPoint {
  timestamp: number
  value: number
  volume: number | null
  performance: number
  valueChange: number
}

interface RenderChartPoint {
  timestamp: number
  value: number | null
  scenario: number | null
  volume: number | null
  performance: number
  valueChange: number
  sourceLabel: string
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizePortfolioSnapshots(snapshots: PortfolioSnapshotInput[]): NormalizedPortfolioSnapshot[] {
  return snapshots
    .map((snapshot) => {
      const timestamp = Date.parse(snapshot.created_at)
      const portfolioValue = parseFiniteNumber(snapshot.portfolio_value)
      const investedAmount = parseFiniteNumber(snapshot.invested_amount)

      if (!Number.isFinite(timestamp) || portfolioValue === null || portfolioValue <= 0) {
        return null
      }

      return {
        timestamp,
        portfolioValue,
        investedAmount,
      }
    })
    .filter((snapshot): snapshot is NormalizedPortfolioSnapshot => snapshot !== null)
    .sort((left, right) => left.timestamp - right.timestamp)
}

function filterPortfolioSnapshots(
  snapshots: NormalizedPortfolioSnapshot[],
  period: ChartPeriod,
  anchorMs: number
) {
  const windowMs = CHART_PERIODS.find((candidate) => candidate.id === period)?.windowMs
  if (period === "24H") {
    return snapshots.filter((snapshot) => snapshot.timestamp >= anchorMs - (2 * DAY_MS) && snapshot.timestamp <= anchorMs)
  }
  if (windowMs === null || windowMs === undefined) return snapshots
  return snapshots.filter((snapshot) => snapshot.timestamp >= anchorMs - windowMs && snapshot.timestamp <= anchorMs)
}

function getCoverageMs(points: Array<{ timestamp: number }>) {
  if (points.length < 2) return 0
  return Math.max(0, points[points.length - 1].timestamp - points[0].timestamp)
}

function isPortfolioPeriodAvailable(
  snapshots: NormalizedPortfolioSnapshot[],
  period: ChartPeriod,
  anchorMs: number
) {
  if (period === "ALL") return snapshots.length >= 2

  const filtered = filterPortfolioSnapshots(snapshots, period, anchorMs)
  if (filtered.length < 2) return false

  const coverage = getCoverageMs(filtered)
  if (period === "7D") return coverage >= 2 * DAY_MS
  if (period === "30D") return coverage >= 21 * DAY_MS
  if (period === "90D") return coverage >= 60 * DAY_MS

  return true
}

function buildPortfolioSeries(
  snapshots: NormalizedPortfolioSnapshot[],
  period: ChartPeriod,
  anchorMs: number
) {
  const series = filterPortfolioSnapshots(snapshots, period, anchorMs)
  if (series.length < 2) return { points: [] as BaseChartPoint[], usesRecentWindow: false }

  const baseline = series[0]
  const baselineInvestedAmount = baseline.investedAmount ?? 0
  const exact24hSeries = period === "24H"
    ? snapshots.filter((snapshot) => snapshot.timestamp >= anchorMs - DAY_MS && snapshot.timestamp <= anchorMs)
    : []

  const points = series.map((snapshot) => {
    const adjustedDelta = snapshot.portfolioValue
      - baseline.portfolioValue
      - ((snapshot.investedAmount ?? baselineInvestedAmount) - baselineInvestedAmount)

    return {
      timestamp: snapshot.timestamp,
      value: snapshot.portfolioValue,
      volume: null,
      performance: Number(((adjustedDelta / baseline.portfolioValue) * 100).toFixed(3)),
      valueChange: Number(adjustedDelta.toFixed(2)),
    }
  })

  return {
    points,
    usesRecentWindow: period === "24H" && exact24hSeries.length < 2,
  }
}

function filterMarketSeries(
  series: MarketSeriesPoint[],
  period: ChartPeriod,
  anchorMs: number
) {
  const baseSeries = period === "ALL" ? series : series.filter((point) => {
    const windowMs = CHART_PERIODS.find((candidate) => candidate.id === period)?.windowMs
    if (!windowMs) return true
    return point.timestamp >= anchorMs - windowMs && point.timestamp <= anchorMs
  })

  if (baseSeries.length < 2) return [] as BaseChartPoint[]

  const baseline = baseSeries[0].price
  return baseSeries.map((point) => ({
    timestamp: point.timestamp,
    value: point.price,
    volume: point.volume,
    performance: Number((((point.price - baseline) / baseline) * 100).toFixed(3)),
    valueChange: Number((point.price - baseline).toFixed(4)),
  }))
}

function formatCurrency(value: number, currency: "EUR" | "USD") {
  const locale = currency === "EUR" ? DISPLAY_LOCALE : "en-US"
  return value.toLocaleString(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  })
}

function formatCompactCurrency(value: number, currency: "EUR" | "USD") {
  const locale = currency === "EUR" ? DISPLAY_LOCALE : "en-US"
  return value.toLocaleString(locale, {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  })
}

function formatVolume(value: number) {
  return value.toLocaleString("en-US", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
}

function getXAxisLabel(period: ChartPeriod, timestamp: number) {
  const date = new Date(timestamp)
  if (period === "24H") {
    return date.toLocaleTimeString(DISPLAY_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: DISPLAY_TIME_ZONE,
    })
  }

  if (period === "7D") {
    return date.toLocaleDateString(DISPLAY_LOCALE, {
      weekday: "short",
      day: "2-digit",
      timeZone: DISPLAY_TIME_ZONE,
    })
  }

  return date.toLocaleDateString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

function buildScenario(points: BaseChartPoint[]) {
  if (points.length < 4) return [] as Array<{ timestamp: number; value: number }>

  const tail = points.slice(-4)
  const stepMs = Math.max(
    HOUR_MS,
    Math.round(
      tail.slice(1).reduce((sum, point, index) => (
        sum + (point.timestamp - tail[index].timestamp)
      ), 0) / Math.max(1, tail.length - 1)
    )
  )
  const slope = tail.slice(1).reduce((sum, point, index) => (
    sum + (point.value - tail[index].value)
  ), 0) / Math.max(1, tail.length - 1)
  const lastPoint = tail[tail.length - 1]

  return Array.from({ length: 3 }, (_, index) => ({
    timestamp: lastPoint.timestamp + stepMs * (index + 1),
    value: Number((lastPoint.value + slope * (index + 1)).toFixed(4)),
  }))
}

function getVolatility(points: BaseChartPoint[]) {
  if (points.length < 2) return 0
  const changes = points.slice(1).map((point, index) => {
    const base = points[index].value
    return Math.abs(((point.value - base) / base) * 100)
  })
  return changes.reduce((sum, value) => sum + value, 0) / changes.length
}

function getTrend(points: BaseChartPoint[]) {
  if (points.length < 2) {
    return {
      label: "Neutre",
      tone: "text-muted-foreground",
      note: "Pas assez d'historique pour qualifier la tendance.",
    }
  }

  const first = points[0].value
  const last = points[points.length - 1].value
  const change = ((last - first) / first) * 100
  const recentSlice = points.slice(-Math.min(4, points.length))
  const recentSlope = recentSlice.length > 1
    ? (recentSlice[recentSlice.length - 1].value - recentSlice[0].value) / (recentSlice.length - 1)
    : 0
  const volatility = getVolatility(points)

  if (change >= 2 && recentSlope > 0 && volatility <= 8) {
    return {
      label: "Haussière",
      tone: "text-emerald-400",
      note: "La pente reste positive et la structure tient au-dessus de son plancher récent.",
    }
  }

  if (change <= -2 && recentSlope < 0) {
    return {
      label: "Baissière",
      tone: "text-rose-400",
      note: "Le flux glisse sous la zone médiane et la pression vendeuse domine encore.",
    }
  }

  return {
    label: "Neutre",
    tone: "text-amber-300",
    note: "Le marché consolide sans signal directionnel fort pour l'instant.",
  }
}

function getZoneBoundaries(support: number, resistance: number) {
  const range = Math.max(resistance - support, support * 0.02)
  const buyUpper = support + range * 0.33
  const neutralUpper = support + range * 0.66

  return {
    buy: { from: support, to: buyUpper },
    neutral: { from: buyUpper, to: neutralUpper },
    caution: { from: neutralUpper, to: resistance },
  }
}

function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

function ChartTooltip({
  active,
  payload,
  currency,
  mode,
}: {
  active?: boolean
  payload?: Array<{ payload: BaseChartPoint & { sourceLabel: string; scenario?: number | null } }>
  currency: "EUR" | "USD"
  mode: ChartMode
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point || !Number.isFinite(point.value)) return null

  return (
    <div className="min-w-[240px] rounded-2xl border border-white/10 bg-[#0a0d13]/95 px-4 py-3 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">{formatDateTime(point.timestamp)}</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/55">{mode === "portfolio" ? "Valeur portefeuille" : "Prix spot"}</span>
          <span className="text-[13px] font-semibold text-white">{formatCurrency(point.value, currency)}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/55">Variation période</span>
          <span className={cn("text-[12px] font-semibold", point.performance >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {point.performance >= 0 ? "+" : ""}
            {point.performance.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/55">{mode === "portfolio" ? "Variation €" : "Variation $"}</span>
          <span className={cn("text-[12px] font-semibold", point.valueChange >= 0 ? "text-emerald-400" : "text-rose-400")}>
            {point.valueChange >= 0 ? "+" : ""}
            {formatCurrency(Math.abs(point.valueChange), currency)}
          </span>
        </div>
        {point.volume !== null && Number.isFinite(point.volume) && point.volume > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-white/55">Volume</span>
            <span className="text-[12px] font-semibold text-white/90">{formatVolume(point.volume)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-white/55">Source</span>
          <span className="text-[11px] font-semibold text-white/90">{point.sourceLabel}</span>
        </div>
      </div>
    </div>
  )
}

export function ProfessionalMarketChart({
  portfolioSnapshots,
  marketReferenceAsset,
  marketSeriesShort,
  marketSeriesAll,
  capital,
  lastSnapshotLabel,
  marketUpdatedLabel,
}: ProfessionalMarketChartProps) {
  const [period, setPeriod] = useState<ChartPeriod>("7D")
  const [showDetails, setShowDetails] = useState(false)

  const normalizedPortfolioSnapshots = useMemo(
    () => normalizePortfolioSnapshots(portfolioSnapshots),
    [portfolioSnapshots]
  )
  const anchorMs = useMemo(() => (
    normalizedPortfolioSnapshots[normalizedPortfolioSnapshots.length - 1]?.timestamp
    ?? marketSeriesShort[marketSeriesShort.length - 1]?.timestamp
    ?? marketSeriesAll[marketSeriesAll.length - 1]?.timestamp
    ?? 0
  ), [marketSeriesAll, marketSeriesShort, normalizedPortfolioSnapshots])
  const availablePeriods = useMemo(() => {
    return CHART_PERIODS.filter((candidate) => {
      const portfolioOk = isPortfolioPeriodAvailable(normalizedPortfolioSnapshots, candidate.id, anchorMs)
      const marketBase = candidate.id === "ALL" ? marketSeriesAll : marketSeriesShort
      const marketOk = filterMarketSeries(marketBase, candidate.id, anchorMs).length >= 2
      return portfolioOk || marketOk
    }).map((candidate) => candidate.id)
  }, [anchorMs, marketSeriesAll, marketSeriesShort, normalizedPortfolioSnapshots])

  useEffect(() => {
    if (availablePeriods.includes(period)) return
    if (availablePeriods[0]) setPeriod(availablePeriods[0])
  }, [availablePeriods, period])

  const portfolioAvailable = isPortfolioPeriodAvailable(normalizedPortfolioSnapshots, period, anchorMs)
  const portfolioSeries = useMemo(
    () => buildPortfolioSeries(normalizedPortfolioSnapshots, period, anchorMs),
    [anchorMs, normalizedPortfolioSnapshots, period]
  )
  const marketBaseSeries = period === "ALL" ? marketSeriesAll : marketSeriesShort
  const marketSeries = useMemo(
    () => filterMarketSeries(marketBaseSeries, period, anchorMs),
    [anchorMs, marketBaseSeries, period]
  )
  const mode: ChartMode | null = portfolioAvailable && portfolioSeries.points.length >= 2
    ? "portfolio"
    : marketSeries.length >= 2
    ? "market"
    : null
  const activeSeries = useMemo(
    () => (mode === "portfolio" ? portfolioSeries.points : mode === "market" ? marketSeries : []),
    [marketSeries, mode, portfolioSeries.points]
  )
  const currency = mode === "portfolio" ? "EUR" : "USD"
  const sourceLabel = mode === "portfolio"
    ? "portfolio_history uniquement"
    : marketReferenceAsset?.source === "Kraken"
    ? "Prix spot Kraken + historique CoinGecko"
    : marketReferenceAsset?.source === "fallback"
    ? "CoinGecko fallback (historique + spot)"
    : "CoinGecko"

  const trend = useMemo(() => getTrend(activeSeries), [activeSeries])
  const support = activeSeries.length ? Math.min(...activeSeries.map((point) => point.value)) : null
  const resistance = activeSeries.length ? Math.max(...activeSeries.map((point) => point.value)) : null
  const currentPoint = activeSeries[activeSeries.length - 1] ?? null
  const scenario = useMemo(() => buildScenario(activeSeries), [activeSeries])
  const renderData = useMemo<RenderChartPoint[]>(() => {
    if (!activeSeries.length) return []

    const actualData = activeSeries.map((point) => ({
      timestamp: point.timestamp,
      value: point.value,
      scenario: null,
      volume: point.volume,
      performance: point.performance,
      valueChange: point.valueChange,
      sourceLabel,
    }))

    if (!scenario.length) return actualData

    return [
      ...actualData.map((point, index) => ({
        ...point,
        scenario: index === actualData.length - 1 ? point.value : null,
      })),
      ...scenario.map((point) => ({
        timestamp: point.timestamp,
        value: null,
        scenario: point.value,
        volume: null,
        performance: currentPoint?.performance ?? 0,
        valueChange: currentPoint?.valueChange ?? 0,
        sourceLabel: "Scénario possible",
      })),
    ]
  }, [activeSeries, currentPoint?.performance, currentPoint?.valueChange, scenario, sourceLabel])
  const hasVolume = activeSeries.some((point) => point.volume !== null && Number.isFinite(point.volume) && point.volume > 0)
  const periodChange = currentPoint?.performance ?? null
  const periodValueChange = currentPoint?.valueChange ?? null
  const yMin = support !== null && resistance !== null
    ? Math.max(0, support - (resistance - support || support * 0.04) * 0.18)
    : 0
  const yMax = support !== null && resistance !== null
    ? resistance + (resistance - support || resistance * 0.04) * 0.18
    : "auto"
  const zones = support !== null && resistance !== null ? getZoneBoundaries(support, resistance) : null
  const chartLabel = period === "24H" && portfolioSeries.usesRecentWindow && mode === "portfolio" ? "Récent" : CHART_PERIODS.find((candidate) => candidate.id === period)?.label ?? period
  const currentLabel = mode === "portfolio" ? "Valeur actuelle" : "Prix actuel"
  const detail24h = mode === "market" ? marketReferenceAsset?.change24h ?? null : null
  const detail7d = mode === "market" ? marketReferenceAsset?.change7d ?? null : null

  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.08),transparent_40%),linear-gradient(180deg,#0e1219_0%,#090c12_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="border-b border-white/8 px-5 py-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-200">
                {mode === "portfolio" ? "Historique réel" : mode === "market" ? "Prix marché" : "En attente"}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                {sourceLabel}
              </span>
              {marketUpdatedLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-white/50">
                  <Clock3 className="h-3 w-3" />
                  Dernière mise à jour {marketUpdatedLabel}
                </span>
              )}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/40">Graphique premium</p>
              <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                {mode === "portfolio"
                  ? "Performance portefeuille et structure de prix"
                  : marketReferenceAsset
                  ? `${marketReferenceAsset.symbol} · lecture marché`
                  : "Lecture marché"}
              </h2>
            </div>
            <p className="max-w-2xl text-[12px] leading-6 text-white/55">
              {FALLBACK_EXPLANATION}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 rounded-2xl border border-white/10 bg-white/5 p-1">
              {CHART_PERIODS.map((candidate) => {
                const selected = period === candidate.id
                const available = availablePeriods.includes(candidate.id)
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => {
                      if (available) setPeriod(candidate.id)
                    }}
                    disabled={!available}
                    title={available ? candidate.label : "Pas encore assez de données pour cette période."}
                    className={cn(
                      "rounded-xl px-3 py-2 text-[11px] font-semibold tracking-wide transition-all",
                      selected
                        ? "bg-white text-[#0b0d12] shadow-[0_10px_30px_rgba(255,255,255,0.12)]"
                        : available
                        ? "text-white/55 hover:bg-white/6 hover:text-white"
                        : "cursor-not-allowed text-white/25"
                    )}
                  >
                    {candidate.label}
                  </button>
                )
              })}
            </div>
            <button
              type="button"
              onClick={() => setShowDetails((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              Voir détails
              <ArrowRight className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-90")} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Tendance actuelle</p>
            <p className={cn("mt-2 text-lg font-semibold", trend.tone)} data-testid="market-chart-trend">
              {trend.label}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/50">{trend.note}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{currentLabel}</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {currentPoint ? formatCurrency(currentPoint.value, currency) : "—"}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/50">
              {periodChange !== null && periodValueChange !== null
                ? `${periodChange >= 0 ? "+" : ""}${periodChange.toFixed(2)}% sur ${chartLabel}`
                : "Pas assez de points pour lire la période."}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Support récent</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {support !== null ? formatCurrency(support, currency) : "—"}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/50">Plus bas récent sur la période sélectionnée.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Résistance récente</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {resistance !== null ? formatCurrency(resistance, currency) : "—"}
            </p>
            <p className="mt-1 text-[11px] leading-5 text-white/50">Plus haut récent, utile pour cadrer la zone de prudence.</p>
          </div>
        </div>
      </div>

      {activeSeries.length >= 2 ? (
        <>
          <div className="px-5 pt-5">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/8 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-200/70">Zone d&apos;achat potentielle</p>
                <p className="mt-2 text-[13px] font-semibold text-emerald-100">
                  {zones ? `${formatCurrency(zones.buy.from, currency)} → ${formatCurrency(zones.buy.to, currency)}` : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-amber-300/15 bg-amber-300/8 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-100/70">Zone neutre</p>
                <p className="mt-2 text-[13px] font-semibold text-amber-50">
                  {zones ? `${formatCurrency(zones.neutral.from, currency)} → ${formatCurrency(zones.neutral.to, currency)}` : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-rose-400/15 bg-rose-400/8 px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-100/70">Zone de prudence</p>
                <p className="mt-2 text-[13px] font-semibold text-rose-50">
                  {zones ? `${formatCurrency(zones.caution.from, currency)} → ${formatCurrency(zones.caution.to, currency)}` : "—"}
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] leading-5 text-white/45">{ZONE_DISCLAIMER}</p>
          </div>

          <div className="px-4 pb-4 pt-3">
            <div className="overflow-hidden rounded-[20px] border border-white/8 bg-[#07090e]/90 p-3">
              <div className="h-[340px] w-full" data-testid="professional-market-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={renderData} margin={{ top: 12, right: 18, bottom: 8, left: 4 }}>
                    {zones && (
                      <>
                        <ReferenceArea y1={zones.buy.from} y2={zones.buy.to} fill="#34d399" fillOpacity={0.08} />
                        <ReferenceArea y1={zones.neutral.from} y2={zones.neutral.to} fill="#f6c760" fillOpacity={0.07} />
                        <ReferenceArea y1={zones.caution.from} y2={zones.caution.to} fill="#fb7185" fillOpacity={0.07} />
                      </>
                    )}
                    <defs>
                      <linearGradient id="axiom-chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d4af37" stopOpacity={0.22} />
                        <stop offset="75%" stopColor="#d4af37" stopOpacity={0.04} />
                        <stop offset="100%" stopColor="#d4af37" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 8" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => getXAxisLabel(period, Number(value))}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      domain={[yMin, yMax]}
                      tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
                      tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      width={76}
                    />
                    {support !== null && (
                      <ReferenceLine
                        y={support}
                        stroke="rgba(52,211,153,0.55)"
                        strokeDasharray="4 6"
                        label={{ value: "Support", position: "insideBottomLeft", fill: "rgba(52,211,153,0.9)", fontSize: 11 }}
                      />
                    )}
                    {resistance !== null && (
                      <ReferenceLine
                        y={resistance}
                        stroke="rgba(251,113,133,0.55)"
                        strokeDasharray="4 6"
                        label={{ value: "Résistance", position: "insideTopLeft", fill: "rgba(251,113,133,0.9)", fontSize: 11 }}
                      />
                    )}
                    <RechartsTooltip content={<ChartTooltip currency={currency} mode={mode ?? "market"} />} cursor={{ stroke: "rgba(212,175,55,0.26)", strokeWidth: 1 }} />
                    <Area
                      type={activeSeries.length >= 5 ? "monotone" : "linear"}
                      dataKey="value"
                      stroke="#d4af37"
                      strokeWidth={2.4}
                      fill="url(#axiom-chart-fill)"
                      dot={activeSeries.length <= 3 ? { r: 2.5, fill: "#f6d37b", stroke: "#0b0d12", strokeWidth: 1 } : false}
                      activeDot={{ r: 4, fill: "#fff2c7", stroke: "#d4af37", strokeWidth: 2 }}
                      connectNulls={false}
                      isAnimationActive
                      animationDuration={900}
                    />
                    {scenario.length > 0 && (
                      <Line
                        type="monotone"
                        dataKey="scenario"
                        stroke="#f7e2a8"
                        strokeWidth={1.6}
                        strokeDasharray="6 6"
                        dot={false}
                        activeDot={false}
                        isAnimationActive
                        animationDuration={1000}
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {scenario.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/50">
                  <span className="inline-flex items-center gap-1.5">
                    <Radar className="h-3.5 w-3.5 text-amber-200/80" />
                    Scénario possible si la tendance continue.
                  </span>
                  <span className="text-white/25">·</span>
                  <span>Ligne pointillée, lecture indicative uniquement.</span>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-white/8 px-5 py-4">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="h-4 w-4 text-white/65" />
              <div>
                <p className="text-[11px] font-semibold text-white/80">Volume</p>
                <p className="text-[11px] text-white/45">
                  {hasVolume ? "Volume réel disponible pour cette période." : "Volume indisponible pour cette période."}
                </p>
              </div>
            </div>
            {hasVolume ? (
              <div className="h-28 w-full overflow-hidden rounded-2xl border border-white/8 bg-[#07090e]/90 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={renderData.filter((point) => point.value !== null)} margin={{ top: 6, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.05)" strokeDasharray="3 8" vertical={false} />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(value) => getXAxisLabel(period, Number(value))}
                      tick={{ fill: "rgba(255,255,255,0.34)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      tickFormatter={(value) => formatVolume(Number(value))}
                      tick={{ fill: "rgba(255,255,255,0.34)", fontSize: 10 }}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                    />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const point = payload[0]?.payload as RenderChartPoint | undefined
                        if (!point || point.volume === null) return null

                        return (
                          <div className="rounded-xl border border-white/10 bg-[#0a0d13]/95 px-3 py-2 shadow-xl backdrop-blur-xl">
                            <p className="text-[10px] uppercase tracking-[0.16em] text-white/45">{formatDateTime(point.timestamp)}</p>
                            <p className="mt-2 text-[12px] font-semibold text-white">{formatVolume(point.volume)} volume</p>
                          </div>
                        )
                      }}
                      cursor={{ fill: "rgba(255,255,255,0.04)" }}
                    />
                    <Bar dataKey="volume" fill="rgba(212,175,55,0.36)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-[12px] text-white/45">
                Volume indisponible pour cette période.
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="px-5 py-10">
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-8 text-center">
            <p className="text-sm font-semibold text-white">Pas encore assez de points pour ce graphique.</p>
            <p className="mt-2 text-[12px] leading-6 text-white/50">
              Les snapshots portefeuille prennent le relais dès qu&apos;ils deviennent suffisants. En attendant, Axiom conserve une lecture honnête plutôt que de fabriquer une courbe.
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-white/8 px-5 py-3 text-[11px] leading-5 text-white/45">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-white/70">État données réelles</span>
          <span className="text-white/25">·</span>
          <span>{mode === "portfolio" ? "Snapshots réels utilisateur" : "Prix spot réels + historique marché réel"}</span>
          {capital > 0 && mode === "portfolio" && (
            <>
              <span className="text-white/25">·</span>
              <span>Capital investi actuel : {formatCurrency(capital, "EUR")}</span>
            </>
          )}
          {lastSnapshotLabel && mode === "portfolio" && (
            <>
              <span className="text-white/25">·</span>
              <span>Dernier snapshot : {lastSnapshotLabel}</span>
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-white/8 bg-black/20 px-5 py-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Mode</p>
              <p className="mt-2 text-sm font-semibold text-white">{mode === "portfolio" ? "Performance réelle utilisateur" : "Lecture marché disponible"}</p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                {mode === "portfolio"
                  ? "La courbe suit vos snapshots cumulés, sans projection déguisée en performance."
                  : "Le portefeuille n&apos;a pas encore assez de snapshots sur cette période: la lecture se cale sur les prix marché disponibles."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Variations marché</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {mode === "market" && detail24h !== null && Number.isFinite(detail24h)
                  ? `${detail24h >= 0 ? "+" : ""}${detail24h.toFixed(2)}% / 24h`
                  : "Non applicable"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                {mode === "market" && detail7d !== null && Number.isFinite(detail7d)
                  ? `${detail7d >= 0 ? "+" : ""}${detail7d.toFixed(2)}% / 7j pour ${marketReferenceAsset?.symbol ?? "cet actif"}.`
                  : "Les snapshots portefeuille n'imitent pas un prix marché 24h/7j."}
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Lecture support/résistance</p>
              <p className="mt-2 text-sm font-semibold text-white">
                {support !== null && resistance !== null
                  ? `${formatCurrency(support, currency)} · ${formatCurrency(resistance, currency)}`
                  : "Indisponible"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                Support = plus bas récent. Résistance = plus haut récent sur la période choisie.
              </p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Source</p>
              <p className="mt-2 text-sm font-semibold text-white">{sourceLabel}</p>
              <p className="mt-1 text-[11px] leading-5 text-white/45">
                {mode === "portfolio"
                  ? "Aucune simulation cachée: seulement vos snapshots réels."
                  : "Le fallback marché ne remplace jamais la performance réelle, il occupe seulement l'espace de lecture."}
              </p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-start gap-2 rounded-2xl border border-amber-300/10 bg-amber-300/[0.06] px-4 py-3 text-[11px] leading-5 text-amber-100/75">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/80" />
            <span>{ZONE_DISCLAIMER}</span>
          </div>
        </div>
      )}
    </div>
  )
}

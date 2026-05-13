"use client"

import { useEffect, useMemo, useState } from "react"
import { Activity, ArrowRight, Info, Radar } from "lucide-react"
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
const DAY_MS = 24 * 60 * 60 * 1000
const HOUR_MS = 60 * 60 * 1000
const CHART_LINE = "#395b9a"
const CHART_FILL = "#6d8dcb"
const SUPPORT_COLOR = "#4f9c7b"
const RESISTANCE_COLOR = "#b46b74"
const MIN_POINTS_FOR_SIMPLE_CHART = 2
const MIN_POINTS_FOR_ADVANCED_LAYERS = 5
const MIN_POINTS_FOR_SCENARIO = 7
const PERIODS = [
  { id: "24H", label: "24h", windowMs: DAY_MS },
  { id: "7D", label: "7j", windowMs: 7 * DAY_MS },
  { id: "30D", label: "30j", windowMs: 30 * DAY_MS },
  { id: "90D", label: "90j", windowMs: 90 * DAY_MS },
  { id: "ALL", label: "All", windowMs: null },
] as const
const ZONE_DISCLAIMER = "Zone indicative basee sur le profil et les donnees actuelles, pas une garantie de marche."
const CHART_EXPLANATION =
  "Ce graphique utilise vos snapshots reels quand disponibles. Sinon, il affiche les donnees marche disponibles."
const CONSTRUCTION_TITLE = "Historique en construction"
const CONSTRUCTION_COPY =
  "Ton portefeuille commence a accumuler des donnees reelles. Les analyses de performance deviendront plus precises avec le temps."

type ChartPeriod = typeof PERIODS[number]["id"]
type ChartMode = "portfolio" | "market"
type CurrencyCode = "EUR" | "USD"

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
  performance: number | null
  valueChange: number | null
}

interface RenderChartPoint {
  timestamp: number
  value: number | null
  scenario: number | null
  volume: number | null
  performance: number | null
  valueChange: number | null
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

function formatCurrency(value: number, currency: CurrencyCode) {
  const locale = currency === "EUR" ? DISPLAY_LOCALE : "en-US"

  return value.toLocaleString(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 100 ? 0 : 2,
  })
}

function formatCompactCurrency(value: number, currency: CurrencyCode) {
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

function formatDateTime(timestamp: number) {
  return new Date(timestamp).toLocaleString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

function formatXAxis(period: ChartPeriod, timestamp: number) {
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

function formatHistoryAge(ageMs: number) {
  if (ageMs < DAY_MS) {
    const hours = Math.max(1, Math.round(ageMs / HOUR_MS))
    return `${hours}h de donnees reelles`
  }

  const days = Math.max(1, Math.round(ageMs / DAY_MS))
  return `${days}j de donnees reelles`
}

function buildHistoryStartLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

function buildTimelineLabel(startTimestamp: number, endTimestamp: number) {
  const start = new Date(startTimestamp)
  const end = new Date(endTimestamp)
  const sameDay =
    start.getUTCFullYear() === end.getUTCFullYear()
    && start.getUTCMonth() === end.getUTCMonth()
    && start.getUTCDate() === end.getUTCDate()

  const startLabel = start.toLocaleDateString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    timeZone: DISPLAY_TIME_ZONE,
  })

  if (sameDay) {
    return `${startLabel} -> aujourd'hui`
  }

  const endLabel = end.toLocaleDateString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    timeZone: DISPLAY_TIME_ZONE,
  })

  return `${startLabel} -> ${endLabel}`
}

function getCoverageMs(points: Array<{ timestamp: number }>) {
  if (points.length < 2) return 0
  return Math.max(0, points[points.length - 1].timestamp - points[0].timestamp)
}

function buildPortfolioSeries(
  snapshots: NormalizedPortfolioSnapshot[],
  period: ChartPeriod,
  anchorMs: number
) {
  if (!snapshots.length) {
    return {
      points: [] as BaseChartPoint[],
      partial24h: false,
      available: false,
      reason: "Aucune donnee portefeuille.",
    }
  }

  const firstTimestamp = snapshots[0].timestamp
  const historyAgeMs = Math.max(0, anchorMs - firstTimestamp)
  const periodWindow = PERIODS.find((candidate) => candidate.id === period)?.windowMs ?? null
  const partial24h = period === "24H" && historyAgeMs < DAY_MS
  const available =
    period === "ALL"
      ? true
      : period === "24H"
      ? true
      : period === "7D"
      ? historyAgeMs >= 7 * DAY_MS
      : period === "30D"
      ? historyAgeMs >= 30 * DAY_MS
      : historyAgeMs >= 90 * DAY_MS

  const reason = available
    ? ""
    : period === "7D"
    ? "Pas assez d'historique reel pour 7j."
    : period === "30D"
    ? "Pas assez d'historique reel pour 30j."
    : period === "90D"
    ? "Pas assez d'historique reel pour 90j."
    : "Aucune donnee portefeuille."

  const filtered =
    period === "ALL" || periodWindow === null
      ? snapshots
      : snapshots.filter((snapshot) => snapshot.timestamp >= anchorMs - periodWindow && snapshot.timestamp <= anchorMs)

  if (!filtered.length) {
    return { points: [] as BaseChartPoint[], partial24h, available, reason }
  }

  const baseline = filtered[0]
  const baselineInvestedAmount = baseline.investedAmount ?? 0
  const points = filtered.map((snapshot) => {
    const adjustedDelta =
      snapshot.portfolioValue -
      baseline.portfolioValue -
      ((snapshot.investedAmount ?? baselineInvestedAmount) - baselineInvestedAmount)

    return {
      timestamp: snapshot.timestamp,
      value: snapshot.portfolioValue,
      volume: null,
      performance: filtered.length >= 2 ? Number(((adjustedDelta / baseline.portfolioValue) * 100).toFixed(3)) : null,
      valueChange: filtered.length >= 2 ? Number(adjustedDelta.toFixed(2)) : null,
    }
  })

  return { points, partial24h, available, reason }
}

function buildMarketSeries(series: MarketSeriesPoint[], period: ChartPeriod, anchorMs: number) {
  if (!series.length) return [] as BaseChartPoint[]

  const periodWindow = PERIODS.find((candidate) => candidate.id === period)?.windowMs ?? null
  const filtered =
    period === "ALL" || periodWindow === null
      ? series
      : series.filter((point) => point.timestamp >= anchorMs - periodWindow && point.timestamp <= anchorMs)

  if (!filtered.length) return [] as BaseChartPoint[]

  const baseline = filtered[0].price
  return filtered.map((point) => ({
    timestamp: point.timestamp,
    value: point.price,
    volume: point.volume,
    performance: filtered.length >= 2 ? Number((((point.price - baseline) / baseline) * 100).toFixed(3)) : null,
    valueChange: filtered.length >= 2 ? Number((point.price - baseline).toFixed(4)) : null,
  }))
}

function getMarketPeriodAvailable(series: MarketSeriesPoint[], period: ChartPeriod, anchorMs: number) {
  const filtered = buildMarketSeries(series, period, anchorMs)
  if (!filtered.length) return false
  if (period === "ALL") return filtered.length >= 1

  const periodWindow = PERIODS.find((candidate) => candidate.id === period)?.windowMs ?? null
  if (periodWindow === null) return filtered.length >= 1

  return getCoverageMs(filtered) >= Math.min(periodWindow, 12 * HOUR_MS)
}

function buildScenario(points: BaseChartPoint[]) {
  if (points.length < 4) return [] as Array<{ timestamp: number; value: number }>

  const tail = points.slice(-4)
  const avgStep =
    tail.slice(1).reduce((sum, point, index) => sum + (point.timestamp - tail[index].timestamp), 0) / (tail.length - 1)
  const slope =
    tail.slice(1).reduce((sum, point, index) => sum + (point.value - tail[index].value), 0) / (tail.length - 1)
  const lastPoint = tail[tail.length - 1]
  const stepMs = Math.max(HOUR_MS, Math.round(avgStep))

  return Array.from({ length: 3 }, (_, index) => ({
    timestamp: lastPoint.timestamp + stepMs * (index + 1),
    value: Number((lastPoint.value + slope * (index + 1)).toFixed(4)),
  }))
}

function getVolatility(points: BaseChartPoint[]) {
  if (points.length < 2) return 0

  const changes = points.slice(1).map((point, index) => {
    const previous = points[index].value
    return Math.abs(((point.value - previous) / previous) * 100)
  })

  return changes.reduce((sum, value) => sum + value, 0) / changes.length
}

function getTrend(points: BaseChartPoint[]) {
  if (points.length < 2 || points[0].performance === null || points[points.length - 1].performance === null) {
    return {
      label: "Neutre",
      tone: "text-slate-500",
      note: "Pas assez d'historique pour qualifier une tendance fiable.",
    }
  }

  const first = points[0].value
  const last = points[points.length - 1].value
  const change = ((last - first) / first) * 100
  const recentSlice = points.slice(-Math.min(4, points.length))
  const recentSlope =
    recentSlice.length > 1
      ? (recentSlice[recentSlice.length - 1].value - recentSlice[0].value) / (recentSlice.length - 1)
      : 0
  const volatility = getVolatility(points)

  if (change >= 2 && recentSlope > 0 && volatility <= 8) {
    return {
      label: "Haussiere",
      tone: "text-emerald-600",
      note: "La pente reste positive et la courbe defend encore son support recent.",
    }
  }

  if (change <= -2 && recentSlope < 0) {
    return {
      label: "Baissiere",
      tone: "text-rose-600",
      note: "La structure glisse sous sa zone mediane et la pression reste negative.",
    }
  }

  return {
    label: "Neutre",
    tone: "text-amber-600",
    note: "Le rythme est encore indecis, sans impulsion directionnelle dominante.",
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

function ChartTooltip({
  active,
  payload,
  currency,
  mode,
}: {
  active?: boolean
  payload?: Array<{ payload: RenderChartPoint }>
  currency: CurrencyCode
  mode: ChartMode
}) {
  if (!active || !payload?.length) return null

  const point = payload[0]?.payload
  if (!point || point.value === null) return null

  return (
    <div className="min-w-[220px] rounded-2xl border border-slate-200 bg-white/96 px-4 py-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)] backdrop-blur">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{formatDateTime(point.timestamp)}</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-500">{mode === "portfolio" ? "Valeur portefeuille" : "Prix spot"}</span>
          <span className="text-[13px] font-semibold text-slate-900">{formatCurrency(point.value, currency)}</span>
        </div>
        {point.performance !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-500">Variation periode</span>
            <span className={cn("text-[12px] font-semibold", point.performance >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {point.performance >= 0 ? "+" : ""}
              {point.performance.toFixed(2)}%
            </span>
          </div>
        )}
        {point.valueChange !== null && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-500">{mode === "portfolio" ? "Variation EUR" : "Variation USD"}</span>
            <span className={cn("text-[12px] font-semibold", point.valueChange >= 0 ? "text-emerald-600" : "text-rose-600")}>
              {point.valueChange >= 0 ? "+" : ""}
              {formatCurrency(Math.abs(point.valueChange), currency)}
            </span>
          </div>
        )}
        {point.volume !== null && Number.isFinite(point.volume) && point.volume > 0 && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[11px] text-slate-500">Volume</span>
            <span className="text-[12px] font-semibold text-slate-900">{formatVolume(point.volume)}</span>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] text-slate-500">Source</span>
          <span className="text-[11px] font-semibold text-slate-700">{point.sourceLabel}</span>
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
  const [period, setPeriod] = useState<ChartPeriod>("24H")
  const [showDetails, setShowDetails] = useState(false)

  const normalizedSnapshots = useMemo(
    () => normalizePortfolioSnapshots(portfolioSnapshots),
    [portfolioSnapshots]
  )

  const hasRealHistory = normalizedSnapshots.length > 0
  const firstSnapshot = normalizedSnapshots[0] ?? null
  const latestSnapshot = normalizedSnapshots[normalizedSnapshots.length - 1] ?? null
  const anchorMs =
    latestSnapshot?.timestamp ??
    marketSeriesShort[marketSeriesShort.length - 1]?.timestamp ??
    marketSeriesAll[marketSeriesAll.length - 1]?.timestamp ??
    0
  const historyAgeMs = firstSnapshot && latestSnapshot ? Math.max(0, latestSnapshot.timestamp - firstSnapshot.timestamp) : 0

  const availablePeriods = useMemo(() => {
    return PERIODS.filter((candidate) => {
      if (hasRealHistory) {
        const series = buildPortfolioSeries(normalizedSnapshots, candidate.id, anchorMs)
        if (candidate.id === "ALL") return series.points.length >= 1
        if (candidate.id === "24H") return series.points.length >= 1
        return series.available && series.points.length >= 2
      }

      const marketBase = candidate.id === "ALL" ? marketSeriesAll : marketSeriesShort
      return getMarketPeriodAvailable(marketBase, candidate.id, anchorMs)
    }).map((candidate) => candidate.id)
  }, [anchorMs, hasRealHistory, marketSeriesAll, marketSeriesShort, normalizedSnapshots])

  useEffect(() => {
    if (availablePeriods.includes(period)) return
    if (availablePeriods[0]) setPeriod(availablePeriods[0])
  }, [availablePeriods, period])

  const portfolioSeries = useMemo(
    () => buildPortfolioSeries(normalizedSnapshots, period, anchorMs),
    [anchorMs, normalizedSnapshots, period]
  )
  const marketBaseSeries = period === "ALL" ? marketSeriesAll : marketSeriesShort
  const marketSeries = useMemo(
    () => buildMarketSeries(marketBaseSeries, period, anchorMs),
    [anchorMs, marketBaseSeries, period]
  )

  const mode: ChartMode | null = hasRealHistory ? "portfolio" : marketSeries.length >= 1 ? "market" : null
  const activeSeries = useMemo(
    () => (mode === "portfolio" ? portfolioSeries.points : mode === "market" ? marketSeries : []),
    [marketSeries, mode, portfolioSeries.points]
  )

  const pointCount = activeSeries.length
  const showSingleSnapshotState = mode === "portfolio" && pointCount === 1
  const showConstructionState = mode === "portfolio" && pointCount >= 1 && pointCount < MIN_POINTS_FOR_ADVANCED_LAYERS
  const showSimpleChart = pointCount >= MIN_POINTS_FOR_SIMPLE_CHART
  const showAdvancedLayers = pointCount >= MIN_POINTS_FOR_ADVANCED_LAYERS
  const showScenario = pointCount >= MIN_POINTS_FOR_SCENARIO
  const showMarketFallbackNotice = !hasRealHistory && mode === "market"

  const sourceLabel =
    mode === "portfolio"
      ? "portfolio_history Supabase"
      : marketReferenceAsset?.source === "Kraken"
      ? "Kraken + CoinGecko"
      : marketReferenceAsset?.source === "fallback"
      ? "CoinGecko fallback"
      : "CoinGecko"
  const currency: CurrencyCode = mode === "portfolio" ? "EUR" : "USD"

  const trend = useMemo(() => getTrend(activeSeries), [activeSeries])
  const trendDisplay = showAdvancedLayers
    ? trend
    : {
        label: "En construction",
        tone: "text-slate-500",
        note: "Il faut davantage de snapshots reels pour qualifier une tendance fiable.",
      }

  const seriesMin = pointCount >= 1 ? Math.min(...activeSeries.map((point) => point.value)) : null
  const seriesMax = pointCount >= 1 ? Math.max(...activeSeries.map((point) => point.value)) : null
  const support = showAdvancedLayers && seriesMin !== null ? seriesMin : null
  const resistance = showAdvancedLayers && seriesMax !== null ? seriesMax : null
  const zones = support !== null && resistance !== null && resistance > support ? getZoneBoundaries(support, resistance) : null
  const currentPoint = activeSeries[activeSeries.length - 1] ?? null
  const scenario = useMemo(
    () => (showScenario ? buildScenario(activeSeries) : []),
    [activeSeries, showScenario]
  )

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

    if (!showScenario || !scenario.length) return actualData

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
        performance: null,
        valueChange: null,
        sourceLabel: "Scenario possible",
      })),
    ]
  }, [activeSeries, scenario, showScenario, sourceLabel])

  const hasVolume = showAdvancedLayers && activeSeries.some((point) => point.volume !== null && Number.isFinite(point.volume) && point.volume > 0)
  const historyStartLabel = firstSnapshot ? buildHistoryStartLabel(firstSnapshot.timestamp) : null
  const historyAgeLabel = firstSnapshot ? formatHistoryAge(historyAgeMs) : null
  const partialBadge = mode === "portfolio" && period === "24H" && portfolioSeries.partial24h
  const periodLabel = PERIODS.find((candidate) => candidate.id === period)?.label ?? period
  const timelineLabel =
    activeSeries.length >= 1
      ? buildTimelineLabel(activeSeries[0].timestamp, activeSeries[activeSeries.length - 1].timestamp)
      : null
  const seriesCoverageLabel =
    activeSeries.length >= 2
      ? formatHistoryAge(activeSeries[activeSeries.length - 1].timestamp - activeSeries[0].timestamp)
      : historyAgeLabel
  const yPaddingBase =
    seriesMin !== null && seriesMax !== null
      ? Math.max((seriesMax - seriesMin) * 0.24, Math.max(seriesMax, 1) * 0.025)
      : 0
  const yMin = seriesMin !== null ? Math.max(0, seriesMin - yPaddingBase) : 0
  const yMax = seriesMax !== null ? seriesMax + yPaddingBase : "auto"
  const emptyMessage = hasRealHistory
    ? portfolioSeries.reason || "Pas encore assez d'historique portefeuille."
    : "Pas encore assez d'historique portefeuille."

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fcfcfb_100%)] shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
      <div className="border-b border-slate-200 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                {mode === "portfolio" ? "Performance reelle du portefeuille" : "Lecture marche"}
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Source : {sourceLabel}
              </span>
              {historyStartLabel && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                  Historique reel depuis {historyStartLabel}
                </span>
              )}
              {historyAgeLabel && (
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                  {historyAgeLabel}
                </span>
              )}
              {marketUpdatedLabel && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50/80 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
                  Live · Mis a jour a {marketUpdatedLabel}
                </span>
              )}
              {partialBadge && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  Historique partiel
                </span>
              )}
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">Graphique portefeuille</p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
                {mode === "portfolio"
                  ? "Lecture claire de ta performance reelle"
                  : marketReferenceAsset
                  ? `${marketReferenceAsset.symbol} - lecture marche`
                  : "Lecture marche"}
              </h2>
            </div>

            <div className="space-y-2">
              <p className="max-w-2xl text-[12px] leading-6 text-slate-500">{CHART_EXPLANATION}</p>
              {(timelineLabel || seriesCoverageLabel || historyStartLabel) && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500">
                  {timelineLabel && <span className="font-medium text-slate-700">{timelineLabel}</span>}
                  {timelineLabel && (seriesCoverageLabel || historyStartLabel) && <span className="text-slate-300">·</span>}
                  {seriesCoverageLabel && <span>{seriesCoverageLabel}</span>}
                  {historyStartLabel && (
                    <>
                      {(timelineLabel || seriesCoverageLabel) && <span className="text-slate-300">·</span>}
                      <span>{mode === "portfolio" ? "Depuis le premier snapshot" : "Serie marche disponible"}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start gap-2 xl:items-end">
            <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1">
              {PERIODS.map((candidate) => {
                const selected = candidate.id === period
                const available = availablePeriods.includes(candidate.id)
                const disabledReason = hasRealHistory
                  ? candidate.id === "7D"
                    ? "Pas assez d'historique reel pour 7j."
                    : candidate.id === "30D"
                    ? "Pas assez d'historique reel pour 30j."
                    : candidate.id === "90D"
                    ? "Pas assez d'historique reel pour 90j."
                    : "Periode indisponible."
                  : "Donnees marche insuffisantes pour cette periode."

                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => {
                      if (available) setPeriod(candidate.id)
                    }}
                    disabled={!available}
                    title={available ? candidate.label : disabledReason}
                    className={cn(
                      "rounded-xl px-3 py-2 text-[11px] font-semibold transition-all",
                      selected
                        ? "bg-white text-slate-950 shadow-[0_6px_16px_rgba(15,23,42,0.08)]"
                        : available
                        ? "text-slate-500 hover:bg-white hover:text-slate-900"
                        : "cursor-not-allowed text-slate-300"
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
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
            >
              Voir details
              <ArrowRight className={cn("h-3.5 w-3.5 transition-transform", showDetails && "rotate-90")} />
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {showConstructionState ? (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{CONSTRUCTION_TITLE}</p>
                <p className="mt-2 text-lg font-semibold text-slate-950" data-testid="market-chart-trend">
                  En demarrage
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{CONSTRUCTION_COPY}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {mode === "portfolio" ? "Valeur actuelle" : "Prix actuel"}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {currentPoint ? formatCurrency(currentPoint.value, currency) : "--"}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {historyStartLabel
                    ? `Premier snapshot enregistre le ${historyStartLabel}.`
                    : "Le premier point reel vient d'etre capture."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Donnees reelles</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{historyAgeLabel ?? "Historique reel demarre"}</p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {pointCount === 1
                    ? "Une seule mesure reellement observee pour le moment."
                    : `${pointCount} snapshots reels disponibles sur ${periodLabel}.`}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Variation</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {currentPoint?.performance !== null
                    ? `${currentPoint.performance >= 0 ? "+" : ""}${currentPoint.performance.toFixed(2)}%`
                    : "En attente"}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  La lecture deviendra plus fiable apres davantage de snapshots reels.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Tendance actuelle</p>
                <p className={cn("mt-2 text-lg font-semibold", trendDisplay.tone)} data-testid="market-chart-trend">
                  {trendDisplay.label}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">{trendDisplay.note}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  {mode === "portfolio" ? "Valeur actuelle" : "Prix actuel"}
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {currentPoint ? formatCurrency(currentPoint.value, currency) : "--"}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  {currentPoint?.performance !== null
                    ? `${currentPoint.performance >= 0 ? "+" : ""}${currentPoint.performance.toFixed(2)}% sur ${periodLabel}`
                    : "Pas encore assez de points pour calculer une variation fiable."}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Support recent</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {support !== null ? formatCurrency(support, currency) : "--"}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">Plus bas recent observe sur la periode active.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Resistance recente</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {resistance !== null ? formatCurrency(resistance, currency) : "--"}
                </p>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">
                  Plus haut recent, utile pour cadrer la zone de prudence.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {activeSeries.length > 0 ? (
        <>
          {showMarketFallbackNotice && (
            <div className="px-4 pt-4 sm:px-5">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Pas encore assez d&apos;historique portefeuille
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                    Lecture marche separee
                  </span>
                </div>
                <p className="mt-3 text-[12px] leading-6 text-slate-600">
                  Le bloc ci-dessous montre uniquement les donnees marche disponibles en attendant tes premiers snapshots reels.
                </p>
              </div>
            </div>
          )}

          {showSingleSnapshotState ? (
            <div className="px-4 py-5 sm:px-5">
              <div className="rounded-[24px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#fcfcfb_100%)] px-5 py-6 shadow-sm">
                <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                    Historique reel demarre
                  </span>
                  <div className="relative mt-5 flex h-20 w-full items-center justify-center">
                    <div className="absolute left-0 right-0 h-px bg-[linear-gradient(90deg,rgba(148,163,184,0)_0%,rgba(148,163,184,0.4)_18%,rgba(148,163,184,0.4)_82%,rgba(148,163,184,0)_100%)]" />
                    <div className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 bg-white shadow-[0_10px_26px_rgba(15,23,42,0.08)]">
                      <div className="h-2.5 w-2.5 rounded-full bg-slate-700" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-950">{CONSTRUCTION_TITLE}</h3>
                  <p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500">{CONSTRUCTION_COPY}</p>
                  <div className="mt-5 grid w-full gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Valeur actuelle portefeuille</p>
                      <p className="mt-2 text-2xl font-semibold text-slate-950">
                        {currentPoint ? formatCurrency(currentPoint.value, "EUR") : "--"}
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        {historyStartLabel ? `Premier snapshot capture le ${historyStartLabel}.` : "Premier snapshot reel capture."}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Etat</p>
                      <p className="mt-2 text-base font-semibold text-slate-950">{historyAgeLabel ?? "Historique reel demarre"}</p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Le graphique apparaitra automatiquement apres plus de donnees reelles.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {showConstructionState && (
                <div className="px-4 pt-4 sm:px-5">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
                        {CONSTRUCTION_TITLE}
                      </span>
                      {historyAgeLabel && (
                        <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-500">
                          {historyAgeLabel}
                        </span>
                      )}
                    </div>
                    <p className="mt-3 text-[12px] leading-6 text-slate-600">{CONSTRUCTION_COPY}</p>
                  </div>
                </div>
              )}

              {showAdvancedLayers && zones && (
                <div className="px-4 pt-4 sm:px-5">
                  <div className="grid gap-2.5 sm:grid-cols-3">
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700">Zone d&apos;achat potentielle</p>
                      <p className="mt-2 text-[12px] font-semibold text-emerald-950">
                        {`${formatCurrency(zones.buy.from, currency)} -> ${formatCurrency(zones.buy.to, currency)}`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/70 px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Zone neutre</p>
                      <p className="mt-2 text-[12px] font-semibold text-amber-950">
                        {`${formatCurrency(zones.neutral.from, currency)} -> ${formatCurrency(zones.neutral.to, currency)}`}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/70 px-3.5 py-3">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700">Zone de prudence</p>
                      <p className="mt-2 text-[12px] font-semibold text-rose-950">
                        {`${formatCurrency(zones.caution.from, currency)} -> ${formatCurrency(zones.caution.to, currency)}`}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] leading-5 text-slate-500">{ZONE_DISCLAIMER}</p>
                </div>
              )}

              {showSimpleChart ? (
                <>
                  <div className="px-3 pb-4 pt-3 sm:px-4">
                    <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-[#fcfcfb] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
                  <div
                        className={cn("w-full", showAdvancedLayers ? "h-[280px] sm:h-[330px]" : "h-[205px] sm:h-[230px]")}
                        data-testid="professional-market-chart"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <ComposedChart data={renderData} margin={{ top: 8, right: 14, bottom: 4, left: 0 }}>
                            {showAdvancedLayers && zones && (
                              <>
                                <ReferenceArea y1={zones.buy.from} y2={zones.buy.to} fill="#4f9c7b" fillOpacity={0.08} />
                                <ReferenceArea y1={zones.neutral.from} y2={zones.neutral.to} fill="#d7b467" fillOpacity={0.07} />
                                <ReferenceArea y1={zones.caution.from} y2={zones.caution.to} fill="#c9878d" fillOpacity={0.07} />
                              </>
                            )}
                            <defs>
                              <linearGradient id="axiom-light-chart-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={CHART_FILL} stopOpacity={0.22} />
                                <stop offset="85%" stopColor={CHART_FILL} stopOpacity={0.02} />
                                <stop offset="100%" stopColor={CHART_FILL} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(148,163,184,0.18)" strokeDasharray="3 7" vertical={false} />
                            <XAxis
                              dataKey="timestamp"
                              tickFormatter={(value) => formatXAxis(period, Number(value))}
                              tick={{ fill: "#94a3b8", fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              minTickGap={18}
                            />
                            <YAxis
                              domain={[yMin, yMax]}
                              tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
                              tick={{ fill: "#94a3b8", fontSize: 11 }}
                              tickLine={false}
                              axisLine={false}
                              width={70}
                            />
                            {showAdvancedLayers && support !== null && resistance !== null && resistance > support && (
                              <>
                                <ReferenceLine
                                  y={support}
                                  stroke={SUPPORT_COLOR}
                                  strokeDasharray="4 6"
                                  label={{ value: "Support", position: "insideBottomLeft", fill: SUPPORT_COLOR, fontSize: 11 }}
                                />
                                <ReferenceLine
                                  y={resistance}
                                  stroke={RESISTANCE_COLOR}
                                  strokeDasharray="4 6"
                                  label={{ value: "Resistance", position: "insideTopLeft", fill: RESISTANCE_COLOR, fontSize: 11 }}
                                />
                              </>
                            )}
                            <RechartsTooltip
                              content={<ChartTooltip currency={currency} mode={mode ?? "market"} />}
                              cursor={{ stroke: "rgba(57,91,154,0.18)", strokeWidth: 1 }}
                            />
                            <Area
                              type={showAdvancedLayers ? "monotone" : "linear"}
                              dataKey="value"
                              stroke={CHART_LINE}
                              strokeWidth={2}
                              fill="url(#axiom-light-chart-fill)"
                              dot={pointCount <= 4 ? { r: 2.5, fill: CHART_LINE, stroke: "#ffffff", strokeWidth: 1.5 } : false}
                              activeDot={{ r: 4, fill: "#ffffff", stroke: CHART_LINE, strokeWidth: 2 }}
                              isAnimationActive
                              animationDuration={900}
                              connectNulls={false}
                            />
                            {showScenario && scenario.length > 0 && (
                              <Line
                                type="monotone"
                                dataKey="scenario"
                                stroke="#8aa0cf"
                                strokeWidth={1.5}
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

                      {showScenario && scenario.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <Radar className="h-3.5 w-3.5 text-slate-400" />
                            Scenario possible si la tendance continue.
                          </span>
                          <span className="text-slate-300">·</span>
                          <span>Ligne pointillee, lecture indicative uniquement.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {showAdvancedLayers && (
                    <div className="border-t border-slate-200 px-4 py-4 sm:px-5">
                      <div className="mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-[11px] font-semibold text-slate-900">Volume</p>
                          <p className="text-[11px] text-slate-500">
                            {hasVolume ? "Volume reel disponible pour cette periode." : "Volume indisponible pour cette periode."}
                          </p>
                        </div>
                      </div>
                      {hasVolume ? (
                        <div className="h-24 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-2">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={renderData.filter((point) => point.value !== null)} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
                              <CartesianGrid stroke="rgba(148,163,184,0.14)" strokeDasharray="3 7" vertical={false} />
                              <XAxis
                                dataKey="timestamp"
                                tickFormatter={(value) => formatXAxis(period, Number(value))}
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
                                tickLine={false}
                                axisLine={false}
                                minTickGap={18}
                              />
                              <YAxis
                                tickFormatter={(value) => formatVolume(Number(value))}
                                tick={{ fill: "#94a3b8", fontSize: 10 }}
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
                                    <div className="rounded-xl border border-slate-200 bg-white/96 px-3 py-2 shadow-lg">
                                      <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{formatDateTime(point.timestamp)}</p>
                                      <p className="mt-2 text-[12px] font-semibold text-slate-900">{formatVolume(point.volume)} volume</p>
                                    </div>
                                  )
                                }}
                                cursor={{ fill: "rgba(148,163,184,0.05)" }}
                              />
                              <Bar dataKey="volume" fill="rgba(57,91,154,0.26)" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-[12px] text-slate-500">
                          Volume indisponible pour cette periode.
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="px-4 py-8 sm:px-5">
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-slate-900">{emptyMessage}</p>
                    <p className="mt-2 text-[12px] leading-6 text-slate-500">
                      {hasRealHistory
                        ? "Le graphique reste volontairement sobre: Axiom n'invente pas de performance avant d'avoir l'historique reel necessaire."
                        : "Le fallback marche apparait seulement quand des donnees reelles sont disponibles, jamais pour simuler ta performance."}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <div className="px-4 py-8 sm:px-5">
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-8 text-center">
            <p className="text-sm font-semibold text-slate-900">{emptyMessage}</p>
            <p className="mt-2 text-[12px] leading-6 text-slate-500">
              {hasRealHistory
                ? "Le graphique reste volontairement sobre: Axiom n'invente pas de performance avant d'avoir l'historique reel necessaire."
                : "Le fallback marche apparait seulement quand des donnees reelles sont disponibles, jamais pour simuler ta performance."}
            </p>
          </div>
        </div>
      )}

      <div className="border-t border-slate-200 px-4 py-3 text-[11px] leading-5 text-slate-500 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-medium text-slate-700">Etat donnees reelles</span>
          <span className="text-slate-300">·</span>
          <span>{mode === "portfolio" ? "Performance utilisateur reelle" : "Lecture marche reelle"}</span>
          {capital > 0 && mode === "portfolio" && (
            <>
              <span className="text-slate-300">·</span>
              <span>Capital investi : {formatCurrency(capital, "EUR")}</span>
            </>
          )}
          {lastSnapshotLabel && mode === "portfolio" && (
            <>
              <span className="text-slate-300">·</span>
              <span>Dernier snapshot : {lastSnapshotLabel}</span>
            </>
          )}
        </div>
      </div>

      {showDetails && (
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-4 sm:px-5">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Mode</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {mode === "portfolio" ? "Performance reelle utilisateur" : "Lecture marche disponible"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {mode === "portfolio"
                  ? "La courbe suit uniquement tes snapshots reels. Aucune simulation retroactive."
                  : "Le portefeuille n&apos;a pas encore assez d&apos;historique reel. Le bloc bascule donc vers les prix marche disponibles."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Periode</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{periodLabel}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {partialBadge
                  ? "La lecture 24h est partielle car ton historique reel a moins de 24h."
                  : hasRealHistory
                  ? "Les periodes longues ne s'activent que si l'historique reel couvre vraiment la fenetre."
                  : "Les periodes suivent la couverture de l'historique marche disponible."}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Support / resistance</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">
                {showAdvancedLayers && support !== null && resistance !== null
                  ? `${formatCurrency(support, currency)} / ${formatCurrency(resistance, currency)}`
                  : "Encore trop peu de points"}
              </p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                Support = plus bas recent. Resistance = plus haut recent sur la periode choisie.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Source</p>
              <p className="mt-2 text-sm font-semibold text-slate-950">{sourceLabel}</p>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {showAdvancedLayers
                  ? "Le scenario pointille reste purement indicatif et n&apos;est jamais presente comme une prediction."
                  : "Les couches avancees s'activent seulement quand l'historique reel devient suffisant."}
              </p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[11px] leading-5 text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
            <span>{ZONE_DISCLAIMER}</span>
          </div>
        </div>
      )}
    </div>
  )
}

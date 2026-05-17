"use client"

import Link from "next/link"
import {
  ArrowRight, Check, X, ChevronRight, TrendingUp, TrendingDown,
  Wallet, Activity, Brain, Percent, Crown,
  Search, RefreshCw, Star, StarOff, ChevronUp, ChevronDown,
  Zap, Clock, AlertTriangle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import type { CryptoPrice, MarketGlobal, MarketSeriesPoint } from "@/lib/coingecko"
import type { MarketDecision } from "@/lib/market-agent"
import { AxiomGlyph } from "@/components/branding/AxiomLogo"
import { SparklineChart } from "@/components/SparklineChart"
import { PortfolioChart } from "@/components/advisor/PortfolioChart"
import { ProfessionalMarketChart } from "@/components/charts/ProfessionalMarketChart"
import { WhyNowCard } from "@/components/dashboard/WhyNowCard"
import { SinceAnalysisCard } from "@/components/dashboard/SinceAnalysisCard"
import { DisciplineCard } from "@/components/dashboard/DisciplineCard"
import { MarketWeeklyCard } from "@/components/dashboard/MarketWeeklyCard"
import { PortfolioDriftCard } from "@/components/dashboard/PortfolioDriftCard"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Subscription {
  plan: string
  status: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}
interface Analysis {
  id: string
  created_at: string
  allocations: Array<{ symbol: string; percentage: number }>
  total_score: number
  recommendations?: string[] | null
  market_context?: string | null
  investor_profile?: Record<string, unknown> | null
  warnings?: string[] | null
  model_used?: string | null
}
interface PortfolioSnapshot {
  analysis_id: string | null
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
  performance_percent: number | string | null
  allocations: Array<{ symbol: string; percentage: number }> | null
}
interface Props {
  user: { email?: string }
  profile: { full_name?: string; plan?: string } | null
  analyses: Analysis[]
  subscription: Subscription | null
  justUpgraded: string | null
  monthlyCount: number
  cryptoPrices: CryptoPrice[]
  portfolioSnapshots: PortfolioSnapshot[]
  marketGlobal: MarketGlobal | null
  marketDecision: MarketDecision | null
  marketFetchedAt?: number
  marketReferenceAsset: CryptoPrice | null
  marketSeriesShort: MarketSeriesPoint[]
  marketSeriesAll: MarketSeriesPoint[]
  btcSeriesAll: MarketSeriesPoint[]
  ethSeriesAll: MarketSeriesPoint[]
}

interface AdvisorOutput {
  executionNow: Array<{ crypto: string; amount: string }>
  strategy: string | null
  nextReview: string | null
  errorsToAvoid: string[]
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ASSET_BAR: Record<string, string> = {
  BTC: "bg-amber-500", ETH: "bg-blue-500", SOL: "bg-purple-500",
  BNB: "bg-yellow-500", XRP: "bg-sky-500", ADA: "bg-blue-600",
  AVAX: "bg-red-500", DOT: "bg-pink-500", LINK: "bg-blue-700",
  NEAR: "bg-green-500", MATIC: "bg-violet-500", POL: "bg-violet-500",
}
const ASSET_TEXT: Record<string, string> = {
  BTC: "text-amber-600", ETH: "text-blue-600", SOL: "text-purple-600",
  BNB: "text-yellow-600", XRP: "text-sky-600", ADA: "text-blue-700",
  AVAX: "text-red-600", DOT: "text-pink-600", LINK: "text-blue-700",
  NEAR: "text-green-600", MATIC: "text-violet-600", POL: "text-violet-600",
}
const HISTORY_LIMIT: Record<string, number> = { free: 3, pro: 10, premium: 20 }
const DISPLAY_LOCALE = "fr-FR"
const DISPLAY_TIME_ZONE = "Europe/Paris"
const PLAN_CAPABILITIES: Record<"free" | "pro" | "premium", { included: string[]; locked: string[]; upsell: string }> = {
  free: {
    included: ["1 analyse/mois", "Historique 3", "Analyse de base"],
    locked: ["Signal Pro", "PDF Pro", "Projections Premium"],
    upsell: "Passez au Pro pour obtenir le signal marché détaillé, le PDF et 10 analyses d'historique.",
  },
  pro: {
    included: ["20 analyses/mois", "Signal marché", "Export PDF", "Historique 10"],
    locked: ["Stratégie avancée", "Projections", "Alertes de risque"],
    upsell: "Passez au Premium pour les projections, les alertes de risque et la stratégie avancée.",
  },
  premium: {
    included: ["Analyses illimitées", "Historique 20", "Stratégie avancée", "Projections"],
    locked: [],
    upsell: "Toutes les fonctions avancées de l'application sont actives.",
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(p: number | null | undefined) {
  const value = typeof p === "number" && Number.isFinite(p) ? p : null
  if (value === null) return "—"
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (value >= 1)    return `$${value.toFixed(2)}`
  return `$${value.toFixed(4)}`
}
function fmtCap(n: number | null | undefined) {
  const value = typeof n === "number" && Number.isFinite(n) ? n : null
  if (value === null) return "—"
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`
  return `$${(value / 1e6).toFixed(0)}M`
}
function fmtCapShort(n: number | null | undefined) {
  const value = typeof n === "number" && Number.isFinite(n) ? n : null
  if (value === null) return "—"
  if (value >= 1e12) return `${(value / 1e12).toFixed(1)}T`
  if (value >= 1e9)  return `${(value / 1e9).toFixed(0)}B`
  return `${(value / 1e6).toFixed(0)}M`
}

function getMarketSourceLabel(source: CryptoPrice["source"]) {
  if (source === "Kraken") return "Kraken"
  if (source === "fallback") return "CoinGecko fallback"
  return "CoinGecko"
}

function getMarketSourceClasses(source: CryptoPrice["source"]) {
  if (source === "Kraken") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (source === "fallback") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-border bg-secondary text-muted-foreground"
}
function fmtPortfolioEuroDelta(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) return "—"

  const abs = Math.abs(value)
  if (abs === 0) return "≈ 0€"
  if (abs < 0.01) return value > 0 ? "< +0,01€" : "< -0,01€"

  const formatted = value.toLocaleString("fr-FR", abs >= 100
    ? { maximumFractionDigits: 0 }
    : { minimumFractionDigits: abs < 1 ? 2 : 0, maximumFractionDigits: 2 })

  return `${value > 0 ? "+" : ""}${formatted}€`
}

function formatRealHistoryLabel(ageMs: number) {
  if (ageMs < DAY_MS) {
    const hours = Math.max(1, Math.round(ageMs / HOUR_MS))
    return `${hours}h de donnees reelles`
  }

  const days = Math.max(1, Math.round(ageMs / DAY_MS))
  return `${days}j de donnees reelles`
}

function formatSnapshotStartLabel(timestamp: number) {
  return new Date(timestamp).toLocaleDateString(DISPLAY_LOCALE, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  })
}

function AxiomIcon({ className }: { className?: string }) {
  return <AxiomGlyph className={className} />
}

function getAdvisorOutput(analysis: Analysis | null): AdvisorOutput {
  const rawProfile = (analysis?.investor_profile ?? {}) as Record<string, unknown>
  const rawOutput = rawProfile.advisorOutput
  const advisorOutput = rawOutput && typeof rawOutput === "object" ? rawOutput as Record<string, unknown> : null

  const executionNow = Array.isArray(advisorOutput?.executionNow)
    ? advisorOutput.executionNow
        .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
        .map((item) => ({
          crypto: String(item.crypto ?? "").toUpperCase().trim(),
          amount: String(item.amount ?? "").trim(),
        }))
        .filter((item) => item.crypto)
    : []

  const strategySource = typeof advisorOutput?.strategy === "string"
    ? advisorOutput.strategy
    : typeof advisorOutput?.entryStrategy === "string"
    ? advisorOutput.entryStrategy
    : ""

  const errorsToAvoid = Array.isArray(advisorOutput?.errorsToAvoid)
    ? advisorOutput.errorsToAvoid.map(String).map((item) => item.trim()).filter(Boolean).slice(0, 4)
    : []

  return {
    executionNow,
    strategy: strategySource.trim() || null,
    nextReview: typeof advisorOutput?.nextReview === "string" && advisorOutput.nextReview.trim()
      ? advisorOutput.nextReview.trim()
      : null,
    errorsToAvoid,
  }
}

// ── Portfolio Chart ───────────────────────────────────────────────────────────
const TIMEFRAMES = ["1H", "1D", "7D", "1M", "3M", "1Y", "ALL"] as const
type TF = typeof TIMEFRAMES[number]
type TimeframeAvailability = { available: boolean; reason: string }
const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const TIMEFRAME_WINDOWS_MS: Partial<Record<TF, number>> = {
  "1H": HOUR_MS,
  "1D": DAY_MS,
  "7D": 7 * DAY_MS,
  "1M": 30 * DAY_MS,
  "3M": 90 * DAY_MS,
  "1Y": 365 * DAY_MS,
}
const ONE_DAY_RECENT_WINDOW_MS = 2 * DAY_MS
const TIMEFRAME_MIN_COVERAGE_MS: Partial<Record<TF, number>> = {
  "7D": 2 * DAY_MS,
  "1M": 21 * DAY_MS,
  "3M": 60 * DAY_MS,
  "1Y": 180 * DAY_MS,
}
const INTRAHOUR_MESSAGE = "Disponible quand plusieurs snapshots sont créés dans la même heure."
const RECENT_DATA_MESSAGE = "Disponible dès que deux snapshots existent sur les dernières 48h."

interface PortfolioSnapshotChartPoint {
  timestamp: number
  performance: number
  portfolioValue: number
  valueChange: number
}

interface NormalizedPortfolioSnapshot {
  timestamp: number
  portfolioValue: number
  investedAmount: number | null
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function normalizePortfolioSnapshots(snapshots: PortfolioSnapshot[]): NormalizedPortfolioSnapshot[] {
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

function getPortfolioSnapshotsForTimeframe(
  snapshots: NormalizedPortfolioSnapshot[],
  timeframe: TF,
  anchorMs: number
) {
  const periodMs = timeframe === "1D"
    ? ONE_DAY_RECENT_WINDOW_MS
    : TIMEFRAME_WINDOWS_MS[timeframe]

  return (periodMs === undefined
    ? snapshots
    : snapshots.filter((snapshot) => snapshot.timestamp >= anchorMs - periodMs)
  ).filter((snapshot) => snapshot.timestamp <= anchorMs)
}

function getSnapshotsWithinWindow(
  snapshots: NormalizedPortfolioSnapshot[],
  anchorMs: number,
  windowMs: number
) {
  return snapshots.filter((snapshot) => (
    snapshot.timestamp >= anchorMs - windowMs && snapshot.timestamp <= anchorMs
  ))
}

function getSnapshotCoverageMs(snapshots: NormalizedPortfolioSnapshot[]) {
  if (snapshots.length < 2) return 0
  return Math.max(0, snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp)
}

function buildPortfolioSnapshotData(
  snapshots: NormalizedPortfolioSnapshot[],
  timeframe: TF,
  anchorMs: number
): PortfolioSnapshotChartPoint[] {
  if (!snapshots.length) return []

  const series = getPortfolioSnapshotsForTimeframe(snapshots, timeframe, anchorMs)

  if (series.length < 2) return []

  const baseline = series[0]
  if (baseline.portfolioValue <= 0) return []
  const baselineInvestedAmount = baseline.investedAmount ?? 0

  return series.map((snapshot) => ({
    timestamp: snapshot.timestamp,
    portfolioValue: snapshot.portfolioValue,
    valueChange: Number((
      snapshot.portfolioValue
      - baseline.portfolioValue
      - ((snapshot.investedAmount ?? baselineInvestedAmount) - baselineInvestedAmount)
    ).toFixed(2)),
    performance: Number(((
      (
        snapshot.portfolioValue
        - baseline.portfolioValue
        - ((snapshot.investedAmount ?? baselineInvestedAmount) - baselineInvestedAmount)
      ) / baseline.portfolioValue
    ) * 100).toFixed(3)),
  }))
}

function getPortfolioSnapshotChange(
  snapshots: NormalizedPortfolioSnapshot[],
  timeframe: TF,
  anchorMs: number
) {
  const data = buildPortfolioSnapshotData(snapshots, timeframe, anchorMs)
  return data.length ? data[data.length - 1].performance : null
}

function getPortfolioSnapshotValueChange(
  snapshots: NormalizedPortfolioSnapshot[],
  timeframe: TF,
  anchorMs: number
) {
  const data = buildPortfolioSnapshotData(snapshots, timeframe, anchorMs)
  return data.length ? data[data.length - 1].valueChange : null
}

function getTimeframeAvailability(
  snapshots: NormalizedPortfolioSnapshot[],
  timeframe: TF,
  anchorMs: number
): TimeframeAvailability {
  if (!snapshots.length) {
    return { available: false, reason: "Aucune donnée portefeuille" }
  }

  if (timeframe === "ALL") {
    return snapshots.length >= 2
      ? { available: true, reason: "" }
      : { available: false, reason: "Historique encore trop court pour cette période." }
  }

  const filteredSnapshots = getPortfolioSnapshotsForTimeframe(snapshots, timeframe, anchorMs)
  if (filteredSnapshots.length < 2) {
    return {
      available: false,
      reason: timeframe === "1H"
        ? INTRAHOUR_MESSAGE
        : timeframe === "1D"
        ? RECENT_DATA_MESSAGE
        : "Historique encore trop court pour cette période.",
    }
  }

  const minCoverageMs = TIMEFRAME_MIN_COVERAGE_MS[timeframe] ?? 0
  if (minCoverageMs > 0 && getSnapshotCoverageMs(filteredSnapshots) < minCoverageMs) {
    return { available: false, reason: "Historique encore trop court pour cette période." }
  }

  return { available: true, reason: "" }
}

function usesRecentOneDayFallback(
  snapshots: NormalizedPortfolioSnapshot[],
  anchorMs: number
) {
  const exactOneDaySnapshots = getSnapshotsWithinWindow(snapshots, anchorMs, DAY_MS)
  return exactOneDaySnapshots.length < 2 && getPortfolioSnapshotsForTimeframe(snapshots, "1D", anchorMs).length >= 2
}

// ── Market Table ──────────────────────────────────────────────────────────────
type SortKey = "rank" | "price" | "change24h" | "marketCap"
type SortDir = "asc" | "desc"

function SortHeader({ label, sortKey, cur, dir, onSort, className }: {
  label: string; sortKey: SortKey; cur: SortKey; dir: SortDir
  onSort: (k: SortKey) => void; className?: string
}) {
  const active = cur === sortKey
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn("flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors", className)}
    >
      {label}
      <div className="flex flex-col -space-y-1">
        <ChevronUp className={cn("h-2.5 w-2.5", active && dir === "asc" ? "text-foreground" : "text-muted-foreground/30")} />
        <ChevronDown className={cn("h-2.5 w-2.5", active && dir === "desc" ? "text-foreground" : "text-muted-foreground/30")} />
      </div>
    </button>
  )
}

function MarketOverviewTable({ cryptoPrices }: { cryptoPrices: CryptoPrice[] }) {
  const [filter, setFilter] = useState<"all" | "gainers" | "losers">("all")
  const [sortKey, setSortKey] = useState<SortKey>("rank")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(["bitcoin", "ethereum"]))
  const [search, setSearch] = useState("")
  const router = useRouter()

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortKey(key); setSortDir("desc") }
  }

  const displayed = useMemo(() => {
    let data = cryptoPrices
      .filter((c) =>
        Number.isFinite(c.price)
        && c.price > 0
        && Number.isFinite(c.marketCap)
        && c.marketCap > 0
        && Number.isFinite(c.change24h)
      )
      .map((c, i) => ({ ...c, rank: i + 1 }))

    if (search) data = data.filter(c =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.symbol.toLowerCase().includes(search.toLowerCase())
    )

    if (filter === "gainers") data = data.filter(c => c.change24h > 0)
    else if (filter === "losers") data = data.filter(c => c.change24h < 0)

    data.sort((a, b) => {
      let av: number, bv: number
      if (sortKey === "rank")      { av = a.rank;      bv = b.rank }
      else if (sortKey === "price")     { av = a.price;     bv = b.price }
      else if (sortKey === "change24h") { av = a.change24h; bv = b.change24h }
      else                              { av = a.marketCap; bv = b.marketCap }
      return sortDir === "asc" ? av - bv : bv - av
    })

    return data
  }, [cryptoPrices, search, filter, sortKey, sortDir])
  const positives = displayed.filter((coin) => coin.change24h > 0).length
  const negatives = displayed.filter((coin) => coin.change24h < 0).length
  const krakenCount = displayed.filter((coin) => coin.source === "Kraken").length
  const fallbackCount = displayed.filter((coin) => coin.source === "fallback").length

  const filters = [
    { id: "all",     label: "Tout" },
    { id: "gainers", label: "Hausse" },
    { id: "losers",  label: "Baisse" },
  ] as const

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Marchés</h3>
          <p className="text-[11px] text-muted-foreground">Prix live, variation 24h, categories et source visible par actif.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-8 w-32 rounded-lg border border-border bg-background pl-8 pr-2 text-[11px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            {filters.map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors",
                  filter === f.id ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => router.refresh()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Actualiser"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 border-b border-border px-4 py-3 text-[11px]">
        <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-muted-foreground">
          {displayed.length} actifs suivis
        </span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-emerald-700">
          {positives} en hausse
        </span>
        <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-red-700">
          {negatives} en baisse
        </span>
        <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-muted-foreground">
          {krakenCount} via Kraken
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-amber-700">
          {fallbackCount} en fallback
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 px-2 py-2.5" />
              <th className="px-2 py-2.5 text-left">
                <SortHeader label="#" sortKey="rank" cur={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Actif</th>
              <th className="px-3 py-2.5 text-right">
                <SortHeader label="Prix" sortKey="price" cur={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortHeader label="24h" sortKey="change24h" cur={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right lg:table-cell">
                <SortHeader label="Cap." sortKey="marketCap" cur={sortKey} dir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right sm:table-cell text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                7J
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {displayed.map((c) => {
              const up = c.change24h >= 0
              const inWl = watchlist.has(c.id)
              return (
                <tr key={c.id} className="transition-colors hover:bg-secondary/40 cursor-pointer group">
                  <td className="px-2 py-2.5">
                    <button
                      onClick={() => setWatchlist(prev => {
                        const s = new Set(prev)
                        if (inWl) s.delete(c.id)
                        else s.add(c.id)
                        return s
                      })}
                      className="text-muted-foreground hover:text-warning transition-colors"
                    >
                      {inWl
                        ? <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        : <StarOff className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />}
                    </button>
                  </td>
                  <td className="px-2 py-2.5">
                    <span className="text-[11px] text-muted-foreground tabular-nums">{c.rank}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary overflow-hidden shrink-0">
                        {c.image
                          // eslint-disable-next-line @next/next/no-img-element
                          ? <img src={c.image} alt={c.symbol} className="h-5 w-5 object-contain" />
                          : <span className="text-[11px] font-semibold text-foreground">{c.symbol.charAt(0)}</span>
                        }
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{c.name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <p className="text-[10px] text-muted-foreground">{c.symbol}</p>
                          <span className={cn("rounded-full border px-2 py-0.5 text-[9px] font-semibold", getMarketSourceClasses(c.source))}>
                            {getMarketSourceLabel(c.source)}
                          </span>
                          {(c.categories ?? []).slice(0, 2).map((category) => (
                            <span key={category} className="rounded-full border border-border bg-background px-2 py-0.5 text-[9px] text-muted-foreground">
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[13px] font-medium text-foreground tabular-nums">{fmtPrice(c.price)}</span>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <div className={cn("flex items-center justify-end gap-0.5 text-[12px] font-medium tabular-nums", up ? "text-success" : "text-destructive")}>
                      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {Math.abs(c.change24h).toFixed(2)}%
                    </div>
                  </td>
                  <td className="hidden px-3 py-2.5 text-right lg:table-cell">
                    <span className="text-[12px] text-muted-foreground tabular-nums">{fmtCapShort(c.marketCap)}</span>
                  </td>
                  <td className="hidden px-3 py-2.5 sm:table-cell">
                    <div className="flex justify-end">
                      <SparklineChart
                        symbol={c.symbol}
                        currentPrice={c.price}
                        change24h={c.change24h}
                        sparklineData={c.sparkline7d}
                        width={80}
                        height={32}
                      />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Source prix : Kraken quand la paire existe, sinon CoinGecko fallback visible.</span>
        <Link href="/kraken-live" className="text-[11px] font-medium text-accent hover:underline">
          Voir Kraken Live →
        </Link>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function DashboardOverview({
  user, profile, analyses, subscription, justUpgraded,
  monthlyCount, cryptoPrices, portfolioSnapshots, marketGlobal, marketDecision, marketFetchedAt,
  marketReferenceAsset, marketSeriesShort, marketSeriesAll, btcSeriesAll, ethSeriesAll,
}: Props) {
  const router = useRouter()
  const [showUpgradeToast, setShowUpgradeToast] = useState(!!justUpgraded)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    if (justUpgraded) {
      const t = setTimeout(() => setShowUpgradeToast(false), 6000)
      return () => clearTimeout(t)
    }
  }, [justUpgraded])

  // Refresh market cards every 30s; portfolio performance still comes from real snapshots only.
  useEffect(() => {
    const id = setInterval(() => router.refresh(), 30_000)
    return () => clearInterval(id)
  }, [router])

  const firstName = profile?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "Trader"
  const plan = (subscription?.status === "active" || subscription?.status === "trialing")
    ? (subscription.plan as "free" | "pro" | "premium")
    : (profile?.plan ?? "free") as "free" | "pro" | "premium"

  const historyLimit    = HISTORY_LIMIT[plan] ?? 3
  const visibleAnalyses = analyses.slice(0, historyLimit)
  const lastAnalysis    = visibleAnalyses[0] ?? null
  const advisorOutput   = useMemo(() => getAdvisorOutput(lastAnalysis), [lastAnalysis])
  const avgScore        = visibleAnalyses.length
    ? Math.round(visibleAnalyses.reduce((s, a) => s + (a.total_score ?? 0), 0) / visibleAnalyses.length)
    : null

  const planLimit = plan === "premium" ? null : plan === "pro" ? 20 : 1
  const analysesRemaining = planLimit === null ? null : Math.max(0, planLimit - monthlyCount)
  const normalizedPortfolioSnapshots = useMemo(
    () => normalizePortfolioSnapshots(portfolioSnapshots),
    [portfolioSnapshots]
  )
  const useSnapshotHistory = normalizedPortfolioSnapshots.length > 0
  const firstSnapshot = normalizedPortfolioSnapshots[0] ?? null
  const latestSnapshot = normalizedPortfolioSnapshots[normalizedPortfolioSnapshots.length - 1] ?? null
  const timeframeAnchorMs = latestSnapshot?.timestamp ?? marketFetchedAt ?? 0
  const realHistoryAgeMs = firstSnapshot && latestSnapshot ? Math.max(0, latestSnapshot.timestamp - firstSnapshot.timestamp) : 0
  const marketUpdatedLabel = useMemo(() => {
    if (!marketFetchedAt) return null
    return new Date(marketFetchedAt).toLocaleTimeString(DISPLAY_LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: DISPLAY_TIME_ZONE,
    })
  }, [marketFetchedAt])
  const lastSnapshotLabel = useMemo(() => {
    if (!latestSnapshot) return null
    return new Date(latestSnapshot.timestamp).toLocaleString(DISPLAY_LOCALE, {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: DISPLAY_TIME_ZONE,
    })
  }, [latestSnapshot])
  const realHistoryLabel = firstSnapshot ? formatRealHistoryLabel(realHistoryAgeMs) : null
  const realHistoryStartLabel = firstSnapshot ? formatSnapshotStartLabel(firstSnapshot.timestamp) : null
  const snapshotCountLabel = `${normalizedPortfolioSnapshots.length} snapshot${normalizedPortfolioSnapshots.length > 1 ? "s" : ""} reel${normalizedPortfolioSnapshots.length > 1 ? "s" : ""}`
  const oneDayUsesRecentFallback = useMemo(() => (
    usesRecentOneDayFallback(normalizedPortfolioSnapshots, timeframeAnchorMs)
  ), [normalizedPortfolioSnapshots, timeframeAnchorMs])
  const oneDayBadgeLabel = oneDayUsesRecentFallback ? "RÉCENT" : "1D"

  const portfolioChange24h = useMemo(() => {
    return useSnapshotHistory ? getPortfolioSnapshotChange(normalizedPortfolioSnapshots, "1D", timeframeAnchorMs) : null
  }, [normalizedPortfolioSnapshots, timeframeAnchorMs, useSnapshotHistory])
  const portfolioValueChange = useMemo(() => {
    return useSnapshotHistory ? getPortfolioSnapshotValueChange(normalizedPortfolioSnapshots, "1D", timeframeAnchorMs) : null
  }, [normalizedPortfolioSnapshots, timeframeAnchorMs, useSnapshotHistory])

  const timeframeAvailability = useMemo(() => {
    const availability = {} as Record<TF, TimeframeAvailability>
    for (const timeframe of TIMEFRAMES) {
      availability[timeframe] = getTimeframeAvailability(normalizedPortfolioSnapshots, timeframe, timeframeAnchorMs)
    }
    return availability
  }, [normalizedPortfolioSnapshots, timeframeAnchorMs])

  const capital = Number(latestSnapshot?.investedAmount ?? (lastAnalysis?.investor_profile as Record<string, unknown> | undefined)?.capital ?? 0)
  const lastProfile = (lastAnalysis?.investor_profile ?? {}) as Record<string, unknown>
  const latestAllocation = useMemo(
    () => lastAnalysis?.allocations ?? [],
    [lastAnalysis]
  )
  const coreAssets = latestAllocation
    .filter((allocation) => ["BTC", "ETH"].includes(allocation.symbol))
    .map((allocation) => allocation.symbol)
  const satelliteAssets = latestAllocation
    .filter((allocation) => !["BTC", "ETH", "USDC", "USDT"].includes(allocation.symbol))
    .map((allocation) => allocation.symbol)
  const riskToleranceLabel = {
    conservative: "profil prudent",
    moderate: "profil equilibre",
    aggressive: "profil offensif",
  }[String(lastProfile.riskTolerance)] ?? "profil investisseur"
  const horizonLabel = {
    short: "avec un horizon court",
    medium: "avec un horizon moyen",
    long: "avec un horizon long",
  }[String(lastProfile.horizon)] ?? "avec votre horizon actuel"
  const primaryGoal = Array.isArray(lastProfile.goals) ? String(lastProfile.goals[0] ?? "") : ""
  const allocationRationale = [
    coreAssets.length
      ? `Le coeur ${coreAssets.join(" + ")} sert de base liquide et plus lisible pour un ${riskToleranceLabel}.`
      : "Le coeur du portefeuille privilegie les actifs les plus liquides avant d'ajouter des satellites.",
    satelliteAssets.length
      ? `${satelliteAssets.join(", ")} restent limites pour chercher du potentiel sans laisser la volatilite dominer l'ensemble.`
      : "Les satellites restent limites tant qu'un besoin clair de diversification ou de rendement supplementaire n'apparait pas.",
    primaryGoal
      ? `L'objectif prioritaire "${primaryGoal}" est pris en compte ${horizonLabel} pour transformer l'allocation en plan executable.`
      : `L'allocation reste coherente ${horizonLabel}, avec un niveau de risque aligne sur vos reponses.`,
  ]

  const sentiment = useMemo(() => {
    if (!cryptoPrices.length) return null
    const avg = cryptoPrices.slice(0, 8).reduce((s, c) => s + c.change24h, 0) / Math.min(8, cryptoPrices.length)
    if (avg > 3)    return { label: "Très haussier", score: 75, color: "text-success" }
    if (avg > 0.5)  return { label: "Haussier",      score: 62, color: "text-success" }
    if (avg > -0.5) return { label: "Neutre",         score: 50, color: "text-muted-foreground" }
    if (avg > -3)   return { label: "Baissier",       score: 35, color: "text-destructive" }
    return                  { label: "Très baissier", score: 20, color: "text-destructive" }
  }, [cryptoPrices])
  const marketUniverse = useMemo(
    () => cryptoPrices.filter((coin) => (
      Number.isFinite(coin.price)
      && coin.price > 0
      && Number.isFinite(coin.marketCap)
      && coin.marketCap > 0
      && Number.isFinite(coin.change24h)
    )),
    [cryptoPrices]
  )
  const trackedMarketCount = marketUniverse.length
  const positiveMarketCount = useMemo(
    () => marketUniverse.filter((coin) => coin.change24h > 0).length,
    [marketUniverse]
  )
  const negativeMarketCount = useMemo(
    () => marketUniverse.filter((coin) => coin.change24h < 0).length,
    [marketUniverse]
  )
  const krakenMarketCount = useMemo(
    () => marketUniverse.filter((coin) => coin.source === "Kraken").length,
    [marketUniverse]
  )
  const fallbackMarketCount = useMemo(
    () => marketUniverse.filter((coin) => coin.source === "fallback").length,
    [marketUniverse]
  )
  const coinGeckoMarketCount = useMemo(
    () => marketUniverse.filter((coin) => coin.source === "CoinGecko").length,
    [marketUniverse]
  )
  const btcCoin = marketUniverse.find((coin) => coin.symbol === "BTC") ?? null
  const altCoins = marketUniverse.filter((coin) => !["BTC", "ETH", "USDT", "USDC", "DAI", "USDE", "FDUSD"].includes(coin.symbol))
  const topMovers = useMemo(
    () => [...marketUniverse].sort((left, right) => Math.abs(right.change24h) - Math.abs(left.change24h)).slice(0, 6),
    [marketUniverse]
  )
  const heatmapCoins = useMemo(() => marketUniverse.slice(0, 12), [marketUniverse])
  const marketVolatility = useMemo(() => {
    if (!marketUniverse.length) return null
    return marketUniverse.slice(0, 10).reduce((sum, coin) => sum + Math.abs(coin.change24h), 0) / Math.min(10, marketUniverse.length)
  }, [marketUniverse])
  const altAverageChange = useMemo(() => {
    if (!altCoins.length) return null
    return altCoins.slice(0, 12).reduce((sum, coin) => sum + coin.change24h, 0) / Math.min(12, altCoins.length)
  }, [altCoins])
  const fearGreedProxy = useMemo(() => {
    if (!marketUniverse.length || marketVolatility === null) return null
    const avg = marketUniverse.slice(0, 10).reduce((sum, coin) => sum + coin.change24h, 0) / Math.min(10, marketUniverse.length)
    const btcPenalty = marketGlobal ? Math.max(-12, Math.min(12, (52 - marketGlobal.btcDominance) * 1.2)) : 0
    const rawScore = 50 + avg * 4 + btcPenalty - Math.max(0, marketVolatility - 6) * 2.2
    const score = Math.max(0, Math.min(100, Math.round(rawScore)))
    const label = score >= 70 ? "Greed" : score >= 55 ? "Optimiste" : score >= 40 ? "Neutre" : score >= 25 ? "Prudent" : "Fear"
    return { score, label }
  }, [marketGlobal, marketUniverse, marketVolatility])
  const altseasonStatus = useMemo(() => {
    if (altAverageChange === null) return null
    if (marketGlobal && marketGlobal.btcDominance >= 56) {
      return { label: "BTC dominant", note: "Le capital reste concentre sur le coeur du marche." }
    }
    if (btcCoin && altAverageChange > btcCoin.change24h + 2 && (marketGlobal?.btcDominance ?? 50) < 50) {
      return { label: "Altseason possible", note: "Les altcoins surperforment le beta BTC a court terme." }
    }
    if (btcCoin && altAverageChange > btcCoin.change24h) {
      return { label: "Rotation alt en veille", note: "Les alts se tiennent mieux, mais le signal n'est pas encore large." }
    }
    return { label: "Selection stricte", note: "Le marche demande encore de privilegier les actifs les plus liquides." }
  }, [altAverageChange, btcCoin, marketGlobal])
  const marketTrend = useMemo(() => {
    if (!marketGlobal) return null
    if (marketGlobal.change24h >= 3) return { label: "Trend haussier", tone: "text-success" }
    if (marketGlobal.change24h >= 0) return { label: "Trend constructif", tone: "text-success" }
    if (marketGlobal.change24h > -3) return { label: "Trend fragile", tone: "text-warning" }
    return { label: "Trend sous pression", tone: "text-destructive" }
  }, [marketGlobal])
  const contextualSignals = useMemo(() => {
    const signals = [
      marketVolatility !== null && marketVolatility > 6
        ? "Le marche devient plus nerveux: l'entree progressive garde plus de valeur qu'un achat impulsif."
        : "Le marche reste suffisamment ordonne pour lire la structure des prix sans surreactivite.",
      altseasonStatus?.label === "Altseason possible"
        ? "Les altcoins surperforment actuellement: gardez-les en satellites, pas en coeur de portefeuille."
        : "Le coeur du portefeuille doit rester liquide tant que la rotation alt n'est pas plus large.",
      latestAllocation.length > 0 && latestAllocation.some((allocation) => allocation.percentage >= 25 && !["BTC", "ETH"].includes(allocation.symbol))
        ? "Votre exposition actuelle est agressive sur au moins un satellite: surveillez le sizing avant de renforcer."
        : "L'exposition actuelle reste relativement structuree entre actifs coeur et satellites.",
    ].filter(Boolean)

    return signals.slice(0, 3)
  }, [altseasonStatus, latestAllocation, marketVolatility])

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)
  const planFeatures = PLAN_CAPABILITIES[plan] ?? PLAN_CAPABILITIES.free

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      {selectedAnalysis && <AnalysisDetailModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />}

      {/* Upgrade toast */}
      {showUpgradeToast && (
        <div className="mb-5 p-4 rounded-xl border border-border bg-card shadow-card-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Plan {justUpgraded?.charAt(0).toUpperCase()}{justUpgraded?.slice(1)} activé</p>
              <p className="text-muted-foreground text-xs mt-0.5">Les limites et fonctionnalités de votre nouveau plan sont maintenant actives.</p>
            </div>
          </div>
          <button
            onClick={() => setShowUpgradeToast(false)}
            aria-label="Fermer la notification de plan"
            className="focus-ring rounded-lg p-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Tableau de bord</h1>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Bonjour, {firstName}.
              {marketUpdatedLabel
                ? <span className="ml-1">Live a <span className="font-medium text-foreground tabular-nums">{marketUpdatedLabel}</span>.</span>
                : <span className="ml-1 text-muted-foreground/50">Chargement des prix…</span>
              }
            </p>
          </div>
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-lg transition-opacity hover:opacity-85 shrink-0"
          >
            <AxiomIcon className="h-3.5 w-3.5" />
            Nouvelle analyse
          </Link>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <div className="badge badge-live">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot shrink-0" />
            {marketUpdatedLabel ? `Live · ${marketUpdatedLabel}` : "Connexion…"}
          </div>
          <div className="badge">
            {useSnapshotHistory ? snapshotCountLabel : "Pas encore de courbe portefeuille"}
          </div>
          <div className="badge">
            {krakenMarketCount > 0 ? `Kraken · CoinGecko` : "CoinGecko"}
          </div>
          {realHistoryLabel && (
            <div className="badge">
              {realHistoryStartLabel ? `Historique depuis ${realHistoryStartLabel}` : realHistoryLabel}
            </div>
          )}
          {lastSnapshotLabel && (
            <div className="badge">
              Snapshot {lastSnapshotLabel}
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground/70">
          <span className="h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
          Axiom structure un plan rationnel — ne constitue pas un conseil financier. Risque de perte en capital.
        </div>
      </div>

      {/* Summary cards — 4 top */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {/* Capital */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card-xs transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card animate-fade-in">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Capital investi</p>
              <p data-testid="capital-value" className="text-2xl font-semibold tracking-tight text-foreground">
                {capital > 0 ? `${capital.toLocaleString("fr-FR")}€` : "—"}
              </p>
              {portfolioChange24h !== null && portfolioValueChange !== null ? (
                <>
                  <div className={cn("flex flex-wrap items-center gap-1.5 text-[12px] font-medium mt-1", portfolioChange24h >= 0 ? "text-success" : "text-destructive")}>
                    {portfolioChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span className="font-semibold tabular-nums">{portfolioChange24h >= 0 ? "+" : ""}{portfolioChange24h.toFixed(2)}%</span>
                    <span className="text-muted-foreground font-normal">·</span>
                    <span className="font-semibold tabular-nums">{fmtPortfolioEuroDelta(portfolioValueChange)}</span>
                    <span className="inline-flex items-center rounded-full border border-border bg-secondary px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {oneDayBadgeLabel}
                    </span>
                  </div>
                  {oneDayUsesRecentFallback && (
                    <p className="text-[11px] text-muted-foreground">Dernières données disponibles</p>
                  )}
                </>
              ) : capital === 0 ? (
                <p className="text-[11px] text-muted-foreground">Configurez votre profil</p>
              ) : (
                <p className="text-[11px] text-muted-foreground">
                  {timeframeAvailability["1D"].reason || "Période 24h indisponible"}
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-secondary px-3 py-2.5 text-[11px] text-muted-foreground">
            {useSnapshotHistory
              ? `${realHistoryLabel ?? "Historique reel demarre"} · ${snapshotCountLabel}`
              : "Pas encore d'historique portefeuille. Le suivi commencera apres la premiere analyse."}
          </div>
        </div>

        {/* Score IA */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card-xs transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card animate-fade-in" style={{ animationDelay: "40ms" }}>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Score IA</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{avgScore ? `${avgScore}/100` : "—"}</p>
              <p className="text-[11px] text-muted-foreground">
                {avgScore
                  ? avgScore >= 80 ? "Signal d'achat fort" : avgScore >= 60 ? "Signal modéré" : "Signal faible"
                  : "Aucune analyse"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground shrink-0">
              <Brain className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-secondary px-3 py-2.5 text-[11px] text-muted-foreground">
            {lastAnalysis ? `Derniere analyse ${new Date(lastAnalysis.created_at).toLocaleDateString(DISPLAY_LOCALE, { day: "2-digit", month: "short", timeZone: DISPLAY_TIME_ZONE })}` : "Le score apparait apres la premiere analyse reelle."}
          </div>
        </div>

        {/* Analyses ce mois */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card-xs transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card animate-fade-in" style={{ animationDelay: "80ms" }}>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Analyses / mois</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{monthlyCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {analysesRemaining === null
                  ? "Illimitées"
                  : analysesRemaining === 0
                  ? "Quota atteint"
                  : `${analysesRemaining} restante${analysesRemaining > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground shrink-0">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-secondary px-3 py-2.5 text-[11px] text-muted-foreground">
            {analysesRemaining === null ? "Cadence libre pour iterer sur ta strategie." : `${planLabel} te laisse ${analysesRemaining} analyse${analysesRemaining > 1 ? "s" : ""} avant le reset mensuel.`}
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-card-xs transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card animate-fade-in" style={{ animationDelay: "120ms" }}>
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Votre plan</p>
              <p className="text-2xl font-semibold tracking-tight text-foreground">{planLabel}</p>
              <p className="text-[11px] text-muted-foreground">
                {plan === "free" ? "Gratuit" : subscription?.status === "active" ? "Actif" : "Abonnement"}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary text-muted-foreground shrink-0">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border bg-secondary px-3 py-2.5 text-[11px] text-muted-foreground">
            {plan === "free"
              ? "Teste le produit, les donnees marche et la logique d'allocation avant d'aller plus loin."
              : subscription?.status === "active"
              ? "Acces actif aux fonctions de suivi et d'analyse de ton plan."
              : "Ton plan reste visible, mais certaines fonctions peuvent etre limitees."}
          </div>
        </div>
      </div>

      {/* Summary cards — 3 bottom */}
      <div className="grid gap-3 lg:grid-cols-3 mb-4">

        {/* Statut marché */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse-dot" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Statut Marché</span>
          </div>
          {marketGlobal ? (
            <div className="space-y-2">
              <div className="divide-y divide-border">
              {[
                { label: "Dominance BTC", value: `${marketGlobal.btcDominance.toFixed(1)}%` },
                { label: "Cap. Totale", value: fmtCap(marketGlobal.totalMarketCapUsd) },
                {
                  label: "Variation 24h",
                  value: `${marketGlobal.change24h >= 0 ? "+" : ""}${marketGlobal.change24h.toFixed(1)}%`,
                  positive: marketGlobal.change24h >= 0,
                },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-1.5">
                    <span className="text-[11px] text-muted-foreground">{item.label}</span>
                    <span className={cn(
                      "text-[12px] font-medium",
                      item.positive === true ? "text-success" : item.positive === false ? "text-destructive" : "text-foreground"
                    )}>{item.value}</span>
                  </div>
                ))}
              </div>

              {marketDecision && (
                <div className="rounded-lg bg-secondary p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[11px] font-medium text-muted-foreground">Moteur IA</span>
                    <span className="text-[12px] font-semibold text-foreground">{marketDecision.label}</span>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{marketDecision.executionNow}</p>
                  <p className="mt-2 text-[11px] font-medium text-foreground">
                    BTC {marketDecision.allocation.BTC}% · ETH {marketDecision.allocation.ETH}% · Alt {marketDecision.allocation.ALT}%
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[12px] text-muted-foreground py-2">Données indisponibles</p>
          )}
        </div>

        {/* Sentiment */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Indice de Sentiment</span>
            {sentiment && <span className={cn("text-[10px] font-medium", sentiment.color)}>{sentiment.label}</span>}
          </div>
          {sentiment ? (
            <>
              <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-destructive via-yellow-400 to-success overflow-hidden mb-2">
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-foreground rounded-full shadow-sm"
                  style={{ left: `${sentiment.score}%` }}
                />
              </div>
              <div className="flex justify-between">
                <span className="text-[9px] text-muted-foreground">Extrême Peur</span>
                <span className="text-[12px] font-bold text-foreground">{sentiment.score}</span>
                <span className="text-[9px] text-muted-foreground">Extrême Euphorie</span>
              </div>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground py-3">Données indisponibles</p>
          )}
        </div>

        {/* Plan details */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-3.5 w-3.5 text-warning" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Votre Plan</span>
          </div>
          <div className="divide-y divide-border">
            {[
              { label: "Plan actuel", value: planLabel },
              { label: "Analyses utilisées", value: planLimit === null ? `${monthlyCount} / ∞` : `${monthlyCount} / ${planLimit}` },
              { label: "Historique visible", value: `${historyLimit} analyse${historyLimit > 1 ? "s" : ""}` },
              {
                label: "Renouvellement",
                value: subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString(DISPLAY_LOCALE, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      timeZone: DISPLAY_TIME_ZONE,
                    })
                  : plan === "free" ? "Gratuit" : "—",
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[12px] font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-border grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              {planFeatures.included.map((item) => (
                <div key={item} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-success shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            {planFeatures.locked.length > 0 && (
              <div className="space-y-1.5">
                {planFeatures.locked.map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    <X className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">{planFeatures.upsell}</p>
        </div>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Terminal marche</p>
              <h2 className="mt-1 text-[15px] font-semibold text-foreground">Lecture financee par les donnees reelles</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-muted-foreground">
                {marketTrend ? <span className={cn("font-semibold", marketTrend.tone)}>{marketTrend.label}</span> : "Trend indisponible"}
              </span>
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-muted-foreground">
                Source : {krakenMarketCount > 0 ? "Kraken + fallback CoinGecko" : "CoinGecko"}
              </span>
              <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-muted-foreground">
                {trackedMarketCount} actifs suivis
              </span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-secondary/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Marche suivi</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {trackedMarketCount}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {positiveMarketCount} en hausse · {negativeMarketCount} en baisse
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">BTC dominance</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {marketGlobal ? `${marketGlobal.btcDominance.toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {marketGlobal && marketGlobal.btcDominance >= 55 ? "Marche plutot defensif" : "Plus de place pour les alts si le flux suit"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Fear &amp; Greed</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {fearGreedProxy ? `${fearGreedProxy.score}/100` : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {fearGreedProxy ? `${fearGreedProxy.label} (proxy interne)` : "Indisponible si le flux marche est incomplet"}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-secondary/60 p-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Volatilite moyenne</p>
              <p className="mt-2 text-lg font-semibold text-foreground">
                {marketVolatility !== null ? `${marketVolatility.toFixed(1)}%` : "—"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {marketVolatility !== null && marketVolatility > 6 ? "Regime nerveux" : "Regime plutot lisible"}
              </p>
            </div>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-background px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Statut fallback</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {fallbackMarketCount > 0 ? `${fallbackMarketCount} actif(s)` : "Aucun actif"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {fallbackMarketCount > 0 ? "CoinGecko prend le relais quand Kraken ne couvre pas la paire." : "Kraken couvre le coeur du flux actuellement."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mouvements forts</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {topMovers[0] ? `${topMovers[0].symbol} ${topMovers[0].change24h >= 0 ? "+" : ""}${topMovers[0].change24h.toFixed(1)}%` : "Indisponible"}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Lecture des accelerations de prix sur 24 h.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-background px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source data</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {krakenMarketCount} Kraken · {coinGeckoMarketCount} CoinGecko
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Derniere mise a jour {marketUpdatedLabel ?? "en attente"}.
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-foreground">Mouvements forts</p>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">24h</span>
              </div>
              <div className="space-y-2.5">
                {topMovers.slice(0, 5).map((coin) => (
                  <div key={coin.id} className="grid grid-cols-[minmax(0,1fr)_84px_72px] items-center gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-semibold text-foreground">{coin.symbol}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{coin.name}</span>
                      </div>
                    </div>
                    <div className="flex justify-center">
                      <SparklineChart
                        symbol={coin.symbol}
                        currentPrice={coin.price}
                        change24h={coin.change24h}
                        sparklineData={coin.sparkline7d}
                        width={84}
                        height={32}
                      />
                    </div>
                    <div className="text-right">
                      <p className={cn("text-[12px] font-semibold tabular-nums", coin.change24h >= 0 ? "text-success" : "text-destructive")}>
                        {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">{fmtPrice(coin.price)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-background p-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-foreground">Heatmap crypto</p>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Top market cap</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {heatmapCoins.map((coin) => (
                  <div
                    key={coin.id}
                    className={cn(
                      "rounded-xl border px-3 py-3 transition-transform hover:-translate-y-0.5",
                      coin.change24h >= 0 ? "border-emerald-200 bg-emerald-50/70" : "border-red-200 bg-red-50/70"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-foreground">{coin.symbol}</span>
                      <span className={cn("text-[10px] font-semibold", coin.change24h >= 0 ? "text-success" : "text-destructive")}>
                        {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-1 text-[10px] text-muted-foreground">{fmtCapShort(coin.marketCap)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="h-4 w-4 text-foreground" />
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">IA contextuelle</p>
              <h3 className="text-[15px] font-semibold text-foreground">Ce que le marche implique pour vous</h3>
            </div>
          </div>
          <div className="space-y-3">
            {contextualSignals.map((signal, index) => (
              <div key={signal} className="rounded-xl border border-border bg-secondary/50 px-3 py-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Signal {index + 1}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-foreground">{signal}</p>
              </div>
            ))}
            <div className="rounded-xl border border-border bg-background px-3 py-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Infrastructure</p>
              <ul className="mt-2 space-y-2 text-[11px] text-muted-foreground">
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 shrink-0" /><span>Prix live issus de Kraken quand la paire existe, sinon CoinGecko fallback visible par actif.</span></li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 shrink-0" /><span>Historique portefeuille base uniquement sur portfolio_history et snapshots reels.</span></li>
                <li className="flex items-start gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 shrink-0" /><span>Si une source manque, le dashboard l&apos;assume au lieu de fabriquer un signal.</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3 mb-4">
        <div className="lg:col-span-2">
          <ProfessionalMarketChart
            portfolioSnapshots={portfolioSnapshots}
            marketReferenceAsset={marketReferenceAsset}
            marketSeriesShort={marketSeriesShort}
            marketSeriesAll={marketSeriesAll}
            capital={capital}
            lastSnapshotLabel={lastSnapshotLabel}
            marketUpdatedLabel={marketUpdatedLabel}
          />
        </div>
        <div>
          {/* Allocation chart */}
          {lastAnalysis ? (
            <div className="rounded-xl border border-border bg-card p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-foreground">Allocation actuelle</h3>
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-md tabular-nums",
                  lastAnalysis.total_score >= 85 ? "bg-secondary text-success"
                    : lastAnalysis.total_score >= 70 ? "bg-secondary text-warning"
                    : "bg-secondary text-destructive"
                )}>
                  {lastAnalysis.total_score}/100
                </span>
              </div>
                <div className="mb-4 h-44 min-w-0">
                  <PortfolioChart
                    allocations={lastAnalysis.allocations.map(a => ({ asset: a.symbol, percentage: a.percentage }))}
                  />
              </div>
              <div className="space-y-2">
                {lastAnalysis.allocations.slice(0, 5).map(a => (
                  <div key={a.symbol} className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", ASSET_BAR[a.symbol] ?? "bg-slate-400")} />
                    <span className={cn("text-[11px] font-semibold w-10 shrink-0", ASSET_TEXT[a.symbol] ?? "text-muted-foreground")}>{a.symbol}</span>
                    <div className="flex-1 h-[4px] bg-secondary rounded-full overflow-hidden">
                      <div className={cn("h-[4px] rounded-full", ASSET_BAR[a.symbol] ?? "bg-slate-400")} style={{ width: `${a.percentage}%` }} />
                    </div>
                    <span className="text-[11px] font-medium text-muted-foreground tabular-nums w-8 text-right">{a.percentage}%</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-border bg-secondary/50 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Brain className="h-3.5 w-3.5 text-foreground" />
                  <p className="text-[11px] font-semibold text-foreground">Pourquoi cette allocation ?</p>
                </div>
                <ul className="space-y-2">
                  {allocationRationale.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground/70 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => setSelectedAnalysis(lastAnalysis)}
                className="w-full mt-3 text-[11px] text-muted-foreground hover:text-foreground font-medium transition-colors text-center flex items-center justify-center gap-1"
              >
                Voir l&apos;analyse complète <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-6 h-full flex flex-col items-center justify-center text-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <Brain className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-[13px] font-medium text-foreground">Aucune analyse</p>
              <p className="text-[11px] text-muted-foreground">Lancez votre première analyse IA pour voir votre allocation recommandée.</p>
              <Link href="/advisor" className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-85 transition-opacity">
                Démarrer <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <WhyNowCard
          marketGlobal={marketGlobal}
          positiveAssets={positiveMarketCount}
          negativeAssets={negativeMarketCount}
          marketVolatility={marketVolatility}
          latestAllocation={latestAllocation}
        />
        <div className="grid gap-4">
          <SinceAnalysisCard
            lastAnalysisDate={lastAnalysis?.created_at ?? null}
            portfolioSnapshots={portfolioSnapshots}
            btcSeries={btcSeriesAll}
            ethSeries={ethSeriesAll}
          />
          <DisciplineCard
            lastAnalysisDate={lastAnalysis?.created_at ?? null}
            snapshotCount={normalizedPortfolioSnapshots.length}
            analysisCount={analyses.length}
          />
        </div>
      </div>

      {/* Market + Sidebar row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3 mb-4">
        <div className="lg:col-span-2">
          <MarketOverviewTable cryptoPrices={cryptoPrices} />
        </div>
        <div className="space-y-4">

          {/* Recommendation */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-semibold text-foreground">
                {lastAnalysis && (advisorOutput.executionNow[0] || advisorOutput.strategy || advisorOutput.nextReview || advisorOutput.errorsToAvoid.length > 0)
                  ? "Recommandations de l\u2019IA"
                  : lastAnalysis ? "Derni\u00e8re recommandation" : "Commencer l\u2019analyse"}
              </span>
            </div>
            {lastAnalysis && (advisorOutput.executionNow[0] || advisorOutput.strategy || advisorOutput.nextReview || advisorOutput.errorsToAvoid.length > 0) ? (
              <div className="space-y-3 mb-4">
                {advisorOutput.executionNow[0] && (
                  <div className="rounded-xl border border-border bg-secondary/60 px-3 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Action principale</span>
                    </div>
                    <p className="text-[12px] font-semibold text-foreground leading-relaxed">
                      Acheter{" "}
                      <span className={cn("font-bold", ASSET_TEXT[advisorOutput.executionNow[0].crypto] ?? "text-foreground")}>
                        {advisorOutput.executionNow[0].crypto}
                      </span>
                      {advisorOutput.executionNow[0].amount ? ` - ${advisorOutput.executionNow[0].amount}` : ""}
                    </p>
                  </div>
                )}

                {advisorOutput.strategy && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Brain className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{"Strat\u00e9gie"}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{advisorOutput.strategy}</p>
                  </div>
                )}

                {advisorOutput.nextReview && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{"Prochaine \u00e9tape"}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{advisorOutput.nextReview}</p>
                  </div>
                )}

                {advisorOutput.errorsToAvoid.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{"\u00c0 \u00e9viter"}</span>
                    </div>
                    <ul className="space-y-1.5">
                      {advisorOutput.errorsToAvoid.map((item, index) => (
                        <li key={`${item}-${index}`} className="flex items-start gap-2 text-[12px] text-muted-foreground leading-relaxed">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-300 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
                {lastAnalysis?.recommendations?.[0]
                  ?? "Configurez votre profil investisseur et obtenez une allocation IA personnalis\u00e9e."}
              </p>
            )}
            <Link
              href="/advisor"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-85 transition-opacity"
            >
              {lastAnalysis ? "Relancer l\u2019analyse" : "Lancer l\u2019analyse"}
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {/* Upsell */}
          {plan === "free" && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Zap className="h-3.5 w-3.5 text-warning" />
                <span className="text-[13px] font-semibold text-foreground">Passer au Pro</span>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">
                20 analyses/mois · signal marché Pro · export PDF · historique 10 analyses.
              </p>
              <Link
                href="/pricing"
                className="block text-center text-xs py-2 bg-foreground text-background rounded-lg font-semibold hover:opacity-85 transition-opacity"
              >
                Voir les plans →
              </Link>
            </div>
          )}
          {plan === "pro" && (
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="h-3.5 w-3.5 text-warning" />
                <span className="text-[13px] font-semibold text-foreground">Premium disponible</span>
              </div>
              <p className="text-[12px] text-muted-foreground mb-3">
                Projections de scénarios · alertes de risque · stratégie avancée Premium.
              </p>
              <Link
                href="/pricing"
                className="block text-center text-xs py-2 border border-border rounded-lg font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Voir Premium →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Retention cards — Market Weekly + Portfolio Drift */}
      {lastAnalysis && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <MarketWeeklyCard
            cryptoPrices={cryptoPrices}
            marketGlobal={marketGlobal}
            lastAnalysisAt={lastAnalysis.created_at}
          />
          <PortfolioDriftCard
            targetAllocation={lastAnalysis.allocations ?? []}
            cryptoPrices={cryptoPrices}
          />
        </div>
      )}

      {/* Recent Analyses */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-[15px] font-semibold text-foreground">Analyses récentes</h3>
          {visibleAnalyses.length > 0 && (
            <Link href="/advisor" className="text-[11px] font-medium text-accent hover:underline">
              Nouvelle →
            </Link>
          )}
        </div>

        {visibleAnalyses.length === 0 ? (
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-secondary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-[13px] text-muted-foreground">Aucune analyse pour l&apos;instant</p>
            <Link href="/advisor" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-foreground text-background rounded-lg hover:opacity-85 transition-opacity">
              Lancer →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {visibleAnalyses.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAnalysis(a)}
                className="w-full px-4 py-3.5 hover:bg-secondary/40 transition-colors text-left group flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                    <AxiomIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {new Date(a.created_at).toLocaleDateString(DISPLAY_LOCALE, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: DISPLAY_TIME_ZONE,
                      })}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-0.5">
                      {(a.allocations ?? []).slice(0, 4).map(al => (
                        <span key={al.symbol} className="text-[10px] text-muted-foreground">
                          {al.symbol} <span className="font-medium text-foreground">{al.percentage}%</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded-md tabular-nums",
                    a.total_score >= 85 ? "bg-secondary text-success"
                      : a.total_score >= 70 ? "bg-secondary text-warning"
                      : "bg-secondary text-destructive"
                  )}>
                    {a.total_score}/100
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </button>
            ))}
            {plan === "free" && analyses.length > historyLimit && (
              <div className="px-4 py-3 text-center">
                <Link href="/pricing" className="text-[11px] font-medium text-accent hover:underline">
                  Débloquer l&apos;historique complet avec Pro →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Analysis Detail Modal ─────────────────────────────────────────────────────
function AnalysisDetailModal({ analysis, onClose }: { analysis: Analysis; onClose: () => void }) {
  const profile    = (analysis.investor_profile ?? {}) as Record<string, unknown>
  const capital    = String(profile.capital ?? "")
  const monthly    = String(profile.monthlyContribution ?? "")
  const goals      = Array.isArray(profile.goals) ? profile.goals.map(String) : []
  const expLabel   = { beginner: "Débutant", intermediate: "Intermédiaire", expert: "Expert" }[String(profile.experience)] ?? ""
  const stratLabel = { lumpsum: "Lump-sum", "dca-monthly": "DCA mensuel", "dca-weekly": "DCA hebdo" }[String(profile.buyStrategy)] ?? ""
  const riskLabel  = { conservative: "Conservateur", moderate: "Modéré", aggressive: "Agressif" }[String(profile.riskTolerance)] ?? "Modéré"
  const horizLabel = { short: "Court terme", medium: "Moyen terme", long: "Long terme" }[String(profile.horizon)] ?? "Moyen terme"
  const modelLabel = analysis.model_used?.includes("opus") ? "Claude Opus 4.7"
    : analysis.model_used?.includes("sonnet") ? "Claude Sonnet 4.6" : "Claude Haiku 4.5"

  const scoreColor = analysis.total_score >= 85 ? "bg-success" : analysis.total_score >= 70 ? "bg-warning" : "bg-destructive"
  const scoreText  = analysis.total_score >= 85 ? "text-success"
    : analysis.total_score >= 70 ? "text-warning" : "text-destructive"

  const items = [
    { label: "Risque",     value: riskLabel },
    { label: "Horizon",    value: horizLabel },
    capital    ? { label: "Capital",    value: `${capital}€` }      : null,
    monthly    ? { label: "DCA",        value: `${monthly}€/mois` }  : null,
    expLabel   ? { label: "Expérience", value: expLabel }            : null,
    stratLabel ? { label: "Stratégie",  value: stratLabel }          : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border w-full sm:rounded-2xl sm:max-w-lg sm:max-h-[88vh] max-h-[92vh] flex flex-col shadow-2xl rounded-t-2xl overflow-hidden">
        <div className={cn("h-[3px] shrink-0", scoreColor)} />

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-semibold text-foreground">
              {new Date(analysis.created_at).toLocaleDateString(DISPLAY_LOCALE, {
                day: "numeric",
                month: "long",
                year: "numeric",
                timeZone: DISPLAY_TIME_ZONE,
              })}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{modelLabel} · {goals.slice(0, 2).join(", ")}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className={cn("text-2xl font-bold tabular-nums leading-none", scoreText)}>{analysis.total_score}</div>
              <div className="text-[10px] text-muted-foreground">/100</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer le detail de l'analyse"
              className="focus-ring h-8 w-8 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.label} className="px-3 py-2.5 bg-secondary rounded-lg">
                <p className="text-[10px] text-muted-foreground mb-1">{item.label}</p>
                <p className="text-sm font-medium text-foreground">{item.value}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Allocation</h3>
            <div className="space-y-3">
              {(analysis.allocations ?? []).map((a) => (
                <div key={a.symbol}>
                  <div className="flex justify-between mb-1.5">
                    <span className={cn("text-sm font-semibold", ASSET_TEXT[a.symbol] ?? "text-foreground")}>{a.symbol}</span>
                    <span className="text-sm font-medium text-foreground tabular-nums">{a.percentage}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className={cn("h-1.5 rounded-full", ASSET_BAR[a.symbol] ?? "bg-secondary-foreground")} style={{ width: `${a.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {analysis.market_context && (
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Analyse</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{analysis.market_context}</p>
            </div>
          )}

          {(analysis.recommendations ?? []).length > 0 && (
            <div>
              <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Plan d&apos;action</h3>
              <ol className="space-y-3">
                {(analysis.recommendations ?? []).map((rec, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[10px] font-bold text-muted-foreground shrink-0 pt-0.5 tabular-nums w-5">{String(i + 1).padStart(2, "0")}</span>
                    <p className="text-sm text-foreground leading-relaxed">{rec}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {(analysis.warnings ?? [])[0] && (
            <p className="text-xs text-muted-foreground leading-relaxed pb-2">{analysis.warnings![0]}</p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0">
          <Link
            href="/advisor"
            className="block w-full text-center py-3 bg-foreground text-background font-semibold text-sm rounded-xl hover:opacity-85 transition-opacity"
          >
            Relancer une analyse →
          </Link>
        </div>
      </div>
    </div>
  )
}

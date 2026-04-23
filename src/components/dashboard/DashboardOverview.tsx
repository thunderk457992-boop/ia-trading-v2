"use client"

import Link from "next/link"
import {
  ArrowRight, Check, X, ChevronRight, TrendingUp, TrendingDown,
  Wallet, Activity, Brain, Percent, Crown, BarChart2,
  Search, RefreshCw, Star, StarOff, ChevronUp, ChevronDown,
  Maximize2, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect, useMemo, useId } from "react"
import { useRouter } from "next/navigation"
import type { CryptoPrice, MarketGlobal } from "@/lib/coingecko"
import { SparklineChart } from "@/components/SparklineChart"
import { PortfolioChart } from "@/components/advisor/PortfolioChart"
import {
  AreaChart, Area, ResponsiveContainer, Tooltip as RechartsTooltip,
  XAxis, YAxis, CartesianGrid,
} from "recharts"

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
interface Props {
  user: { email?: string }
  profile: { full_name?: string; plan?: string } | null
  analyses: Analysis[]
  subscription: Subscription | null
  justUpgraded: string | null
  monthlyCount: number
  cryptoPrices: CryptoPrice[]
  marketGlobal: MarketGlobal | null
  marketFetchedAt?: number
}

// ── Constants ─────────────────────────────────────────────────────────────────
const ASSET_BAR: Record<string, string> = {
  BTC: "bg-amber-500", ETH: "bg-blue-500", SOL: "bg-purple-500",
  BNB: "bg-yellow-500", XRP: "bg-sky-500", ADA: "bg-blue-600",
  AVAX: "bg-red-500", DOT: "bg-pink-500", LINK: "bg-blue-700",
  NEAR: "bg-green-500", MATIC: "bg-violet-500",
}
const ASSET_TEXT: Record<string, string> = {
  BTC: "text-amber-600", ETH: "text-blue-600", SOL: "text-purple-600",
  BNB: "text-yellow-600", XRP: "text-sky-600", ADA: "text-blue-700",
  AVAX: "text-red-600", DOT: "text-pink-600", LINK: "text-blue-700",
  NEAR: "text-green-600", MATIC: "text-violet-600",
}
const HISTORY_LIMIT: Record<string, number> = { free: 3, pro: 10, premium: 20 }

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtPrice(p: number) {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 0 })
  if (p >= 1)    return p.toFixed(2)
  return p.toFixed(4)
}
function fmtCap(n: number) {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}
function fmtCapShort(n: number) {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `${(n / 1e9).toFixed(0)}B`
  return `${(n / 1e6).toFixed(0)}M`
}

function VelaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none">
      <path d="M2 4L8 13L14 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Portfolio Chart ───────────────────────────────────────────────────────────
const TIMEFRAMES = ["1H", "1D", "7D", "1M", "3M", "1Y", "ALL"] as const
type TF = typeof TIMEFRAMES[number]
const ENABLED_TF: TF[] = ["1D", "7D"]

function PortfolioLineChart({
  allocations, cryptoPrices, capital, lastUpdated,
}: {
  allocations: Array<{ symbol: string; percentage: number }>
  cryptoPrices: CryptoPrice[]
  capital: number
  lastUpdated: string | null
}) {
  const [tf, setTf] = useState<TF>("7D")
  const [showBtc, setShowBtc] = useState(false)
  const [showEth, setShowEth] = useState(false)
  const uid = useId().replace(/:/g, "")

  const mergedData = useMemo(() => {
    if (!allocations.length || !cryptoPrices.length) return []

    // Portfolio weighted % performance
    const weighted: number[] = []
    let totalW = 0
    allocations.forEach((alloc) => {
      const cp = cryptoPrices.find(p => p.symbol === alloc.symbol)
      if (!cp?.sparkline7d?.length) return
      const base = cp.sparkline7d[0]
      if (!base) return
      const w = alloc.percentage / 100
      totalW += w
      cp.sparkline7d.forEach((v, i) => {
        weighted[i] = (weighted[i] ?? 0) + ((v - base) / base) * 100 * w
      })
    })
    if (!weighted.length || totalW < 0.01) return []

    const raw = tf === "1D" ? weighted.slice(-24) : weighted
    const step = Math.max(1, Math.floor(raw.length / 60))
    const sampled = raw.filter((_, i) => i % step === 0 || i === raw.length - 1)
    const base0 = sampled[0] ?? 0
    const portfolioPoints = sampled.map(v => parseFloat((v - base0).toFixed(3)))

    // BTC normalized
    const btcCp = cryptoPrices.find(p => p.symbol === "BTC")
    let btcPoints: (number | null)[] = portfolioPoints.map(() => null)
    if (btcCp?.sparkline7d?.length) {
      const btcRaw = tf === "1D" ? btcCp.sparkline7d.slice(-24) : btcCp.sparkline7d
      const btcStep = Math.max(1, Math.floor(btcRaw.length / portfolioPoints.length))
      const btcSampled = btcRaw.filter((_, i) => i % btcStep === 0 || i === btcRaw.length - 1)
      const btcBase = btcSampled[0] ?? 1
      const resampledBtc = portfolioPoints.map((_, i) => {
        const idx = Math.min(Math.round(i * (btcSampled.length - 1) / Math.max(1, portfolioPoints.length - 1)), btcSampled.length - 1)
        return btcBase > 0 ? parseFloat(((btcSampled[idx] - btcBase) / btcBase * 100).toFixed(3)) : null
      })
      btcPoints = resampledBtc
    }

    // ETH normalized
    const ethCp = cryptoPrices.find(p => p.symbol === "ETH")
    let ethPoints: (number | null)[] = portfolioPoints.map(() => null)
    if (ethCp?.sparkline7d?.length) {
      const ethRaw = tf === "1D" ? ethCp.sparkline7d.slice(-24) : ethCp.sparkline7d
      const ethStep = Math.max(1, Math.floor(ethRaw.length / portfolioPoints.length))
      const ethSampled = ethRaw.filter((_, i) => i % ethStep === 0 || i === ethRaw.length - 1)
      const ethBase = ethSampled[0] ?? 1
      const resampledEth = portfolioPoints.map((_, i) => {
        const idx = Math.min(Math.round(i * (ethSampled.length - 1) / Math.max(1, portfolioPoints.length - 1)), ethSampled.length - 1)
        return ethBase > 0 ? parseFloat(((ethSampled[idx] - ethBase) / ethBase * 100).toFixed(3)) : null
      })
      ethPoints = resampledEth
    }

    // X-axis labels
    return portfolioPoints.map((v, i) => {
      const ratio = portfolioPoints.length > 1 ? i / (portfolioPoints.length - 1) : 0
      const name = tf === "1D"
        ? `${String(Math.round(ratio * 24)).padStart(2, "0")}h`
        : (["L", "M", "Me", "J", "V", "S", "D"] as const)[Math.min(Math.round(ratio * 6), 6)]
      return { name, portfolio: v, btc: btcPoints[i], eth: ethPoints[i] }
    })
  }, [allocations, cryptoPrices, tf])

  const lastValue = mergedData[mergedData.length - 1]?.portfolio ?? 0
  const isUp = lastValue >= 0
  const maxVal = mergedData.length ? Math.max(...mergedData.map(d => d.portfolio)) : 0
  const minVal = mergedData.length ? Math.min(...mergedData.map(d => d.portfolio)) : 0
  const color = isUp ? "#3b82f6" : "#ef4444"
  const gradId = `grad-${uid}`

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Performance Portfolio</span>
              {cryptoPrices.length > 0 && (
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse-dot" />
              )}
            </div>
            {mergedData.length > 0 ? (
              <>
                <div className="flex items-baseline gap-3">
                  <h2 className={cn("text-3xl font-bold tracking-tight tabular-nums", isUp ? "text-success" : "text-destructive")}>
                    {isUp ? "+" : ""}{lastValue.toFixed(2)}%
                  </h2>
                  <div className={cn("flex items-center gap-0.5 text-[13px] font-semibold", isUp ? "text-success" : "text-destructive")}>
                    {isUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {tf === "1D" ? "24h" : "7J"}
                  </div>
                </div>
                {capital > 0 && (
                  <p className="text-[12px] text-muted-foreground mt-1">
                    Capital&nbsp;
                    <span className="font-medium text-foreground">{capital.toLocaleString("fr-FR")}€</span>
                    {' '}→{' '}
                    <span className={cn("font-semibold tabular-nums", isUp ? "text-success" : "text-destructive")}>
                      {isUp ? "+" : ""}{(capital * lastValue / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
                    </span>
                    {' '}
                    <span className="text-muted-foreground">{tf === "1D" ? "sur 24h" : "sur 7J"}</span>
                  </p>
                )}
              </>
            ) : (
              <p className="text-[15px] text-muted-foreground mt-1">Lancez une analyse IA pour voir votre portfolio</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-secondary/30">
              {TIMEFRAMES.map((t) => {
                const enabled = ENABLED_TF.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => enabled && setTf(t)}
                    disabled={!enabled}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                      t === tf
                        ? "bg-foreground text-background shadow-sm"
                        : enabled
                        ? "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                        : "text-muted-foreground/30 cursor-not-allowed"
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {mergedData.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              <span className="text-[11px] font-medium text-foreground">Portfolio</span>
              <span className={cn("text-[11px] font-semibold", isUp ? "text-success" : "text-destructive")}>
                {isUp ? "+" : ""}{lastValue.toFixed(2)}%
              </span>
            </div>
            <button
              onClick={() => setShowBtc(!showBtc)}
              className={cn("flex items-center gap-1.5 transition-opacity", showBtc ? "opacity-100" : "opacity-40")}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <span className="text-[11px] font-medium text-foreground">BTC</span>
            </button>
            <button
              onClick={() => setShowEth(!showEth)}
              className={cn("flex items-center gap-1.5 transition-opacity", showEth ? "opacity-100" : "opacity-40")}
            >
              <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
              <span className="text-[11px] font-medium text-foreground">ETH</span>
            </button>
            <div className="ml-auto flex items-center gap-4 text-[11px]">
              <div>
                <span className="text-muted-foreground">Max&nbsp;</span>
                <span className={cn("font-medium tabular-nums", maxVal >= 0 ? "text-success" : "text-destructive")}>
                  {maxVal >= 0 ? "+" : ""}{maxVal.toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Min&nbsp;</span>
                <span className={cn("font-medium tabular-nums", minVal >= 0 ? "text-success" : "text-destructive")}>
                  {minVal >= 0 ? "+" : ""}{minVal.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {mergedData.length > 0 ? (
        <div className="h-[300px] w-full p-4 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${gradId}-btc`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f97316" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id={`${gradId}-eth`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                dy={8}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`}
                dx={-4}
                width={52}
                domain={["auto", "auto"]}
              />
              <RechartsTooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  const KEY_LABEL: Record<string, string> = { portfolio: "Portfolio", btc: "BTC", eth: "ETH" }
                  return (
                    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
                      <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{label}</p>
                      {payload.map((entry, i) => {
                        const val = entry.value as number | null
                        if (val === null || val === undefined) return null
                        return (
                          <div key={i} className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-1.5">
                              <div className="h-2 w-2 rounded-full" style={{ background: entry.stroke as string }} />
                              <span className="text-[11px] text-muted-foreground">
                                {KEY_LABEL[entry.dataKey as string] ?? entry.dataKey}
                              </span>
                            </div>
                            <span className={cn(
                              "text-[12px] font-medium tabular-nums",
                              val >= 0 ? "text-success" : "text-destructive"
                            )}>
                              {val >= 0 ? "+" : ""}{val.toFixed(2)}%
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                }}
                cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="portfolio"
                stroke={color}
                strokeWidth={2}
                fill={`url(#${gradId})`}
                dot={false}
                activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
              />
              {showBtc && (
                <Area
                  type="monotone"
                  dataKey="btc"
                  stroke="#f97316"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  fill={`url(#${gradId}-btc)`}
                  dot={false}
                />
              )}
              {showEth && (
                <Area
                  type="monotone"
                  dataKey="eth"
                  stroke="#a855f7"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  fill={`url(#${gradId}-eth)`}
                  dot={false}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
            <BarChart2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-[13px] text-muted-foreground">Lancez une analyse pour voir votre portfolio</p>
          <Link href="/advisor" className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-xs font-bold rounded-lg transition-colors hover:opacity-90">
            Lancer l&apos;analyse <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}

      {/* Data source footer */}
      <div className="px-5 py-2 border-t border-border/60 flex items-center flex-wrap gap-x-3 gap-y-1">
        <span className="text-[10px] text-muted-foreground/60">Source&nbsp;: CoinGecko</span>
        <span className="text-[10px] text-muted-foreground/40">·</span>
        <span className="text-[10px] text-muted-foreground/60">Actualisation auto 30s</span>
        {lastUpdated && (
          <>
            <span className="text-[10px] text-muted-foreground/40">·</span>
            <span className="text-[10px] text-muted-foreground/60">Dernière mise à jour&nbsp;: {lastUpdated}</span>
          </>
        )}
      </div>
    </div>
  )
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
    let data = cryptoPrices.map((c, i) => ({ ...c, rank: i + 1 }))

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
          <p className="text-[11px] text-muted-foreground">Prix en direct avec performance 24h</p>
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
                        const s = new Set(prev); inWl ? s.delete(c.id) : s.add(c.id); return s
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
                        <p className="text-[10px] text-muted-foreground">{c.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <span className="text-[13px] font-medium text-foreground tabular-nums">${fmtPrice(c.price)}</span>
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
        <span className="text-[11px] text-muted-foreground">{displayed.length} actifs affichés</span>
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
  monthlyCount, cryptoPrices, marketGlobal, marketFetchedAt,
}: Props) {
  const router = useRouter()
  const [showUpgradeToast, setShowUpgradeToast] = useState(!!justUpgraded)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null)

  useEffect(() => {
    if (justUpgraded) {
      const t = setTimeout(() => setShowUpgradeToast(false), 6000)
      return () => clearTimeout(t)
    }
  }, [justUpgraded])

  useEffect(() => {
    const ts = marketFetchedAt ?? Date.now()
    setLastUpdated(new Date(ts).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
  }, [marketFetchedAt])

  // Refresh market data every 30s so the "Live" label is honest
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
  const avgScore        = visibleAnalyses.length
    ? Math.round(visibleAnalyses.reduce((s, a) => s + (a.total_score ?? 0), 0) / visibleAnalyses.length)
    : null

  const planLimit = plan === "premium" ? null : plan === "pro" ? 20 : 1
  const analysesRemaining = planLimit === null ? null : Math.max(0, planLimit - monthlyCount)

  const portfolioChange24h = useMemo(() => {
    if (!lastAnalysis || !cryptoPrices.length) return null
    return lastAnalysis.allocations.reduce((sum, alloc) => {
      const p = cryptoPrices.find(cp => cp.symbol === alloc.symbol)
      return p ? sum + (alloc.percentage / 100) * p.change24h : sum
    }, 0)
  }, [lastAnalysis, cryptoPrices])

  const capital = Number((lastAnalysis?.investor_profile as Record<string, unknown> | undefined)?.capital ?? 0)

  const sentiment = useMemo(() => {
    if (!cryptoPrices.length) return null
    const avg = cryptoPrices.slice(0, 8).reduce((s, c) => s + c.change24h, 0) / Math.min(8, cryptoPrices.length)
    if (avg > 3)    return { label: "Très haussier", score: 75, color: "text-success" }
    if (avg > 0.5)  return { label: "Haussier",      score: 62, color: "text-success" }
    if (avg > -0.5) return { label: "Neutre",         score: 50, color: "text-muted-foreground" }
    if (avg > -3)   return { label: "Baissier",       score: 35, color: "text-destructive" }
    return                  { label: "Très baissier", score: 20, color: "text-destructive" }
  }, [cryptoPrices])

  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1)

  return (
    <div className="max-w-6xl mx-auto animate-slide-up">
      {selectedAnalysis && <AnalysisDetailModal analysis={selectedAnalysis} onClose={() => setSelectedAnalysis(null)} />}

      {/* Upgrade toast */}
      {showUpgradeToast && (
        <div className="mb-5 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <Check className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-sm">Plan {justUpgraded?.charAt(0).toUpperCase()}{justUpgraded?.slice(1)} activé</p>
              <p className="text-muted-foreground text-xs mt-0.5">Toutes les fonctionnalités sont débloquées.</p>
            </div>
          </div>
          <button onClick={() => setShowUpgradeToast(false)} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-[13px] text-muted-foreground">
              Bienvenue, {firstName}.
              {lastUpdated
                ? <span className="ml-1">Données marché à <span className="font-medium text-foreground tabular-nums">{lastUpdated}</span>.</span>
                : <span className="ml-1 text-muted-foreground/50">Chargement des données…</span>
              }
            </p>
          </div>
          <Link
            href="/advisor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-semibold rounded-lg transition-opacity hover:opacity-85 shrink-0"
          >
            <VelaIcon className="h-3.5 w-3.5" />
            Nouvelle analyse
          </Link>
        </div>
      </div>

      {/* Summary cards — 4 top */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {/* Capital */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Capital investi</p>
              <p className="text-xl font-bold tracking-tight text-foreground">
                {capital > 0 ? `${capital.toLocaleString("fr-FR")}€` : "—"}
              </p>
              {portfolioChange24h !== null && capital > 0 ? (
                <div className={cn("flex items-center gap-1 text-[11px] font-medium mt-1", portfolioChange24h >= 0 ? "text-success" : "text-destructive")}>
                  {portfolioChange24h >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  <span>{portfolioChange24h >= 0 ? "+" : ""}{portfolioChange24h.toFixed(2)}%</span>
                  <span className="text-muted-foreground font-normal">·</span>
                  <span className="tabular-nums">
                    {portfolioChange24h >= 0 ? "+" : ""}
                    {(capital * portfolioChange24h / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })}€
                  </span>
                  <span className="text-muted-foreground font-normal">24h</span>
                </div>
              ) : capital === 0 ? (
                <p className="text-[11px] text-muted-foreground">Configurez votre profil</p>
              ) : null}
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground shrink-0">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Score IA */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Score IA</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{avgScore ? `${avgScore}/100` : "—"}</p>
              <p className="text-[11px] text-muted-foreground">
                {avgScore
                  ? avgScore >= 80 ? "Signal d'achat fort" : avgScore >= 60 ? "Signal modéré" : "Signal faible"
                  : "Aucune analyse"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground shrink-0">
              <Brain className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Analyses ce mois */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Analyses / mois</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{monthlyCount}</p>
              <p className="text-[11px] text-muted-foreground">
                {analysesRemaining === null
                  ? "Illimitées"
                  : analysesRemaining === 0
                  ? "Quota atteint"
                  : `${analysesRemaining} restante${analysesRemaining > 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground shrink-0">
              <Activity className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Plan */}
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-0.5 flex-1">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Votre plan</p>
              <p className="text-xl font-bold tracking-tight text-foreground">{planLabel}</p>
              <p className="text-[11px] text-muted-foreground">
                {plan === "free" ? "Gratuit" : subscription?.status === "active" ? "Actif" : "Abonnement"}
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground shrink-0">
              <Percent className="h-4 w-4" />
            </div>
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
              {
                label: "Renouvellement",
                value: subscription?.current_period_end
                  ? new Date(subscription.current_period_end).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                  : plan === "free" ? "Gratuit" : "—",
              },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-1.5">
                <span className="text-[11px] text-muted-foreground">{item.label}</span>
                <span className="text-[12px] font-medium text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3 mb-4">
        <div className="lg:col-span-2">
          <PortfolioLineChart
            allocations={lastAnalysis?.allocations ?? []}
            cryptoPrices={cryptoPrices}
            capital={capital}
            lastUpdated={lastUpdated}
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
                  lastAnalysis.total_score >= 85 ? "bg-green-50 text-success"
                    : lastAnalysis.total_score >= 70 ? "bg-amber-50 text-warning"
                    : "bg-red-50 text-destructive"
                )}>
                  {lastAnalysis.total_score}/100
                </span>
              </div>
              <div className="h-44 mb-4">
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
                {lastAnalysis ? "Dernière recommandation" : "Commencer l'analyse"}
              </span>
            </div>
            <p className="text-[12px] text-muted-foreground mb-4 leading-relaxed">
              {lastAnalysis?.recommendations?.[0]
                ?? "Configurez votre profil investisseur et obtenez une allocation IA personnalisée."}
            </p>
            <Link
              href="/advisor"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-foreground text-background text-xs font-semibold rounded-lg hover:opacity-85 transition-opacity"
            >
              {lastAnalysis ? "Relancer l'analyse" : "Lancer l'analyse"}
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
                20 analyses/mois · historique complet · exports PDF.
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
                Analyses illimitées · Claude Opus 4.7.
              </p>
              <Link
                href="/pricing"
                className="block text-center text-xs py-2 border border-border rounded-lg font-semibold text-foreground hover:bg-secondary transition-colors"
              >
                Upgrader →
              </Link>
            </div>
          )}
        </div>
      </div>

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
                    <VelaIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-foreground">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
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
                    a.total_score >= 85 ? "bg-green-50 text-success"
                      : a.total_score >= 70 ? "bg-amber-50 text-warning"
                      : "bg-red-50 text-destructive"
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
              {new Date(analysis.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
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
              className="h-8 w-8 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center transition-colors"
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

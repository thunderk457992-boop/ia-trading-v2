"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  Clock3,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from "lucide-react"
import { DataUnavailableState } from "@/components/ui/StateComponents"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type LiveMarketAsset = {
  id: string
  symbol: string
  name: string
  price: number
  change24h: number
  marketCap: number
  volume24h: number
  image: string
  categories?: string[]
  source?: "Kraken" | "CoinGecko" | "fallback"
  metricsSource?: "CoinGecko" | "CoinPaprika"
  pair?: string | null
}

type MarketSummary = {
  trackedAssets: number
  positiveAssets: number
  negativeAssets: number
  avgVolatility24h: number | null
  krakenAssets: number
  coinGeckoAssets: number
  fallbackAssets: number
  unavailableAssets: string[]
  primarySource: string
}

type MarketGlobal = {
  totalMarketCapUsd: number
  btcDominance: number
  change24h: number
}

type KrakenResponse = {
  source: string
  updatedAt: number
  stale?: boolean
  tickers: LiveMarketAsset[]
  summary?: MarketSummary
  marketGlobal?: MarketGlobal | null
  error?: string
}

type CategoryFilter =
  | "all"
  | "Large cap"
  | "Layer 1"
  | "Layer 2"
  | "AI"
  | "DeFi"
  | "Memecoin"
  | "Infrastructure"
  | "RWA"
  | "Gaming"
  | "Payments"

type SortKey = "marketCap" | "change24h" | "volume24h"
type DataQuality = "live" | "partial" | "stale" | "offline"

// ── Format helpers — return null on missing data ──────────────────────────────

function formatPrice(price: number): string | null {
  if (!Number.isFinite(price) || price <= 0) return null
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (price >= 1) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
}

function formatCompact(value: number): string | null {
  if (!Number.isFinite(value) || value <= 0) return null
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatChange(value: number): string | null {
  if (!Number.isFinite(value)) return null
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function formatPct(value: number): string | null {
  if (!Number.isFinite(value)) return null
  return `${value.toFixed(1)}%`
}

// ── Source badge helpers ──────────────────────────────────────────────────────

// Returns { label, classes } or null if no badge needed.
// Combines price source (Kraken/CoinGecko/fallback) with metrics source (CoinGecko/CoinPaprika).
function resolveSourceBadge(
  source: LiveMarketAsset["source"],
  metricsSource: LiveMarketAsset["metricsSource"]
): { label: string; classes: string } | null {
  if (source === "fallback") {
    return { label: "Source limitée", classes: "border-border bg-secondary text-muted-foreground" }
  }
  if (source === "Kraken") {
    if (metricsSource === "CoinPaprika") {
      // Price from Kraken, metrics enriched by CoinPaprika (CoinGecko was unavailable)
      return {
        label: "Kraken · CoinPaprika",
        classes: "border-border bg-secondary text-muted-foreground",
      }
    }
    // Standard: price from Kraken, metrics from CoinGecko
    return { label: "Kraken", classes: "border-success/30 bg-success/10 text-success" }
  }
  // CoinGecko price + CoinPaprika metrics edge case
  if (metricsSource === "CoinPaprika") {
    return { label: "CoinPaprika", classes: "border-border bg-secondary text-muted-foreground" }
  }
  // Pure CoinGecko — implicit default, no badge
  return null
}

// ── Category filters ──────────────────────────────────────────────────────────

const CATEGORY_FILTERS: CategoryFilter[] = [
  "all", "Large cap", "Layer 1", "Layer 2", "AI",
  "DeFi", "Memecoin", "Infrastructure", "RWA", "Gaming", "Payments",
]

// ── Data quality → header context ─────────────────────────────────────────────

function getQualityBadge(quality: DataQuality) {
  switch (quality) {
    case "live":
      return {
        dot: "bg-success animate-pulse",
        label: "Marché live",
        classes: "border-success/30 bg-success/10 text-success",
      }
    case "partial":
      return {
        dot: "bg-warning",
        label: "Données partielles",
        classes: "border-warning/30 bg-warning/10 text-warning",
      }
    case "stale":
      return {
        dot: "bg-warning animate-pulse",
        label: "Cache actif",
        classes: "border-warning/30 bg-warning/10 text-warning",
      }
    default:
      return null
  }
}

function getQualityDescription(quality: DataQuality): string {
  switch (quality) {
    case "live":
      return "Prix spot en direct via Kraken. Métriques globales CoinGecko disponibles."
    case "partial":
      return "Prix spot disponibles. Certaines métriques complémentaires sont temporairement limitées."
    case "stale":
      return "Données conservées depuis le dernier jeu valide. Reconnexion automatique en cours."
    default:
      return "Kraken est la source prioritaire pour les prix spot. CoinGecko couvre les actifs non supportés."
  }
}

// ── Asset card ────────────────────────────────────────────────────────────────

function AssetCard({ asset }: { asset: LiveMarketAsset }) {
  const priceStr  = formatPrice(asset.price)
  const changeStr = formatChange(asset.change24h)
  const capStr    = formatCompact(asset.marketCap)
  const volStr    = formatCompact(asset.volume24h)
  const positive  = Number.isFinite(asset.change24h) && asset.change24h >= 0

  const hasSecondaryData = capStr !== null || volStr !== null
  const srcBadge   = resolveSourceBadge(asset.source, asset.metricsSource)
  const primaryCat = (asset.categories ?? [])[0] ?? null

  return (
    <div className="group flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-all duration-150 hover:border-foreground/15 hover:shadow-sm">

      {/* Row 1 — identity + change badge */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
            {asset.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.image} alt={asset.symbol} className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-xs font-bold text-foreground">{asset.symbol.charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{asset.symbol}</p>
            <p className="truncate text-[11px] text-muted-foreground">{asset.name}</p>
          </div>
        </div>

        {changeStr !== null ? (
          <span className={cn(
            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums",
            positive ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {changeStr}
          </span>
        ) : null}
      </div>

      {/* Row 2 — price (dominant) */}
      {priceStr !== null ? (
        <p className="text-xl font-bold tabular-nums text-foreground">{priceStr}</p>
      ) : (
        <p className="text-sm text-muted-foreground/50">Prix non disponible</p>
      )}

      {/* Row 3 — secondary metrics inline */}
      {hasSecondaryData ? (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
          {capStr !== null && (
            <span>
              <span className="font-medium text-foreground/70">Cap</span>{" "}{capStr}
            </span>
          )}
          {volStr !== null && (
            <span>
              <span className="font-medium text-foreground/70">Vol 24h</span>{" "}{volStr}
            </span>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground/50">Métriques secondaires indisponibles</p>
      )}

      {/* Row 4 — source + category (minimal) */}
      {(srcBadge || primaryCat) ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {srcBadge && (
            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", srcBadge.classes)}>
              {srcBadge.label}
            </span>
          )}
          {primaryCat && (
            <span className="rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">
              {primaryCat}
            </span>
          )}
        </div>
      ) : null}
    </div>
  )
}

// ── Compact leaderboard row ───────────────────────────────────────────────────

function LeaderRow({
  asset,
  metric,
}: {
  asset: LiveMarketAsset
  metric: "change24h" | "volume24h"
}) {
  const positive = Number.isFinite(asset.change24h) && asset.change24h >= 0
  const value = metric === "volume24h"
    ? formatCompact(asset.volume24h)
    : formatChange(asset.change24h)

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary">
          {asset.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={asset.image} alt={asset.symbol} className="h-4 w-4 object-contain" />
          ) : (
            <span className="text-[10px] font-bold text-foreground">{asset.symbol.charAt(0)}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">{asset.symbol}</p>
          <p className="truncate text-[10px] text-muted-foreground">{formatPrice(asset.price) ?? "—"}</p>
        </div>
      </div>
      {value !== null ? (
        <span className={cn(
          "shrink-0 text-[11px] font-semibold tabular-nums",
          metric === "change24h"
            ? positive ? "text-success" : "text-destructive"
            : "text-foreground"
        )}>
          {value}
        </span>
      ) : (
        <span className="text-[11px] text-muted-foreground/50">—</span>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function KrakenLivePage() {
  const [data, setData]             = useState<KrakenResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading]       = useState(true)
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null)
  const [search, setSearch]         = useState("")
  const [category, setCategory]     = useState<CategoryFilter>("all")
  const [sortKey, setSortKey]       = useState<SortKey>("marketCap")

  const load = useCallback(async (trackLoading = false) => {
    if (trackLoading) setLoading(true)
    setLastAttemptAt(Date.now())
    try {
      const response = await fetch("/api/kraken", { cache: "no-store" })
      const payload  = (await response.json()) as KrakenResponse
      if (!response.ok && (!payload.tickers || payload.tickers.length === 0)) {
        throw new Error(payload.error || `API ${response.status}`)
      }
      setData(payload)
      setFetchError(payload.error && (!payload.tickers || payload.tickers.length === 0) ? payload.error : null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de récupérer les données de marché."
      setFetchError(message)
      console.error("[kraken-live] fetch error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load(true)
    const id = setInterval(() => void load(false), 10_000)
    return () => clearInterval(id)
  }, [load])

  const assets  = useMemo(() => data?.tickers ?? [], [data])
  const summary = data?.summary ?? null
  const global  = data?.marketGlobal ?? null

  // ── Data quality signal ──────────────────────────────────────────────────
  const dataQuality = useMemo<DataQuality>(() => {
    if (!data || assets.length === 0) return "offline"
    if (data.stale) return "stale"
    if (!global) return "partial"
    const fallbackRatio = summary
      ? summary.fallbackAssets / Math.max(summary.trackedAssets, 1)
      : 0
    if (fallbackRatio > 0.4) return "partial"
    return "live"
  }, [data, assets.length, global, summary])

  const updatedAtLabel = data
    ? new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null

  const lastAttemptLabel = lastAttemptAt
    ? new Date(lastAttemptAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit", second: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null

  // ── Filtered / sorted grid ───────────────────────────────────────────────
  const filteredAssets = useMemo(() => {
    const query = search.trim().toLowerCase()
    return [...assets]
      .filter((asset) => (
        (!query || asset.name.toLowerCase().includes(query) || asset.symbol.toLowerCase().includes(query))
        && (category === "all" || (asset.categories ?? []).includes(category))
      ))
      .sort((left, right) => {
        if (sortKey === "change24h") return Math.abs(right.change24h) - Math.abs(left.change24h)
        return (right[sortKey] ?? Number.NEGATIVE_INFINITY) - (left[sortKey] ?? Number.NEGATIVE_INFINITY)
      })
  }, [assets, category, search, sortKey])

  // ── Leaderboards (only assets with valid data for that metric) ───────────
  const topGainers = useMemo(
    () => [...assets].filter((a) => Number.isFinite(a.change24h)).sort((a, b) => b.change24h - a.change24h).slice(0, 3),
    [assets]
  )
  const topLosers = useMemo(
    () => [...assets].filter((a) => Number.isFinite(a.change24h)).sort((a, b) => a.change24h - b.change24h).slice(0, 3),
    [assets]
  )
  const volumeLeaders = useMemo(
    () => [...assets].filter((a) => Number.isFinite(a.volume24h) && a.volume24h > 0).sort((a, b) => b.volume24h - a.volume24h).slice(0, 3),
    [assets]
  )

  const isEmpty  = !loading && assets.length === 0
  const badge    = getQualityBadge(dataQuality)
  const headerDesc = getQualityDescription(dataQuality)

  // ── Global stats — "—" when unavailable (never "Indisponible") ───────────
  const globalStats = [
    {
      label: "Actifs suivis",
      value: loading ? null : String(summary?.trackedAssets ?? assets.length),
    },
    {
      label: "BTC dominance",
      value: loading ? null : (global ? formatPct(global.btcDominance) ?? "—" : "—"),
    },
    {
      label: "Capitalisation",
      value: loading ? null : (global ? formatCompact(global.totalMarketCapUsd) ?? "—" : "—"),
    },
    {
      label: "Source",
      value: loading ? null : (summary?.primarySource ?? data?.source ?? "CoinGecko"),
    },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href="/dashboard"
          className="focus-ring mb-6 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Tableau de bord
        </Link>

        {/* ── Header card ─────────────────────────────────────────────────── */}
        <div className="surface-card mb-6 p-5 sm:p-6">

          {/* Status badge + title */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              {badge ? (
                <div className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]",
                  badge.classes
                )}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                  {badge.label}
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  <Activity className="h-3 w-3" />
                  Marché live
                </div>
              )}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Kraken Live</h1>
              <p className="max-w-xl text-sm leading-6 text-muted-foreground">{headerDesc}</p>
            </div>

            {/* Refresh button — desktop */}
            <button
              type="button"
              onClick={() => void load(true)}
              aria-label="Actualiser les données de marché"
              className="focus-ring hidden shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualiser
            </button>
          </div>

          {/* Global stats */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {globalStats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {item.label}
                </p>
                {item.value === null ? (
                  <div className="mt-2 h-6 w-16 animate-pulse rounded-lg bg-secondary" />
                ) : (
                  <p className={cn(
                    "mt-1.5 text-lg font-semibold tabular-nums",
                    item.value === "—" ? "text-muted-foreground/50" : "text-foreground"
                  )}>
                    {item.value}
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Status bar */}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3" />
              Auto 10 s
            </span>
            {updatedAtLabel && (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3 w-3" />
                {data?.stale ? "Cache" : "Mis à jour"} {updatedAtLabel}
              </span>
            )}
            {summary && (
              <span>
                {summary.krakenAssets} Kraken · {summary.coinGeckoAssets} CoinGecko
                {summary.fallbackAssets > 0 ? ` · ${summary.fallbackAssets} limités` : ""}
              </span>
            )}
            {/* Mobile refresh */}
            <button
              type="button"
              onClick={() => void load(true)}
              aria-label="Actualiser"
              className="focus-ring inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 font-semibold transition-colors hover:bg-secondary sm:hidden"
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser
            </button>
          </div>
        </div>

        {/* ── Loading skeleton ─────────────────────────────────────────────── */}
        {loading && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 h-3 w-20 animate-pulse rounded bg-secondary" />
                  <div className="space-y-3">
                    {[0, 1, 2].map((j) => (
                      <div key={j} className="flex items-center justify-between gap-3 py-1">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 animate-pulse rounded-lg bg-secondary" />
                          <div className="space-y-1">
                            <div className="h-3 w-12 animate-pulse rounded bg-secondary" />
                            <div className="h-2 w-16 animate-pulse rounded bg-secondary" />
                          </div>
                        </div>
                        <div className="h-3 w-10 animate-pulse rounded bg-secondary" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-9 w-9 animate-pulse rounded-xl bg-secondary" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-12 animate-pulse rounded bg-secondary" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-secondary" />
                      </div>
                    </div>
                    <div className="h-5 w-14 animate-pulse rounded-full bg-secondary" />
                  </div>
                  <div className="mt-4 h-6 w-24 animate-pulse rounded bg-secondary" />
                  <div className="mt-3 flex gap-3">
                    <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-20 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Error state ──────────────────────────────────────────────────── */}
        {!loading && fetchError && (
          <div className="mb-6">
            <DataUnavailableState
              title="Données de marché temporairement indisponibles"
              message="La connexion aux sources de prix est momentanément interrompue. Aucun prix n'est inventé."
              lastUpdated={updatedAtLabel ?? lastAttemptLabel}
              retryLabel="Réessayer"
              onRetry={() => void load(true)}
            />
          </div>
        )}

        {/* ── Empty state ───────────────────────────────────────────────────── */}
        {!loading && isEmpty && !fetchError && (
          <DataUnavailableState
            title="Aucune donnée disponible pour le moment"
            message="Kraken et CoinGecko n'ont pas fourni de données suffisantes. Aucun prix n'est simulé."
            lastUpdated={updatedAtLabel ?? lastAttemptLabel}
            retryLabel="Réessayer"
            onRetry={() => void load(true)}
          />
        )}

        {/* ── Main content ─────────────────────────────────────────────────── */}
        {!loading && assets.length > 0 && (
          <div className="space-y-4">

            {/* Leaderboards */}
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { title: "Top hausses",     icon: TrendingUp,   items: topGainers,     metric: "change24h" as const },
                { title: "Top baisses",     icon: TrendingDown, items: topLosers,       metric: "change24h" as const },
                { title: "Leaders volume",  icon: Activity,     items: volumeLeaders,   metric: "volume24h" as const },
              ].map(({ title, icon: Icon, items, metric }) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-1 flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <h2 className="text-[13px] font-semibold text-foreground">{title}</h2>
                  </div>
                  {items.length > 0 ? (
                    <div className="divide-y divide-border">
                      {items.map((asset) => (
                        <LeaderRow key={asset.id} asset={asset} metric={metric} />
                      ))}
                    </div>
                  ) : (
                    <p className="py-4 text-center text-[12px] text-muted-foreground/60">
                      Données insuffisantes
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Main grid */}
            <div className="rounded-2xl border border-border bg-card">

              {/* Grid header + filters */}
              <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                <div>
                  <h2 className="text-[14px] font-semibold text-foreground">Grille marché</h2>
                  <p className="text-[11px] text-muted-foreground">
                    {filteredAssets.length} actif{filteredAssets.length !== 1 ? "s" : ""}
                    {filteredAssets.length !== assets.length ? ` sur ${assets.length}` : ""}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher…"
                      aria-label="Rechercher un actif"
                      className="h-9 w-40 rounded-xl border border-border bg-background pl-8 pr-3 text-sm text-foreground outline-none transition focus:border-ring sm:w-48"
                    />
                  </div>

                  {/* Category filter — scrollable on mobile */}
                  <div className="flex gap-0.5 overflow-x-auto rounded-xl border border-border bg-secondary/30 p-1 scrollbar-hide">
                    {CATEGORY_FILTERS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={cn(
                          "focus-ring shrink-0 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                          category === item
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item === "all" ? "Tout" : item}
                      </button>
                    ))}
                  </div>

                  {/* Sort */}
                  <div className="flex gap-0.5 rounded-xl border border-border bg-secondary/30 p-1">
                    {[
                      { label: "Cap",    key: "marketCap" as const },
                      { label: "24h",    key: "change24h" as const },
                      { label: "Volume", key: "volume24h" as const },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSortKey(item.key)}
                        className={cn(
                          "focus-ring rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                          sortKey === item.key
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Grid body */}
              {filteredAssets.length === 0 ? (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Aucun actif ne correspond à cette recherche.
                </div>
              ) : (
                <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredAssets.map((asset) => (
                    <AssetCard key={asset.id} asset={asset} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

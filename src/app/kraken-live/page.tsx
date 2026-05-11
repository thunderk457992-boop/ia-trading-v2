"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity, AlertTriangle, ArrowLeft, Clock3, RefreshCw, Search, TrendingDown, TrendingUp,
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────

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
  tickers: LiveMarketAsset[]
  summary?: MarketSummary
  marketGlobal?: MarketGlobal | null
  error?: string
}

type CategoryFilter =
  | "all" | "Large cap" | "Layer 1" | "Layer 2" | "AI"
  | "DeFi" | "Memecoin" | "Infrastructure" | "RWA" | "Gaming" | "Payments"
type SortKey = "marketCap" | "change24h" | "volume24h"

// ── Formatting ─────────────────────────────────────────────────────────────

function formatPrice(price: number) {
  if (!Number.isFinite(price)) return "—"
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (price >= 1)    return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
}

function formatCompact(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "—"
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9)  return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6)  return `$${(value / 1e6).toFixed(0)}M`
  if (value >= 1e3)  return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) return "—"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function formatPct(value: number) {
  if (!Number.isFinite(value)) return "—"
  return `${value.toFixed(1)}%`
}

function sourceLabel(source: LiveMarketAsset["source"]) {
  if (source === "Kraken")   return "Kraken"
  if (source === "fallback") return "Fallback"
  return "CoinGecko"
}

function sourceClasses(source: LiveMarketAsset["source"]) {
  if (source === "Kraken")   return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (source === "fallback") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-border bg-secondary text-muted-foreground"
}

// ── Constants ──────────────────────────────────────────────────────────────

const CATEGORY_FILTERS: CategoryFilter[] = [
  "all", "Large cap", "Layer 1", "Layer 2", "AI",
  "DeFi", "Memecoin", "Infrastructure", "RWA", "Gaming", "Payments",
]

// ── Page ───────────────────────────────────────────────────────────────────

export default function KrakenLivePage() {
  const [data, setData]       = useState<KrakenResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [tick, setTick]       = useState(0)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      try {
        const res = await fetch("/api/kraken", { cache: "no-store" })

        if (!res.ok) {
          const text = await res.text().catch(() => "")
          throw new Error(`API ${res.status}: ${text.slice(0, 120) || res.statusText}`)
        }

        const json = (await res.json()) as KrakenResponse
        if (!mounted) return

        // API-level error propagated in the JSON body
        if (json.error && (!json.tickers || json.tickers.length === 0)) {
          setFetchError(json.error)
          setData(json)
        } else {
          setFetchError(null)
          setData(json)
        }

        setTick((n) => n + 1)
      } catch (err) {
        if (!mounted) return
        const msg = err instanceof Error ? err.message : "Impossible de récupérer les données de marché."
        setFetchError(msg)
        console.error("[kraken-live] fetch error:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void load()
    const id = setInterval(load, 10_000)
    return () => { mounted = false; clearInterval(id) }
  }, [])

  // Derived state
  const assets  = useMemo(() => data?.tickers ?? [], [data])
  const summary = data?.summary
  const global  = data?.marketGlobal

  const updatedAtLabel = data
    ? new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Paris",
      })
    : null

  const filteredAssets = useMemo(() => {
    const q = search.trim().toLowerCase()
    const safe = (v: number) => (Number.isFinite(v) ? v : Number.NEGATIVE_INFINITY)
    return [...assets]
      .filter((a) => (
        (!q || a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q))
        && (category === "all" || (a.categories ?? []).includes(category))
      ))
      .sort((a, b) => {
        if (sortKey === "change24h") return Math.abs(safe(b.change24h)) - Math.abs(safe(a.change24h))
        return safe(b[sortKey]) - safe(a[sortKey])
      })
  }, [assets, category, search, sortKey])

  const topGainers = useMemo(
    () => [...assets].filter((a) => Number.isFinite(a.change24h)).sort((a, b) => b.change24h - a.change24h).slice(0, 3),
    [assets]
  )
  const topLosers = useMemo(
    () => [...assets].filter((a) => Number.isFinite(a.change24h)).sort((a, b) => a.change24h - b.change24h).slice(0, 3),
    [assets]
  )
  const volumeLeaders = useMemo(
    () => [...assets].sort((a, b) => b.volume24h - a.volume24h).slice(0, 3),
    [assets]
  )

  const isEmpty = !loading && assets.length === 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Back link ── */}
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Dashboard
        </Link>

        {/* ── Header card ── */}
        <div className="mb-8 rounded-[28px] border border-border bg-card p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                Marché live
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Kraken Live</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Kraken est la source prioritaire pour les prix spot. CoinGecko prend le relais pour les actifs
                  non couverts. Si les deux manquent, l&apos;actif est retiré plutôt que simulé.
                </p>
              </div>
            </div>

            {/* Summary grid */}
            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[40rem] xl:grid-cols-4">
              <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Actifs suivis</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                  {loading ? "—" : (summary?.trackedAssets ?? assets.length)}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">BTC Dominance</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                  {loading ? "—" : (global ? formatPct(global.btcDominance) : "—")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Market cap total</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                  {loading ? "—" : (global ? formatCompact(global.totalMarketCapUsd) : "—")}
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Source principale</p>
                <p className="mt-2 text-base font-black text-foreground">
                  {loading ? "—" : (summary?.primarySource ?? data?.source ?? "CoinGecko")}
                </p>
              </div>
            </div>
          </div>

          {/* Footer bar */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
            {!isEmpty && !fetchError && (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live
              </div>
            )}
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh 10 s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {updatedAtLabel ? `Mis à jour à ${updatedAtLabel}` : "En attente de données…"}
            </span>
            {summary && (
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                {summary.krakenAssets} Kraken · {summary.fallbackAssets} fallback · {summary.coinGeckoAssets} CoinGecko
              </span>
            )}
            {global && (
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                Marché 24 h : {formatChange(global.change24h)}
              </span>
            )}
          </div>
        </div>

        {/* ── Loading skeleton ── */}
        {loading && (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-56 animate-pulse rounded-3xl border border-border bg-card" />
              ))}
            </div>
          </div>
        )}

        {/* ── Fetch / API error ── */}
        {!loading && fetchError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-card-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-semibold">Données de marché indisponibles</p>
              <p className="mt-1 text-xs opacity-80">{fetchError}</p>
            </div>
          </div>
        )}

        {/* ── Empty state — data loaded but tickers empty ── */}
        {isEmpty && !fetchError && (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-border bg-card py-16 text-center shadow-card">
            <Activity className="mb-4 h-8 w-8 text-muted-foreground/40" />
            <p className="font-semibold text-foreground">Aucun actif reçu</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              L&apos;API a répondu mais sans données. Cela peut arriver si CoinGecko et Kraken sont temporairement
              indisponibles. La page se rafraîchit automatiquement toutes les 10 secondes.
            </p>
          </div>
        )}

        {/* ── Data ── */}
        {!loading && assets.length > 0 && (
          <div className="space-y-4" key={tick}>

            {/* Top movers */}
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { title: "Top gainers", icon: TrendingUp, items: topGainers, positive: true },
                { title: "Top losers",  icon: TrendingDown, items: topLosers,  positive: false },
                { title: "Volume leaders", icon: Activity, items: volumeLeaders, positive: null },
              ].map(({ title, icon: Icon, items, positive }) => (
                <div key={title} className="rounded-3xl border border-border bg-card p-4 shadow-card-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">24h</span>
                  </div>
                  <div className="space-y-3">
                    {items.map((asset) => {
                      const isPos = positive !== null
                        ? positive
                        : Number.isFinite(asset.change24h) && asset.change24h >= 0

                      return (
                        <div key={`${title}-${asset.id}`} className="rounded-2xl border border-border bg-secondary/60 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-background">
                                {asset.image
                                  // eslint-disable-next-line @next/next/no-img-element
                                  ? <img src={asset.image} alt={asset.symbol} className="h-5 w-5 object-contain" />
                                  : <span className="text-xs font-bold text-foreground">{asset.symbol.charAt(0)}</span>}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{asset.symbol}</p>
                                <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold tabular-nums text-foreground">{formatPrice(asset.price)}</p>
                              <p className={`text-[11px] font-semibold ${isPos ? "text-emerald-600" : "text-red-600"}`}>
                                {positive === null ? formatCompact(asset.volume24h) : formatChange(asset.change24h)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${sourceClasses(asset.source)}`}>
                              {sourceLabel(asset.source)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Full grid */}
            <div className="rounded-3xl border border-border bg-card shadow-card-xs">
              {/* Grid header */}
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Crypto live grid</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredAssets.length} actif{filteredAssets.length !== 1 ? "s" : ""} affichés sur {assets.length} suivis.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Rechercher…"
                      className="h-10 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-sm text-foreground outline-none transition focus:border-ring sm:w-48"
                    />
                  </div>

                  {/* Category filter */}
                  <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/30 p-1">
                    {CATEGORY_FILTERS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          category === item ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item === "all" ? "Tout" : item}
                      </button>
                    ))}
                  </div>

                  {/* Sort */}
                  <div className="flex gap-1 rounded-xl border border-border bg-secondary/30 p-1">
                    {([
                      { label: "Cap",    key: "marketCap"  as const },
                      { label: "24h",    key: "change24h"  as const },
                      { label: "Volume", key: "volume24h"  as const },
                    ] as const).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSortKey(item.key)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          sortKey === item.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Empty search result */}
              {filteredAssets.length === 0 && (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Aucun actif ne correspond à votre recherche.
                </div>
              )}

              {/* Asset cards */}
              {filteredAssets.length > 0 && (
                <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
                  {filteredAssets.map((asset) => {
                    const positive = Number.isFinite(asset.change24h) && asset.change24h >= 0

                    return (
                      <div
                        key={asset.id}
                        className="group rounded-[24px] border border-border bg-secondary/40 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-secondary/65"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-border bg-background">
                              {asset.image
                                // eslint-disable-next-line @next/next/no-img-element
                                ? <img src={asset.image} alt={asset.symbol} className="h-6 w-6 object-contain" />
                                : <span className="text-sm font-black text-foreground">{asset.symbol.charAt(0)}</span>}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-foreground">{asset.symbol}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <div className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          }`}>
                            {formatChange(asset.change24h)}
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prix</p>
                            <p className="mt-1 text-xl font-black tabular-nums text-foreground">
                              {formatPrice(asset.price)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <div className="rounded-2xl border border-border bg-background px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Market cap</p>
                            <p className="mt-1.5 text-sm font-semibold text-foreground">{formatCompact(asset.marketCap)}</p>
                          </div>
                          <div className="rounded-2xl border border-border bg-background px-3 py-2.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Volume 24h</p>
                            <p className="mt-1.5 text-sm font-semibold text-foreground">{formatCompact(asset.volume24h)}</p>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${sourceClasses(asset.source)}`}>
                            {sourceLabel(asset.source)}
                          </span>
                          {(asset.categories ?? []).slice(0, 2).map((cat) => (
                            <span key={cat} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                              {cat}
                            </span>
                          ))}
                          {asset.pair && (
                            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                              {asset.pair}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="border-t border-border px-5 py-4 text-[12px] leading-6 text-muted-foreground">
                Aucun prix n&apos;est inventé. Si Kraken ne couvre pas une paire, CoinGecko prend le relais
                (badge visible). Si les deux sources manquent, l&apos;actif est retiré plutôt que simulé.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

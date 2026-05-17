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

const CATEGORY_FILTERS: CategoryFilter[] = [
  "all",
  "Large cap",
  "Layer 1",
  "Layer 2",
  "AI",
  "DeFi",
  "Memecoin",
  "Infrastructure",
  "RWA",
  "Gaming",
  "Payments",
]

function formatPrice(price: number) {
  if (!Number.isFinite(price) || price <= 0) return "Indisponible"
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (price >= 1) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
}

function formatCompact(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "Indisponible"
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) return "Indisponible"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function formatPct(value: number) {
  if (!Number.isFinite(value)) return "Indisponible"
  return `${value.toFixed(1)}%`
}

function sourceLabel(source: LiveMarketAsset["source"]) {
  if (source === "Kraken") return "Kraken"
  if (source === "fallback") return "CoinGecko fallback"
  return "CoinGecko"
}

function sourceClasses(source: LiveMarketAsset["source"]) {
  if (source === "Kraken") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (source === "fallback") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-border bg-secondary text-muted-foreground"
}

export default function KrakenLivePage() {
  const [data, setData] = useState<KrakenResponse | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")

  const load = useCallback(async (trackLoading = false) => {
    if (trackLoading) setLoading(true)
    setLastAttemptAt(Date.now())

    try {
      const response = await fetch("/api/kraken", { cache: "no-store" })
      const payload = (await response.json()) as KrakenResponse

      if (!response.ok && (!payload.tickers || payload.tickers.length === 0)) {
        throw new Error(payload.error || `API ${response.status}`)
      }

      setData(payload)
      setFetchError(payload.error && (!payload.tickers || payload.tickers.length === 0) ? payload.error : null)
    } catch (error) {
      const message = error instanceof Error ? error.message : "Impossible de recuperer les donnees de marche."
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

  const assets = useMemo(() => data?.tickers ?? [], [data])
  const summary = data?.summary ?? null
  const global = data?.marketGlobal ?? null

  const updatedAtLabel = data
    ? new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null

  const lastAttemptLabel = lastAttemptAt
    ? new Date(lastAttemptAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null

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

  const topGainers = useMemo(
    () => [...assets].filter((asset) => Number.isFinite(asset.change24h)).sort((a, b) => b.change24h - a.change24h).slice(0, 3),
    [assets]
  )
  const topLosers = useMemo(
    () => [...assets].filter((asset) => Number.isFinite(asset.change24h)).sort((a, b) => a.change24h - b.change24h).slice(0, 3),
    [assets]
  )
  const volumeLeaders = useMemo(
    () => [...assets].filter((asset) => Number.isFinite(asset.volume24h)).sort((a, b) => b.volume24h - a.volume24h).slice(0, 3),
    [assets]
  )

  const isEmpty = !loading && assets.length === 0

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="focus-ring mb-6 inline-flex items-center gap-2 rounded-full px-2 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voir mon tableau de bord
        </Link>

        <div className="surface-card mb-8 p-5 sm:p-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                <Activity className="h-3.5 w-3.5" />
                Marche live
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Kraken Live</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                  Kraken reste la source prioritaire pour les prix spot. CoinGecko prend le relais pour les actifs non couverts.
                  Si les deux manquent, l&apos;actif disparait de la grille au lieu d&apos;etre simule.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[40rem] xl:grid-cols-4">
              {[
                {
                  label: "Actifs suivis",
                  display: loading ? null : String(summary?.trackedAssets ?? assets.length),
                },
                {
                  label: "BTC dominance",
                  display: loading ? null : (global ? formatPct(global.btcDominance) : "Indisponible"),
                },
                {
                  label: "Capitalisation totale",
                  display: loading ? null : (global ? formatCompact(global.totalMarketCapUsd) : "Indisponible"),
                },
                {
                  label: "Source principale",
                  display: loading ? null : (summary?.primarySource ?? data?.source ?? "CoinGecko"),
                },
              ].map((item) => (
                <div key={item.label} className="surface-soft px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{item.label}</p>
                  {item.display === null ? (
                    <div className="mt-2 h-7 w-20 animate-pulse rounded-lg bg-secondary" />
                  ) : (
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{item.display}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
            {!isEmpty && !fetchError ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live
              </div>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Actualisation auto 10 s
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="h-3.5 w-3.5" />
              {updatedAtLabel ? `Mis a jour a ${updatedAtLabel}` : "En attente de donnees"}
            </span>
            {summary ? (
              <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                {summary.krakenAssets} Kraken · {summary.fallbackAssets} fallback · {summary.coinGeckoAssets} CoinGecko
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => void load(true)}
              aria-label="Actualiser les donnees de marche"
              className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Actualiser
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="rounded-3xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="h-4 w-24 animate-pulse rounded-lg bg-secondary" />
                    <div className="h-4 w-16 animate-pulse rounded-lg bg-secondary" />
                  </div>
                  <div className="space-y-2.5">
                    {[0, 1, 2].map((row) => (
                      <div key={row} className="flex items-center justify-between rounded-2xl border border-border bg-secondary/40 px-3 py-3">
                        <div className="space-y-1.5">
                          <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
                          <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                        </div>
                        <div className="h-5 w-14 animate-pulse rounded-full bg-secondary" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {!loading && fetchError ? (
          <div className="mb-6">
            <DataUnavailableState
              title="Donnees de marche temporairement indisponibles"
              message={fetchError}
              lastUpdated={updatedAtLabel ?? lastAttemptLabel}
              retryLabel="Actualiser"
              onRetry={() => void load(true)}
            />
          </div>
        ) : null}

        {!loading && isEmpty && !fetchError ? (
          <DataUnavailableState
            title="Aucune donnee exploitable pour le moment"
            message="Kraken et CoinGecko n'ont pas fourni assez de donnees pour afficher la grille. Aucun prix n'est invente."
            lastUpdated={updatedAtLabel ?? lastAttemptLabel}
            retryLabel="Actualiser"
            onRetry={() => void load(true)}
          />
        ) : null}

        {!loading && assets.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { title: "Top hausses", icon: TrendingUp, items: topGainers, showVolume: false },
                { title: "Top baisses", icon: TrendingDown, items: topLosers, showVolume: false },
                { title: "Leaders volume", icon: Activity, items: volumeLeaders, showVolume: true },
              ].map(({ title, icon: Icon, items, showVolume }) => (
                <div key={title} className="rounded-3xl border border-border bg-card p-4 shadow-card-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      {showVolume ? "24h" : "variation"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {items.map((asset) => {
                      const positive = Number.isFinite(asset.change24h) && asset.change24h >= 0
                      return (
                        <div key={`${title}-${asset.id}`} className="rounded-2xl border border-border bg-secondary/60 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-background">
                                {asset.image ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={asset.image} alt={asset.symbol} className="h-5 w-5 object-contain" />
                                ) : (
                                  <span className="text-xs font-bold text-foreground">{asset.symbol.charAt(0)}</span>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-foreground">{asset.symbol}</p>
                                <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold tabular-nums text-foreground">{formatPrice(asset.price)}</p>
                              <p className={cn("text-[11px] font-semibold", positive ? "text-emerald-600" : "text-red-600")}>
                                {showVolume ? formatCompact(asset.volume24h) : formatChange(asset.change24h)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold", sourceClasses(asset.source))}>
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

            <div className="rounded-3xl border border-border bg-card shadow-card-xs">
              <div className="flex flex-col gap-3 border-b border-border px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[15px] font-semibold text-foreground">Grille marche live</h2>
                  <p className="text-sm text-muted-foreground">
                    {filteredAssets.length} actif{filteredAssets.length !== 1 ? "s" : ""} affiches sur {assets.length} suivis.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher..."
                      className="h-10 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-sm text-foreground outline-none transition focus:border-ring sm:w-48"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/30 p-1">
                    {CATEGORY_FILTERS.map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => setCategory(item)}
                        className={cn(
                          "focus-ring rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                          category === item ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item === "all" ? "Tout" : item}
                      </button>
                    ))}
                  </div>

                  <div className="flex gap-1 rounded-xl border border-border bg-secondary/30 p-1">
                    {([
                      { label: "Cap", key: "marketCap" as const },
                      { label: "24h", key: "change24h" as const },
                      { label: "Volume", key: "volume24h" as const },
                    ] as const).map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setSortKey(item.key)}
                        className={cn(
                          "focus-ring rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors",
                          sortKey === item.key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {filteredAssets.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  Aucun actif ne correspond a votre recherche.
                </div>
              ) : (
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
                              {asset.image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={asset.image} alt={asset.symbol} className="h-6 w-6 object-contain" />
                              ) : (
                                <span className="text-sm font-black text-foreground">{asset.symbol.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-base font-semibold text-foreground">{asset.symbol}</p>
                              <p className="truncate text-[11px] text-muted-foreground">{asset.name}</p>
                            </div>
                          </div>
                          <div className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold",
                            positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                          )}>
                            {formatChange(asset.change24h)}
                          </div>
                        </div>

                        <div className="mt-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Prix</p>
                          <p className="mt-1 text-xl font-black tabular-nums text-foreground">{formatPrice(asset.price)}</p>
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
                          <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-semibold", sourceClasses(asset.source))}>
                            {sourceLabel(asset.source)}
                          </span>
                          {(asset.categories ?? []).slice(0, 2).map((cat) => (
                            <span key={cat} className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                              {cat}
                            </span>
                          ))}
                          {asset.pair ? (
                            <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground">
                              {asset.pair}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

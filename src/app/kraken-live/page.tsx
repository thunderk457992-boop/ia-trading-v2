"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  Activity,
  ArrowLeft,
  Clock3,
  RefreshCw,
  Search,
} from "lucide-react"

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

type KrakenResponse = {
  source: string
  updatedAt: number
  tickers: LiveMarketAsset[]
  summary?: MarketSummary
  error?: string
}

type CategoryFilter = "all" | "Large cap" | "Layer 1" | "AI" | "DeFi" | "Memecoin" | "Infrastructure" | "RWA"
type SortKey = "marketCap" | "change24h" | "volume24h"

function formatPrice(price: number) {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
  if (price >= 1) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
  return `$${price.toLocaleString("en-US", { maximumFractionDigits: 4 })}`
}

function formatCompactUsd(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "—"
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(0)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`
  return `$${value.toFixed(0)}`
}

function formatChange(value: number) {
  if (!Number.isFinite(value)) return "—"
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`
}

function getSourceLabel(source: LiveMarketAsset["source"]) {
  if (source === "Kraken") return "Kraken"
  if (source === "fallback") return "Fallback"
  return "CoinGecko"
}

function getSourceClasses(source: LiveMarketAsset["source"]) {
  if (source === "Kraken") return "border-emerald-200 bg-emerald-50 text-emerald-700"
  if (source === "fallback") return "border-amber-200 bg-amber-50 text-amber-700"
  return "border-border bg-secondary text-muted-foreground"
}

const CATEGORY_FILTERS: CategoryFilter[] = [
  "all",
  "Large cap",
  "Layer 1",
  "AI",
  "DeFi",
  "Memecoin",
  "Infrastructure",
  "RWA",
]

export default function KrakenLivePage() {
  const [data, setData] = useState<KrakenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<CategoryFilter>("all")
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let mounted = true

    const fetchMarket = async () => {
      try {
        const res = await fetch("/api/kraken", { cache: "no-store" })
        const json = (await res.json()) as KrakenResponse

        if (!mounted) return
        setData(json)
        setTick((value) => value + 1)
      } catch (error) {
        if (mounted) {
          setData({
            source: "CoinGecko",
            updatedAt: Date.now(),
            tickers: [],
            error: "Impossible de recuperer les donnees de marche.",
          })
        }
        console.error("Kraken live fetch error:", error)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void fetchMarket()
    const interval = setInterval(fetchMarket, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const assets = useMemo(() => data?.tickers ?? [], [data])
  const summary = data?.summary
  const updatedAtLabel = data
    ? new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Europe/Paris",
      })
    : null

  const filteredAssets = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    const safeMetric = (value: number) => (Number.isFinite(value) ? value : Number.NEGATIVE_INFINITY)

    return [...assets]
      .filter((asset) => (
        (!normalizedSearch
          || asset.name.toLowerCase().includes(normalizedSearch)
          || asset.symbol.toLowerCase().includes(normalizedSearch))
        && (category === "all" || (asset.categories ?? []).includes(category))
      ))
      .sort((left, right) => {
        if (sortKey === "change24h") return Math.abs(safeMetric(right.change24h)) - Math.abs(safeMetric(left.change24h))
        return safeMetric(right[sortKey]) - safeMetric(left[sortKey])
      })
  }, [assets, category, search, sortKey])

  const topGainers = useMemo(
    () => [...assets]
      .filter((asset) => Number.isFinite(asset.change24h))
      .sort((left, right) => right.change24h - left.change24h)
      .slice(0, 3),
    [assets]
  )
  const topLosers = useMemo(
    () => [...assets]
      .filter((asset) => Number.isFinite(asset.change24h))
      .sort((left, right) => left.change24h - right.change24h)
      .slice(0, 3),
    [assets]
  )
  const volumeLeaders = useMemo(
    () => [...assets].sort((left, right) => right.volume24h - left.volume24h).slice(0, 3),
    [assets]
  )

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="rounded-[28px] border border-border bg-card p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Marche live
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    Kraken Live
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                    Un module marche plus large, plus clair et plus robuste. Kraken reste la source prioritaire
                    quand la paire existe; CoinGecko prend le relais de maniere visible si un actif manque.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[38rem] xl:grid-cols-4">
                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Actifs suivis
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                    {summary?.trackedAssets ?? assets.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Market breadth
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                    {summary ? `${summary.positiveAssets}/${summary.negativeAssets}` : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Volatilite moyenne
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                    {summary?.avgVolatility24h !== null && summary?.avgVolatility24h !== undefined
                      ? `${summary.avgVolatility24h.toFixed(1)}%`
                      : "—"}
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Source principale
                  </p>
                  <p className="mt-2 text-lg font-black text-foreground">
                    {summary?.primarySource ?? data?.source ?? "CoinGecko"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4 text-sm text-muted-foreground">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Live terminal
              </div>
              <span className="inline-flex items-center gap-2">
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh 10 s
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-3.5 w-3.5" />
                {updatedAtLabel ? `Mis a jour a ${updatedAtLabel}` : "En attente de donnees"}
              </span>
              {summary && (
                <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                  {summary.krakenAssets} actifs Kraken · {summary.fallbackAssets} fallback
                </span>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className="h-24 animate-pulse rounded-2xl border border-border bg-secondary/70"
                />
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="h-56 animate-pulse rounded-3xl border border-border bg-card"
                />
              ))}
            </div>
          </div>
        )}

        {data?.error && !loading && (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-card-xs">
            {data.error}
          </div>
        )}

        {!loading && assets.length > 0 && (
          <div className="space-y-4" key={tick}>
            <div className="grid gap-4 lg:grid-cols-3">
              {[
                { title: "Top gainers", items: topGainers },
                { title: "Top losers", items: topLosers },
                { title: "Volume leaders", items: volumeLeaders },
              ].map((column) => (
                <div key={column.title} className="rounded-3xl border border-border bg-card p-4 shadow-card-xs">
                  <div className="mb-3 flex items-center justify-between">
                    <h2 className="text-[15px] font-semibold text-foreground">{column.title}</h2>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                      24h
                    </span>
                  </div>
                  <div className="space-y-3">
                    {column.items.map((asset) => {
                      const positive = Number.isFinite(asset.change24h) && asset.change24h >= 0

                      return (
                        <div key={`${column.title}-${asset.id}`} className="rounded-2xl border border-border bg-secondary/60 px-3 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{asset.symbol}</p>
                              <p className="text-[11px] text-muted-foreground">{asset.name}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold tabular-nums text-foreground">{formatPrice(asset.price)}</p>
                              <p className={`text-[11px] font-semibold ${positive ? "text-emerald-600" : "text-red-600"}`}>
                                {formatChange(asset.change24h)}
                              </p>
                            </div>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${getSourceClasses(asset.source)}`}>
                              {getSourceLabel(asset.source)}
                            </span>
                            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                              Vol. {formatCompactUsd(asset.volume24h)}
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
                  <h2 className="text-[15px] font-semibold text-foreground">Crypto live grid</h2>
                  <p className="text-sm text-muted-foreground">
                    Prix, variation 24 h, categories, source reelle et fallback visible par actif.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Rechercher un actif"
                      className="h-10 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-sm text-foreground outline-none transition focus:border-ring sm:w-52"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-secondary/30 p-1">
                    {CATEGORY_FILTERS.map((item) => (
                      <button
                        key={item}
                        onClick={() => setCategory(item)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          category === item
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item === "all" ? "Tout" : item}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 rounded-xl border border-border bg-secondary/30 p-1">
                    {[
                      { label: "Cap", key: "marketCap" as const },
                      { label: "24h", key: "change24h" as const },
                      { label: "Volume", key: "volume24h" as const },
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setSortKey(item.key)}
                        className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                          sortKey === item.key
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

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
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-background">
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
                        <div className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                          {formatChange(asset.change24h)}
                        </div>
                      </div>

                      <div className="mt-4 flex items-end justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Prix
                          </p>
                          <p className="mt-1 text-xl font-black tabular-nums text-foreground">
                            {formatPrice(asset.price)}
                          </p>
                        </div>
                        <div className="h-10 w-20 rounded-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/20 to-emerald-500/0 opacity-80 blur-[1px]" />
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-2xl border border-border bg-background px-3 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Market cap
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatCompactUsd(asset.marketCap)}</p>
                        </div>
                        <div className="rounded-2xl border border-border bg-background px-3 py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                            Volume 24 h
                          </p>
                          <p className="mt-2 text-sm font-semibold text-foreground">{formatCompactUsd(asset.volume24h)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getSourceClasses(asset.source)}`}>
                          Source : {getSourceLabel(asset.source)}
                        </span>
                        {(asset.categories ?? []).slice(0, 3).map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-muted-foreground"
                          >
                            {item}
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

              <div className="border-t border-border px-5 py-4 text-[12px] leading-6 text-muted-foreground">
                Aucun prix n&apos;est invente. Si Kraken ne couvre pas une paire, CoinGecko prend le relais et le badge de source le montre. Si les deux sources manquent, l&apos;actif disparaît au lieu de simuler une valeur.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

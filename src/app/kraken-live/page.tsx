"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, ArrowLeft, Clock3, RefreshCw } from "lucide-react"

type KrakenTicker = {
  symbol: string
  price: number
  ask: number
  bid: number
  volume24h: number
}

type KrakenResponse = {
  source: string
  updatedAt: number
  tickers: KrakenTicker[]
  error?: string
}

function fmtPrice(p: number) {
  if (p >= 1000) return p.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (p >= 1) return p.toFixed(4)
  return p.toFixed(6)
}

function fmtVol(v: number) {
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`
  return v.toFixed(2)
}

function fmtSpread(spread: number) {
  if (spread >= 1000) return spread.toLocaleString("en-US", { maximumFractionDigits: 2 })
  if (spread >= 1) return spread.toFixed(2)
  return spread.toFixed(4)
}

function getSpreadTone(spreadPct: number) {
  if (spreadPct <= 0.03) return "text-emerald-700 bg-emerald-50 border-emerald-200"
  if (spreadPct <= 0.12) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-red-700 bg-red-50 border-red-200"
}

export default function KrakenLivePage() {
  const [data, setData] = useState<KrakenResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let mounted = true

    const fetchKraken = async () => {
      try {
        const res = await fetch("/api/kraken", { cache: "no-store" })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = (await res.json()) as KrakenResponse
        if (mounted) {
          setData(json)
          setTick((t) => t + 1)
        }
      } catch (err) {
        console.error("Kraken fetch error:", err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchKraken()
    const interval = setInterval(fetchKraken, 5000)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  const spreadRows =
    data?.tickers.map((ticker) => {
      const spread = ticker.ask - ticker.bid
      const spreadPct = ticker.bid > 0 ? (spread / ticker.bid) * 100 : 0

      return {
        ticker,
        spread,
        spreadPct,
      }
    }) ?? []

  const averageSpreadPct =
    spreadRows.length > 0
      ? spreadRows.reduce((total, row) => total + row.spreadPct, 0) / spreadRows.length
      : 0

  const tightestSpreadPct =
    spreadRows.length > 0
      ? Math.min(...spreadRows.map((row) => row.spreadPct))
      : 0

  const totalVolume24h =
    spreadRows.length > 0
      ? spreadRows.reduce((total, row) => total + row.ticker.volume24h, 0)
      : 0

  const updatedAtLabel = data
    ? new Date(data.updatedAt).toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-card-xs sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  <Activity className="h-3.5 w-3.5" />
                  Flux spot Kraken
                </div>

                <div>
                  <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">
                    Kraken Live
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-[15px]">
                    Données en direct, lecture claire des paires suivies et
                    rafraîchissement automatique toutes les 5 s.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[32rem]">
                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Paires suivies
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                    {data?.tickers.length ?? 0}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Volume 24 h
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                    {fmtVol(totalVolume24h)}
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Spread moyen
                  </p>
                  <p className="mt-2 text-2xl font-black tabular-nums text-foreground">
                    {averageSpreadPct.toFixed(3)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-secondary px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Source
                  </p>
                  <p className="mt-2 text-xl font-black text-foreground">
                    {data?.source ?? "Kraken"}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                  Live
                </div>

                <span className="inline-flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh 5 s
                </span>

                <span className="inline-flex items-center gap-2">
                  <Clock3 className="h-3.5 w-3.5" />
                  {updatedAtLabel ? `Mis à jour à ${updatedAtLabel}` : "En attente de données"}
                </span>
              </div>

              <p className="text-xs sm:text-sm">
                Spread le plus serré:{" "}
                <span className="font-semibold tabular-nums text-foreground">
                  {tightestSpreadPct.toFixed(3)}%
                </span>
              </p>
            </div>
          </div>
        </div>

        {loading && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-2xl border border-border bg-secondary/70"
                />
              ))}
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-card-xs">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="mb-3 h-16 animate-pulse rounded-2xl border border-border bg-secondary/70 last:mb-0"
                />
              ))}
            </div>
          </div>
        )}

        {data?.error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-card-xs">
            {data.error}
          </div>
        )}

        {data && !loading && (
          <div className="space-y-4" key={tick}>
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-card-xs">
              <div className="border-b border-border px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-lg font-black tracking-tight text-foreground">
                      Marché en direct
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Prix spot, volume et spread réels. La variation 24 h reste masquée quand le flux ne la fournit pas.
                    </p>
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {data.tickers.length} paires
                  </p>
                </div>
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-[980px] w-full table-fixed">
                  <thead>
                    <tr className="border-b border-border bg-secondary/40">
                      <th className="px-6 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Actif
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Prix spot
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Variation 24 h
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Volume 24 h
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Ask
                      </th>
                      <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Bid
                      </th>
                      <th className="px-6 py-3 text-right text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                        Spread
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {spreadRows.map(({ ticker, spread, spreadPct }) => (
                      <tr key={ticker.symbol} className="transition-colors hover:bg-secondary/40">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-sm font-black text-foreground">
                              {ticker.symbol.slice(0, 1)}
                            </div>
                            <div>
                              <p className="text-base font-black tracking-tight text-foreground">{ticker.symbol}</p>
                              <p className="text-xs text-muted-foreground">Kraken spot / USD</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-lg font-black tabular-nums text-foreground">${fmtPrice(ticker.price)}</p>
                          <p className="text-[11px] text-muted-foreground">Prix principal</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-semibold tabular-nums text-muted-foreground">—</p>
                          <p className="text-[11px] text-muted-foreground">Non fournie par ce flux</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">{fmtVol(ticker.volume24h)}</p>
                          <p className="text-[11px] text-muted-foreground">24 h</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">${fmtPrice(ticker.ask)}</p>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <p className="text-sm font-semibold tabular-nums text-foreground">${fmtPrice(ticker.bid)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex flex-col items-end gap-1">
                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSpreadTone(spreadPct)}`}>
                              {spreadPct.toFixed(3)}%
                            </span>
                            <p className="text-[11px] tabular-nums text-muted-foreground">
                              {fmtSpread(spread)} USD
                            </p>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-border md:hidden">
                {spreadRows.map(({ ticker, spread, spreadPct }) => (
                  <div key={ticker.symbol} className="space-y-4 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-secondary text-sm font-black text-foreground">
                          {ticker.symbol.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-base font-black tracking-tight text-foreground">{ticker.symbol}</p>
                          <p className="text-xs text-muted-foreground">Kraken spot / USD</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xl font-black tabular-nums text-foreground">
                          ${fmtPrice(ticker.price)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Prix spot
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full border border-border bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                        Variation 24 h indisponible
                      </span>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getSpreadTone(spreadPct)}`}>
                        Spread {spreadPct.toFixed(3)}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-border bg-secondary px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Volume 24 h
                        </p>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                          {fmtVol(ticker.volume24h)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Spread
                        </p>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                          {fmtSpread(spread)} USD
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Ask
                        </p>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                          ${fmtPrice(ticker.ask)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Bid
                        </p>
                        <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                          ${fmtPrice(ticker.bid)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-border bg-card p-5 shadow-card-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Lecture
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  Cette vue affiche uniquement les valeurs réelles renvoyées par
                  Kraken: prix spot, ask, bid, volume 24 h et spread calculé à
                  partir du carnet. La variation 24 h n&apos;est pas affichée tant que
                  ce flux ne la fournit pas directement.
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-card p-5 shadow-card-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  Mise à jour
                </p>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  Le flux est relancé toutes les 5 secondes. Si l&apos;API ralentit ou
                  échoue, l&apos;état d&apos;erreur reste visible au lieu d&apos;afficher une
                  donnée inventée.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

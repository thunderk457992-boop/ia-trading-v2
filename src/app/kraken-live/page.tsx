"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Activity, ArrowLeft, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

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

const SYMBOL_COLOR: Record<string, string> = {
  BTC: "text-amber-600",
  ETH: "text-blue-600",
  SOL: "text-purple-600",
  XRP: "text-sky-600",
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-4 py-10">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-600" />
                </div>
                <h1 className="text-2xl font-black tracking-tight text-foreground">Kraken Live</h1>
              </div>
              <p className="text-sm text-muted-foreground">Données en direct — rafraîchissement toutes les 5s</p>
            </div>
            {data && (
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1.5 justify-end mb-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-semibold text-emerald-600">Live</span>
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  {new Date(data.updatedAt).toLocaleTimeString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {data?.error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            {data.error}
          </div>
        )}

        {/* Tickers */}
        {data && !loading && (
          <div className="space-y-2" key={tick}>
            {data.tickers.map((ticker) => {
              const spread = ticker.ask - ticker.bid
              const spreadPct = ticker.bid > 0 ? (spread / ticker.bid) * 100 : 0
              return (
                <div
                  key={ticker.symbol}
                  className="p-5 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                        <span className={cn("text-sm font-black", SYMBOL_COLOR[ticker.symbol] ?? "text-muted-foreground")}>
                          {ticker.symbol[0]}
                        </span>
                      </div>
                      <div>
                        <div className={cn("text-base font-black", SYMBOL_COLOR[ticker.symbol] ?? "text-foreground")}>
                          {ticker.symbol}
                        </div>
                        <div className="text-xs text-muted-foreground">Kraken</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black tabular-nums text-foreground">
                        ${fmtPrice(ticker.price)}
                      </div>
                      <div className="text-xs text-muted-foreground tabular-nums">
                        spread {spreadPct.toFixed(3)}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="px-3 py-2.5 rounded-xl bg-secondary">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Ask</p>
                      <p className="text-sm font-bold text-emerald-600 tabular-nums">${fmtPrice(ticker.ask)}</p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-secondary">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Bid</p>
                      <p className="text-sm font-bold text-red-500 tabular-nums">${fmtPrice(ticker.bid)}</p>
                    </div>
                    <div className="px-3 py-2.5 rounded-xl bg-secondary">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 font-semibold">Vol 24h</p>
                      <p className="text-sm font-bold text-foreground tabular-nums">{fmtVol(ticker.volume24h)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Market indicators */}
        {data && data.tickers.length >= 2 && (
          <div className="mt-6 p-4 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-3">Indicateurs</p>
            <div className="flex items-center gap-4 flex-wrap">
              {data.tickers.map((t) => (
                <div key={t.symbol} className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3 text-muted-foreground" />
                  <span className={cn("text-xs font-bold", SYMBOL_COLOR[t.symbol] ?? "text-muted-foreground")}>{t.symbol}</span>
                  <span className="text-xs text-muted-foreground">${fmtPrice(t.price)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

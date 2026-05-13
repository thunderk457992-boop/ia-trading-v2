"use client"

import Link from "next/link"
import { ArrowRight, TrendingDown, TrendingUp, Minus } from "lucide-react"
import type { CryptoPrice, MarketGlobal } from "@/lib/coingecko"

interface MarketWeeklyCardProps {
  cryptoPrices: CryptoPrice[]
  marketGlobal: MarketGlobal | null
  lastAnalysisAt: string | null
}

function getDaysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  const diff = Date.now() - new Date(dateStr).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

function getSentimentLabel(avg7d: number): { label: string; tone: "up" | "down" | "neutral" } {
  if (avg7d > 8)  return { label: "Haussier fort", tone: "up" }
  if (avg7d > 2)  return { label: "Haussier modéré", tone: "up" }
  if (avg7d > -2) return { label: "Neutre", tone: "neutral" }
  if (avg7d > -8) return { label: "Baissier modéré", tone: "down" }
  return { label: "Baissier fort", tone: "down" }
}

function getPhaseContext(btcDominance: number | null, avg7d: number): string {
  if (btcDominance !== null && btcDominance > 56) {
    return avg7d < 0
      ? "Dominance BTC élevée et semaine en retrait — le marché reste en mode défensif. Peu de rotation vers les altcoins."
      : "Bitcoin garde la main. Le mouvement se fait principalement sur BTC/ETH, les altcoins suivent avec moins de vigueur."
  }
  if (btcDominance !== null && btcDominance < 46) {
    return avg7d > 3
      ? "Dominance BTC en recul — des capitaux circulent vers les altcoins. La fenêtre peut rester étroite."
      : "Dominance BTC faible mais sans momentum clair. Le marché cherche une direction."
  }
  if (avg7d > 6) return "Semaine nettement positive sur l'ensemble du marché. Un mouvement de cette ampleur peut précéder une consolidation."
  if (avg7d < -6) return "Semaine difficile. En correction, rester sur l'allocation cible et éviter les ajustements impulsifs reste la priorité."
  return "Marché dans une zone de consolidation. Pas de signal directionnel fort cette semaine."
}

export function MarketWeeklyCard({ cryptoPrices, marketGlobal, lastAnalysisAt }: MarketWeeklyCardProps) {
  const btc = cryptoPrices.find((p) => p.symbol === "BTC")
  const eth = cryptoPrices.find((p) => p.symbol === "ETH")

  const prices7d = cryptoPrices.filter((p) => typeof p.change7d === "number")
  const avg7d = prices7d.length
    ? prices7d.reduce((s, p) => s + p.change7d, 0) / prices7d.length
    : 0

  const btcDominance = marketGlobal?.btcDominance ?? null
  const sentiment = getSentimentLabel(avg7d)
  const phaseContext = getPhaseContext(btcDominance, avg7d)
  const daysSinceAnalysis = getDaysSince(lastAnalysisAt)

  const SentimentIcon = sentiment.tone === "up" ? TrendingUp : sentiment.tone === "down" ? TrendingDown : Minus
  const sentimentColor = sentiment.tone === "up"
    ? "text-success"
    : sentiment.tone === "down"
    ? "text-destructive"
    : "text-muted-foreground"

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Contexte marché</p>
          <h3 className="mt-0.5 text-[15px] font-semibold text-foreground">Semaine en cours</h3>
        </div>
        <div className={`flex items-center gap-1.5 text-sm font-semibold ${sentimentColor}`}>
          <SentimentIcon className="h-4 w-4" />
          <span>{sentiment.label}</span>
        </div>
      </div>

      <p className="text-[13px] leading-6 text-muted-foreground">{phaseContext}</p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-border bg-secondary px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">BTC dom.</p>
          <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">
            {btcDominance !== null ? `${btcDominance.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">BTC 7j</p>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${btc && btc.change7d >= 0 ? "text-success" : "text-destructive"}`}>
            {btc ? `${btc.change7d >= 0 ? "+" : ""}${btc.change7d.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-secondary px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">ETH 7j</p>
          <p className={`mt-1 text-sm font-semibold tabular-nums ${eth && eth.change7d >= 0 ? "text-success" : "text-destructive"}`}>
            {eth ? `${eth.change7d >= 0 ? "+" : ""}${eth.change7d.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {daysSinceAnalysis !== null && daysSinceAnalysis >= 7 && (
        <div className="mt-4">
          <Link
            href="/advisor"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Mettre à jour mon analyse
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  )
}

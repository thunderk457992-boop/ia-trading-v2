"use client"

import { ShieldCheck, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MarketGlobal } from "@/lib/coingecko"

interface AllocationItem {
  symbol: string
  percentage: number
}

interface WhyNowCardProps {
  marketGlobal: MarketGlobal | null
  positiveAssets: number
  negativeAssets: number
  marketVolatility: number | null
  latestAllocation: AllocationItem[]
}

function buildWhyNowCopy({
  marketGlobal,
  positiveAssets,
  negativeAssets,
  marketVolatility,
  latestAllocation,
}: WhyNowCardProps) {
  const btcDominance = marketGlobal?.btcDominance ?? null
  const altExposure = latestAllocation
    .filter((item) => !["BTC", "ETH", "USDC", "USDT"].includes(item.symbol))
    .reduce((sum, item) => sum + item.percentage, 0)

  const marketBreadth = positiveAssets + negativeAssets > 0
    ? positiveAssets >= negativeAssets
      ? "davantage d'actifs montent que ne baissent"
      : "la baisse touche encore une large part du marché"
    : "la largeur de marché reste difficile à lire"

  if (btcDominance !== null && btcDominance >= 55) {
    return `Bitcoin garde encore la main avec ${btcDominance.toFixed(1)}% de dominance. Dans ce contexte, ${marketBreadth}, et une exposition trop forte aux altcoins augmente le risque. Le plan privilégie donc BTC et ETH, puis ajoute seulement une poche plus dynamique.`
  }

  if (marketVolatility !== null && marketVolatility >= 6) {
    return `La volatilité reste élevée autour de ${marketVolatility.toFixed(1)}% en moyenne sur 24h. Quand le marché secoue davantage, l'objectif n'est pas de deviner le point parfait, mais de garder une allocation lisible et une taille de risque supportable.`
  }

  if (altExposure >= 35) {
    return `Le plan conserve une poche altcoins d'environ ${altExposure.toFixed(0)}%, mais elle reste encadrée. L'idée n'est pas de courir après chaque rotation, mais de garder un cœur liquide et de n'ajouter du bêta que lorsque le profil le permet.`
  }

  return `Le marché reste assez structuré pour construire une allocation rationnelle. L'IA part d'un cœur BTC/ETH plus robuste, puis ajoute des satellites avec parcimonie afin d'éviter les décisions impulsives quand le contexte change.`
}

export function WhyNowCard(props: WhyNowCardProps) {
  const copy = buildWhyNowCopy(props)
  const btcDominance = props.marketGlobal?.btcDominance

  const dominanceSignal = btcDominance !== null && btcDominance !== undefined
    ? btcDominance >= 56 ? { label: "Risk-off", cls: "text-warning" }
    : btcDominance <= 46 ? { label: "Risk-on", cls: "text-success" }
    : { label: "Neutre", cls: "text-muted-foreground" }
    : null

  return (
    <div className="surface-card p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="eyebrow">Contexte utilisé</p>
            <h3 className="text-[15px] font-semibold text-foreground">Pourquoi maintenant</h3>
          </div>
        </div>
        {dominanceSignal && (
          <span className={cn("text-[11px] font-semibold", dominanceSignal.cls)}>
            {dominanceSignal.label}
          </span>
        )}
      </div>

      <p className="text-[13px] leading-6 text-muted-foreground">{copy}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">BTC dominance</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {btcDominance !== undefined && btcDominance !== null ? `${btcDominance.toFixed(1)}%` : "—"}
          </p>
        </div>
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Largeur marché</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {props.positiveAssets > 0 || props.negativeAssets > 0
              ? `${props.positiveAssets} hausse · ${props.negativeAssets} baisse`
              : "—"}
          </p>
        </div>
        <div className="surface-soft px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Volatilité 24h</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {props.marketVolatility !== null && props.marketVolatility !== undefined
              ? `${props.marketVolatility.toFixed(1)}%`
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-[11px] leading-5 text-muted-foreground">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <span>Axiom ne prédit pas le marché. Il structure un plan rationnel selon le profil et les données disponibles.</span>
      </div>
    </div>
  )
}

"use client"

import { ShieldCheck, TrendingUp } from "lucide-react"
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
      : "la baisse touche encore une large part du marche"
    : "la largeur de marche reste difficile a lire"

  if (btcDominance !== null && btcDominance >= 55) {
    return `Bitcoin garde encore la main avec ${btcDominance.toFixed(1)}% de dominance. Dans ce contexte, ${marketBreadth}, et une exposition trop forte aux altcoins augmente le risque. Le plan privilegie donc BTC et ETH, puis ajoute seulement une poche plus dynamique.`
  }

  if (marketVolatility !== null && marketVolatility >= 6) {
    return `La volatilite reste elevee autour de ${marketVolatility.toFixed(1)}% en moyenne sur 24h. Quand le marche secoue davantage, l'objectif n'est pas de deviner le point parfait, mais de garder une allocation lisible et une taille de risque supportable.`
  }

  if (altExposure >= 35) {
    return `Ton plan conserve une poche altcoins d'environ ${altExposure.toFixed(0)}%, mais elle reste encadree. L'idee n'est pas de courir apres chaque rotation, mais de garder un coeur liquide et de n'ajouter du beta que lorsque le profil le permet.`
  }

  return `Le marche reste assez structure pour construire une allocation rationnelle. L'IA part d'un coeur BTC/ETH plus robuste, puis ajoute des satellites avec parcimonie afin d'eviter les decisions impulsives quand le contexte change.`
}

export function WhyNowCard(props: WhyNowCardProps) {
  const copy = buildWhyNowCopy(props)
  const btcDominance = props.marketGlobal?.btcDominance

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-slate-500" />
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Pourquoi maintenant ?</p>
          <h3 className="text-[15px] font-semibold text-slate-950">Contexte marche utilise par l&apos;IA</h3>
        </div>
      </div>

      <p className="mt-3 text-[13px] leading-6 text-slate-600">{copy}</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">BTC dominance</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {btcDominance !== undefined && btcDominance !== null ? `${btcDominance.toFixed(1)}%` : "Indisponible"}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Largeur marche</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {props.positiveAssets} en hausse / {props.negativeAssets} en baisse
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-slate-400">Volatilite</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {props.marketVolatility !== null ? `${props.marketVolatility.toFixed(1)}%` : "Indisponible"}
          </p>
        </div>
      </div>

      <div className="mt-4 inline-flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-5 text-amber-900">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
        <span>Axiom ne predit pas le marche. Il structure un plan rationnel selon ton profil et les donnees disponibles.</span>
      </div>
    </div>
  )
}

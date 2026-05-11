import type { CryptoPrice, MarketGlobal } from "@/lib/coingecko"

interface AllocationBuckets {
  BTC: number
  ETH: number
  ALT: number
}

export interface MarketDecision {
  label: string
  allocation: AllocationBuckets
  strategy: string
  executionNow: string
  riskLevel: "prudent" | "modere" | "opportuniste"
  reason: string
  errorsToAvoid: string[]
  metrics: {
    btcDominance: number | null
    avgAbsChange24h: number
    positiveBreadthPct: number
    marketChange24h: number | null
  }
}

interface AllocationItem {
  symbol?: string
  percentage?: number
}

function sumCoreAllocation(allocations: AllocationItem[] | null | undefined): number {
  if (!Array.isArray(allocations)) return 0

  return allocations.reduce((total, item) => {
    const symbol = String(item?.symbol ?? "").toUpperCase()
    const percentage = Number(item?.percentage ?? 0)
    if (!Number.isFinite(percentage)) return total
    return symbol === "BTC" || symbol === "ETH" ? total + percentage : total
  }, 0)
}

function formatPct(value: number | null): string {
  if (value === null) return "n/a"
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
}

export function buildMarketDecision(
  prices: CryptoPrice[],
  global: MarketGlobal | null,
  latestAllocations?: AllocationItem[] | null
): MarketDecision | null {
  const validPrices = prices.filter((asset) => Number.isFinite(asset.change24h))
  if (!validPrices.length) return null

  const avgAbsChange24h = validPrices.reduce((sum, asset) => sum + Math.abs(asset.change24h), 0) / validPrices.length
  const positiveBreadthPct = (validPrices.filter((asset) => asset.change24h > 0).length / validPrices.length) * 100
  const btcDominance = global?.btcDominance ?? null
  const marketChange24h = global?.change24h ?? null
  const portfolioCoreWeight = sumCoreAllocation(latestAllocations)

  const highDominance = btcDominance !== null && btcDominance >= 55
  const lowDominance = btcDominance !== null && btcDominance <= 49
  const highVolatility = avgAbsChange24h >= 4.5 || Math.abs(marketChange24h ?? 0) >= 3.5
  const uncertainMarket =
    btcDominance === null
    || (Math.abs(marketChange24h ?? 0) <= 1.2 && positiveBreadthPct >= 35 && positiveBreadthPct <= 65)
    || (avgAbsChange24h >= 2.7 && avgAbsChange24h < 4.5)

  let allocation: AllocationBuckets
  let strategy: string
  let executionNow: string
  let riskLevel: MarketDecision["riskLevel"]
  let label: string
  let errorsToAvoid: string[]

  if (highDominance || highVolatility) {
    allocation = { BTC: 55, ETH: 25, ALT: 20 }
    strategy = "Privilégier le socle BTC/ETH et réduire l'exposition aux altcoins tant que le marché reste nerveux."
    executionNow = uncertainMarket
      ? "Entrer via DCA en 3 ou 4 paliers et éviter les achats impulsifs sur les altcoins."
      : "Renforcer d'abord BTC et ETH, puis garder une poche altcoins limitée et sélective."
    riskLevel = "prudent"
    label = "BTC/ETH defensif"
    errorsToAvoid = [
      "Surpondérer les altcoins alors que la dominance BTC reste élevée.",
      "Entrer en une seule fois dans un marché trop volatil.",
      "Confondre rebond court terme et reprise durable.",
    ]
  } else if (lowDominance && positiveBreadthPct >= 60 && avgAbsChange24h < 3.2) {
    allocation = { BTC: 40, ETH: 25, ALT: 35 }
    strategy = "Ouvrir la porte aux altcoins solides, tout en gardant un noyau BTC/ETH pour stabiliser le portefeuille."
    executionNow = "Avancer par étapes et privilégier les altcoins liquides plutôt que les petites capitalisations."
    riskLevel = "opportuniste"
    label = "Rotation altcoins"
    errorsToAvoid = [
      "Prendre des altcoins illiquides juste parce que la dominance BTC baisse.",
      "Réduire trop fortement le noyau BTC/ETH.",
      "Poursuivre des hausses déjà trop étirées.",
    ]
  } else {
    allocation = { BTC: 48, ETH: 27, ALT: 25 }
    strategy = uncertainMarket
      ? "Rester équilibré et préférer un déploiement progressif plutôt qu'une entrée trop agressive."
      : "Conserver une base BTC/ETH majoritaire et n'ajouter des altcoins qu'avec discipline."
    executionNow = uncertainMarket
      ? "Fractionner les entrées, surveiller la dominance BTC et attendre des confirmations avant d'augmenter le risque."
      : "Entrer par paliers avec une priorité au noyau BTC/ETH, puis compléter seulement si le marché tient."
    riskLevel = "modere"
    label = uncertainMarket ? "Equilibre en DCA" : "Equilibre discipline"
    errorsToAvoid = [
      "Vouloir sur-réagir à un marché encore incertain.",
      "Sous-estimer le poids de BTC et ETH dans la stabilité du portefeuille.",
      "Multiplier les lignes altcoins sans avantage clair.",
    ]
  }

  const portfolioNote = portfolioCoreWeight > 0
    ? portfolioCoreWeight < allocation.BTC + allocation.ETH
      ? `Votre dernière analyse est plus exposée aux altcoins que le moteur actuel (${portfolioCoreWeight.toFixed(0)}% de BTC/ETH).`
      : `Votre dernière analyse garde déjà un noyau BTC/ETH cohérent (${portfolioCoreWeight.toFixed(0)}%).`
    : "Aucune allocation personnelle récente n'est disponible pour comparer."

  const reason = [
    `Dominance BTC ${btcDominance !== null ? `${btcDominance.toFixed(1)}%` : "indisponible"}.`,
    `Variation marché 24h ${formatPct(marketChange24h)}.`,
    `Volatilité moyenne 24h ${avgAbsChange24h.toFixed(1)}%.`,
    `${positiveBreadthPct.toFixed(0)}% des actifs suivis sont dans le vert.`,
    portfolioNote,
  ].join(" ")

  return {
    label,
    allocation,
    strategy,
    executionNow,
    riskLevel,
    reason,
    errorsToAvoid,
    metrics: {
      btcDominance,
      avgAbsChange24h,
      positiveBreadthPct,
      marketChange24h,
    },
  }
}

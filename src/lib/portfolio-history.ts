import {
  fetchMarketsData,
  fetchPortfolioMarketHistory,
  type CryptoPrice,
  type MarketChartPoint,
} from "@/lib/coingecko"
import type { KrakenTicker } from "@/lib/kraken"

export interface PortfolioAllocation {
  symbol: string
  percentage: number
}

export interface PortfolioSnapshotAllocation extends PortfolioAllocation {
  quantity?: number | string | null
  invested_amount?: number | string | null
  current_value?: number | string | null
}

export interface PortfolioHistorySeed {
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
  allocations: PortfolioSnapshotAllocation[] | null
}

export interface PortfolioContributionSeed {
  created_at: string
  invested_amount: number | string | null
  allocations: PortfolioAllocation[] | null
}

export interface PortfolioSnapshotComputation {
  portfolioValue: number
  investedAmount: number
  performancePercent: number
  allocations: PortfolioSnapshotAllocation[]
  mode: string
}

interface NormalizedContributionSeed {
  timestamp: number
  investedAmount: number
  allocations: PortfolioAllocation[]
}

interface NormalizedHistorySeed {
  timestamp: number
  portfolioValue: number
  investedAmount: number | null
  allocations: PortfolioSnapshotAllocation[]
}

interface ResolvedContribution {
  investedAmount: number
  allocations: Array<PortfolioAllocation & { entryPrice: number }>
}

interface PortfolioPosition {
  symbol: string
  quantity: number
  investedAmount: number
}

const DAY_MS = 24 * 60 * 60 * 1000

function parseFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizePortfolioAllocations(value: unknown): PortfolioSnapshotAllocation[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => {
      const percentage = Number(item.percentage ?? 0)
      return {
        symbol: String(item.symbol ?? "").toUpperCase().trim(),
        percentage,
        quantity: parseFiniteNumber(item.quantity as number | string | null | undefined),
        invested_amount: parseFiniteNumber(item.invested_amount as number | string | null | undefined),
        current_value: parseFiniteNumber(item.current_value as number | string | null | undefined),
      }
    })
    .filter((item) => item.symbol && Number.isFinite(item.percentage) && item.percentage > 0)
}

function normalizePortfolioHistorySeed(seed: PortfolioHistorySeed | null | undefined) {
  if (!seed) return null

  const timestamp = Date.parse(seed.created_at)
  const portfolioValue = parseFiniteNumber(seed.portfolio_value)
  const investedAmount = parseFiniteNumber(seed.invested_amount)
  const allocations = normalizePortfolioAllocations(seed.allocations)

  if (!Number.isFinite(timestamp) || portfolioValue === null || portfolioValue <= 0 || !allocations.length) {
    return null
  }

  return {
    timestamp,
    portfolioValue,
    investedAmount,
    allocations,
  } satisfies NormalizedHistorySeed
}

function normalizePortfolioContributionSeed(seed: PortfolioContributionSeed | null | undefined) {
  if (!seed) return null

  const timestamp = Date.parse(seed.created_at)
  const investedAmount = parseFiniteNumber(seed.invested_amount)
  const allocations = normalizePortfolioAllocations(seed.allocations).map((allocation) => ({
    symbol: allocation.symbol,
    percentage: allocation.percentage,
  }))

  if (!Number.isFinite(timestamp) || investedAmount === null || investedAmount <= 0 || !allocations.length) {
    return null
  }

  return {
    timestamp,
    investedAmount,
    allocations,
  } satisfies NormalizedContributionSeed
}

function getPriceAtOrBefore(points: MarketChartPoint[], timestamp: number) {
  let price: number | null = null
  for (const point of points) {
    if (point.timestamp > timestamp) break
    price = point.price
  }
  return price
}

function mergeMarketUniverse(primary: CryptoPrice[], secondary: CryptoPrice[]) {
  const bySymbol = new Map<string, CryptoPrice>()
  for (const coin of [...primary, ...secondary]) {
    if (!bySymbol.has(coin.symbol)) bySymbol.set(coin.symbol, coin)
  }
  return Array.from(bySymbol.values())
}

async function ensureMarketUniverse(requiredSymbols: string[], marketPrices: CryptoPrice[]) {
  const missingSymbols = requiredSymbols.filter((symbol) => !marketPrices.some((coin) => coin.symbol === symbol))
  if (!missingSymbols.length) return marketPrices

  const extendedMarkets = await fetchMarketsData(100)
  return extendedMarkets.length > 0
    ? mergeMarketUniverse(marketPrices, extendedMarkets)
    : marketPrices
}

function buildLivePriceMap(params: {
  requiredSymbols: string[]
  marketUniverse: CryptoPrice[]
  histories: Array<{ symbol: string; prices: MarketChartPoint[] }>
  krakenTickers?: KrakenTicker[]
}) {
  const { requiredSymbols, marketUniverse, histories, krakenTickers = [] } = params
  const krakenPriceMap = new Map(krakenTickers.map((ticker) => [ticker.symbol, ticker.price]))
  const livePrices = new Map<string, number>()
  let usedKraken = false

  for (const symbol of requiredSymbols) {
    const krakenPrice = krakenPriceMap.get(symbol) ?? null
    const marketPrice = marketUniverse.find((coin) => coin.symbol === symbol)?.price ?? null
    const historyPrice = histories.find((history) => history.symbol === symbol)?.prices.at(-1)?.price ?? null
    const livePrice = krakenPrice ?? marketPrice ?? historyPrice ?? null

    if (!livePrice) return null
    if (krakenPrice) usedKraken = true
    livePrices.set(symbol, livePrice)
  }

  return { livePrices, usedKraken }
}

function addPosition(
  positions: Map<string, PortfolioPosition>,
  symbol: string,
  quantity: number,
  investedAmount: number
) {
  const existing = positions.get(symbol)
  if (existing) {
    existing.quantity += quantity
    existing.investedAmount += investedAmount
    return
  }

  positions.set(symbol, {
    symbol,
    quantity,
    investedAmount,
  })
}

function roundPercentage(value: number) {
  return Number(value.toFixed(2))
}

function roundQuantity(value: number) {
  return Number(value.toFixed(8))
}

function roundCurrency(value: number) {
  return Number(value.toFixed(2))
}

function buildSnapshotFromPositions(params: {
  positions: Map<string, PortfolioPosition>
  livePrices: Map<string, number>
  investedAmount: number
  mode: string
}) {
  const { positions, livePrices, investedAmount, mode } = params
  if (!positions.size || investedAmount <= 0) return null

  const valuedPositions = Array.from(positions.values())
    .map((position) => {
      const livePrice = livePrices.get(position.symbol)
      if (!livePrice) return null

      return {
        ...position,
        currentValue: position.quantity * livePrice,
      }
    })
    .filter((position): position is PortfolioPosition & { currentValue: number } => (
      position !== null && position.currentValue > 0
    ))
    .sort((left, right) => right.currentValue - left.currentValue)

  if (!valuedPositions.length) return null

  const portfolioValue = roundCurrency(
    valuedPositions.reduce((total, position) => total + position.currentValue, 0)
  )

  const allocations = valuedPositions.map((position) => ({
    symbol: position.symbol,
    percentage: roundPercentage((position.currentValue / portfolioValue) * 100),
    quantity: roundQuantity(position.quantity),
    invested_amount: roundCurrency(position.investedAmount),
    current_value: roundCurrency(position.currentValue),
  }))

  const totalPercentage = allocations.reduce((total, allocation) => total + allocation.percentage, 0)
  const percentageDelta = roundPercentage(100 - totalPercentage)
  if (allocations.length > 0 && percentageDelta !== 0) {
    allocations[0].percentage = roundPercentage(allocations[0].percentage + percentageDelta)
  }

  const performancePercent = roundPercentage(((portfolioValue - investedAmount) / investedAmount) * 100)

  return {
    portfolioValue,
    investedAmount: roundCurrency(investedAmount),
    performancePercent,
    allocations,
    mode,
  } satisfies PortfolioSnapshotComputation
}

export function computePortfolioSnapshotFromResolvedContributions(params: {
  contributions: ResolvedContribution[]
  livePrices: Map<string, number>
  mode?: string
}) {
  const { contributions, livePrices, mode = "aggregated_portfolio" } = params
  if (!contributions.length) return null

  const positions = new Map<string, PortfolioPosition>()
  let totalInvestedAmount = 0

  for (const contribution of contributions) {
    if (contribution.investedAmount <= 0 || !contribution.allocations.length) continue

    totalInvestedAmount += contribution.investedAmount

    for (const allocation of contribution.allocations) {
      if (allocation.entryPrice <= 0) return null

      const investedAssetAmount = contribution.investedAmount * (allocation.percentage / 100)
      const quantity = investedAssetAmount / allocation.entryPrice
      addPosition(positions, allocation.symbol, quantity, investedAssetAmount)
    }
  }

  return buildSnapshotFromPositions({
    positions,
    livePrices,
    investedAmount: totalInvestedAmount,
    mode,
  })
}

export async function computeAggregatedPortfolioSnapshotFromAnalyses(params: {
  analyses: PortfolioContributionSeed[]
  marketPrices: CryptoPrice[]
  marketFetchedAt: number
  krakenTickers?: KrakenTicker[]
}) {
  const { analyses, marketPrices, marketFetchedAt, krakenTickers = [] } = params
  const normalizedContributions = analyses
    .map((analysis) => normalizePortfolioContributionSeed(analysis))
    .filter((analysis): analysis is NormalizedContributionSeed => analysis !== null)
    .sort((left, right) => left.timestamp - right.timestamp)

  if (!normalizedContributions.length) return null

  const requiredSymbols = Array.from(new Set(
    normalizedContributions.flatMap((analysis) => analysis.allocations.map((allocation) => allocation.symbol))
  ))
  const marketUniverse = await ensureMarketUniverse(requiredSymbols, marketPrices)
  const oldestTimestamp = normalizedContributions[0].timestamp
  const daysNeeded = Math.max(1, Math.ceil((marketFetchedAt - oldestTimestamp) / DAY_MS) + 1)
  const histories = await fetchPortfolioMarketHistory(
    requiredSymbols.map((symbol) => ({ symbol, percentage: 0 })),
    marketUniverse,
    daysNeeded
  )

  if (!histories.length) return null

  const livePrices = buildLivePriceMap({
    requiredSymbols,
    marketUniverse,
    histories,
    krakenTickers,
  })
  if (!livePrices) return null

  const resolvedContributions: ResolvedContribution[] = []

  for (const contribution of normalizedContributions) {
    const resolvedAllocations: ResolvedContribution["allocations"] = []

    for (const allocation of contribution.allocations) {
      const history = histories.find((item) => item.symbol === allocation.symbol)
      const entryPrice = history ? getPriceAtOrBefore(history.prices, contribution.timestamp) : null
      if (!entryPrice) return null

      resolvedAllocations.push({
        symbol: allocation.symbol,
        percentage: allocation.percentage,
        entryPrice,
      })
    }

    resolvedContributions.push({
      investedAmount: contribution.investedAmount,
      allocations: resolvedAllocations,
    })
  }

  return computePortfolioSnapshotFromResolvedContributions({
    contributions: resolvedContributions,
    livePrices: livePrices.livePrices,
    mode: livePrices.usedKraken ? "aggregated_with_kraken" : "aggregated_with_coingecko",
  })
}

export async function computePortfolioSnapshotValue(params: {
  latestSnapshot: PortfolioHistorySeed | null | undefined
  investedAmount: number
  marketPrices: CryptoPrice[]
  marketFetchedAt: number
  krakenTickers?: KrakenTicker[]
}) {
  const { latestSnapshot, investedAmount, marketPrices, marketFetchedAt, krakenTickers = [] } = params
  if (!investedAmount || investedAmount <= 0) return null

  const normalized = normalizePortfolioHistorySeed(latestSnapshot)
  if (!normalized) {
    return {
      portfolioValue: roundCurrency(investedAmount),
      investedAmount: roundCurrency(investedAmount),
      performancePercent: 0,
      allocations: [],
      mode: "initial_snapshot",
    } satisfies PortfolioSnapshotComputation
  }

  const requiredSymbols = normalized.allocations.map((allocation) => allocation.symbol)
  const marketUniverse = await ensureMarketUniverse(requiredSymbols, marketPrices)
  const hasStoredQuantities = normalized.allocations.every((allocation) => {
    const quantity = parseFiniteNumber(allocation.quantity)
    return quantity !== null && quantity > 0
  })

  const daysNeeded = hasStoredQuantities
    ? 1
    : Math.max(1, Math.ceil((marketFetchedAt - normalized.timestamp) / DAY_MS) + 1)
  const histories = hasStoredQuantities
    ? requiredSymbols.map((symbol) => ({ symbol, prices: [] as MarketChartPoint[] }))
    : await fetchPortfolioMarketHistory(
        normalized.allocations.map((allocation) => ({
          symbol: allocation.symbol,
          percentage: allocation.percentage,
        })),
        marketUniverse,
        daysNeeded
      )

  if (!hasStoredQuantities && !histories.length) return null

  const livePrices = buildLivePriceMap({
    requiredSymbols,
    marketUniverse,
    histories,
    krakenTickers,
  })
  if (!livePrices) return null

  const positions = new Map<string, PortfolioPosition>()

  for (const allocation of normalized.allocations) {
    const quantity = parseFiniteNumber(allocation.quantity)
    const assetInvestedAmount =
      parseFiniteNumber(allocation.invested_amount) ??
      (normalized.investedAmount !== null ? normalized.investedAmount * (allocation.percentage / 100) : 0)

    if (quantity !== null && quantity > 0) {
      addPosition(positions, allocation.symbol, quantity, assetInvestedAmount)
      continue
    }

    const history = histories.find((item) => item.symbol === allocation.symbol)
    const baselinePrice = history ? getPriceAtOrBefore(history.prices, normalized.timestamp) : null
    if (!baselinePrice) return null

    const legacyQuantity = (normalized.portfolioValue * (allocation.percentage / 100)) / baselinePrice
    addPosition(positions, allocation.symbol, legacyQuantity, assetInvestedAmount)
  }

  return buildSnapshotFromPositions({
    positions,
    livePrices: livePrices.livePrices,
    investedAmount,
    mode: livePrices.usedKraken ? "repriced_with_kraken" : "repriced_with_coingecko",
  })
}

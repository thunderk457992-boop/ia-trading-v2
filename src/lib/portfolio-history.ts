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

export interface PortfolioHistorySeed {
  created_at: string
  portfolio_value: number | string | null
  invested_amount: number | string | null
  allocations: PortfolioAllocation[] | null
}

function parseFiniteNumber(value: number | string | null | undefined) {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizePortfolioAllocations(value: unknown): PortfolioAllocation[] {
  if (!Array.isArray(value)) return []

  return value
    .filter((item): item is Record<string, unknown> => !!item && typeof item === "object")
    .map((item) => ({
      symbol: String(item.symbol ?? "").toUpperCase().trim(),
      percentage: Number(item.percentage ?? 0),
    }))
    .filter((item) => item.symbol && Number.isFinite(item.percentage) && item.percentage > 0)
}

export function normalizePortfolioHistorySeed(seed: PortfolioHistorySeed | null | undefined) {
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
  }
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

export async function computePortfolioSnapshotValue(params: {
  latestSnapshot: PortfolioHistorySeed | null | undefined
  investedAmount: number
  marketPrices: CryptoPrice[]
  marketFetchedAt: number
  krakenTickers?: KrakenTicker[]
}) {
  const { latestSnapshot, investedAmount, marketPrices, marketFetchedAt, krakenTickers = [] } = params

  if (!investedAmount || investedAmount <= 0) {
    return null
  }

  const normalized = normalizePortfolioHistorySeed(latestSnapshot)
  if (!normalized) {
    return {
      portfolioValue: Number(investedAmount.toFixed(2)),
      performancePercent: 0,
      mode: "initial_snapshot" as const,
    }
  }

  if (
    normalized.investedAmount !== null &&
    Math.abs(normalized.investedAmount - investedAmount) > Math.max(0.01, investedAmount * 0.01)
  ) {
    return {
      portfolioValue: Number(investedAmount.toFixed(2)),
      performancePercent: 0,
      mode: "capital_reset" as const,
    }
  }

  let marketUniverse = marketPrices
  const missingSymbols = normalized.allocations
    .map((allocation) => allocation.symbol)
    .filter((symbol) => !marketUniverse.some((coin) => coin.symbol === symbol))

  if (missingSymbols.length > 0) {
    const extendedMarkets = await fetchMarketsData(100)
    if (extendedMarkets.length > 0) {
      marketUniverse = mergeMarketUniverse(marketUniverse, extendedMarkets)
    }
  }

  const daysNeeded = Math.max(1, Math.ceil((marketFetchedAt - normalized.timestamp) / (24 * 60 * 60 * 1000)) + 1)
  const histories = await fetchPortfolioMarketHistory(normalized.allocations, marketUniverse, daysNeeded)
  if (!histories.length) return null

  const krakenPriceMap = new Map(krakenTickers.map((ticker) => [ticker.symbol, ticker.price]))
  let currentPortfolioValue = 0

  for (const allocation of normalized.allocations) {
    const history = histories.find((item) => item.symbol === allocation.symbol)
    const baselinePrice = history ? getPriceAtOrBefore(history.prices, normalized.timestamp) : null
    const krakenPrice = krakenPriceMap.get(allocation.symbol) ?? null
    const coinGeckoPrice =
      marketUniverse.find((coin) => coin.symbol === allocation.symbol)?.price ??
      history?.prices[history.prices.length - 1]?.price ??
      null
    const livePrice = krakenPrice ?? coinGeckoPrice

    if (!baselinePrice || !livePrice) return null

    const quantity = (normalized.portfolioValue * (allocation.percentage / 100)) / baselinePrice
    currentPortfolioValue += quantity * livePrice
  }

  const portfolioValue = Number(currentPortfolioValue.toFixed(2))
  const performancePercent = investedAmount > 0
    ? Number((((portfolioValue - investedAmount) / investedAmount) * 100).toFixed(4))
    : 0

  return {
    portfolioValue,
    performancePercent,
    mode: krakenTickers.length > 0 ? "repriced_with_kraken" as const : "repriced_with_coingecko" as const,
  }
}

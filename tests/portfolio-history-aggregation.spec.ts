import { expect, test } from "@playwright/test"
import { computePortfolioSnapshotFromResolvedContributions } from "../src/lib/portfolio-history"

test.describe("portfolio aggregation logic", () => {
  test("1 analyse of 1000 EUR keeps total invested capital at 1000 EUR", () => {
    const snapshot = computePortfolioSnapshotFromResolvedContributions({
      contributions: [
        {
          investedAmount: 1000,
          allocations: [
            { symbol: "BTC", percentage: 50, entryPrice: 50_000 },
            { symbol: "ETH", percentage: 50, entryPrice: 2_500 },
          ],
        },
      ],
      livePrices: new Map([
        ["BTC", 50_000],
        ["ETH", 2_500],
      ]),
    })

    expect(snapshot).not.toBeNull()
    expect(snapshot?.investedAmount).toBe(1000)
    expect(snapshot?.portfolioValue).toBe(1000)
    expect(snapshot?.performancePercent).toBe(0)
  })

  test("2 analyses of 1000 EUR each produce 2000 EUR invested capital", () => {
    const snapshot = computePortfolioSnapshotFromResolvedContributions({
      contributions: [
        {
          investedAmount: 1000,
          allocations: [
            { symbol: "BTC", percentage: 50, entryPrice: 50_000 },
            { symbol: "ETH", percentage: 50, entryPrice: 2_500 },
          ],
        },
        {
          investedAmount: 1000,
          allocations: [
            { symbol: "BTC", percentage: 50, entryPrice: 50_000 },
            { symbol: "ETH", percentage: 50, entryPrice: 2_500 },
          ],
        },
      ],
      livePrices: new Map([
        ["BTC", 50_000],
        ["ETH", 2_500],
      ]),
    })

    expect(snapshot).not.toBeNull()
    expect(snapshot?.investedAmount).toBe(2000)
    expect(snapshot?.portfolioValue).toBe(2000)
    expect(snapshot?.allocations).toHaveLength(2)
  })

  test("identical asset allocations are aggregated into one combined position", () => {
    const snapshot = computePortfolioSnapshotFromResolvedContributions({
      contributions: [
        {
          investedAmount: 1000,
          allocations: [{ symbol: "BTC", percentage: 100, entryPrice: 50_000 }],
        },
        {
          investedAmount: 1000,
          allocations: [{ symbol: "BTC", percentage: 100, entryPrice: 60_000 }],
        },
      ],
      livePrices: new Map([["BTC", 60_000]]),
    })

    expect(snapshot).not.toBeNull()
    expect(snapshot?.investedAmount).toBe(2000)
    expect(snapshot?.allocations).toHaveLength(1)
    expect(snapshot?.allocations[0].symbol).toBe("BTC")
    expect(Number(snapshot?.allocations[0].quantity ?? 0)).toBeCloseTo(0.03666667, 6)
  })

  test("different asset allocations are aggregated with correct weights and total value", () => {
    const snapshot = computePortfolioSnapshotFromResolvedContributions({
      contributions: [
        {
          investedAmount: 1000,
          allocations: [{ symbol: "BTC", percentage: 100, entryPrice: 50_000 }],
        },
        {
          investedAmount: 1000,
          allocations: [{ symbol: "ETH", percentage: 100, entryPrice: 2_000 }],
        },
      ],
      livePrices: new Map([
        ["BTC", 60_000],
        ["ETH", 2_500],
      ]),
    })

    expect(snapshot).not.toBeNull()
    expect(snapshot?.investedAmount).toBe(2000)
    expect(snapshot?.portfolioValue).toBe(2450)
    expect(snapshot?.performancePercent).toBe(22.5)

    const btc = snapshot?.allocations.find((allocation) => allocation.symbol === "BTC")
    const eth = snapshot?.allocations.find((allocation) => allocation.symbol === "ETH")

    expect(btc).toBeDefined()
    expect(eth).toBeDefined()
    expect(Number(btc?.current_value ?? 0)).toBeCloseTo(1200, 2)
    expect(Number(eth?.current_value ?? 0)).toBeCloseTo(1250, 2)
  })
})

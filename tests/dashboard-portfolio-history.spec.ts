import { test, expect, type Locator } from "@playwright/test"
import {
  authenticatePage,
  createAdminClient,
  createTempUser,
  cleanupTempUser,
  hasSupabaseAdminEnv,
  seedPortfolioSnapshots,
} from "./helpers/test-supabase"

function isoOffset(msOffset: number) {
  return new Date(Date.now() - msOffset).toISOString()
}

async function expectPercentCloseTo(locator: Locator, expected: number) {
  const sign = expected < 0 ? "-" : "+"
  const integerPart = Math.trunc(Math.abs(expected)).toString()
  await expect(locator).toContainText(`${sign}${integerPart}.`, { timeout: 5_000 })
  const text = await locator.textContent()
  const parsed = Number((text ?? "").replace("%", "").replace("+", "").trim())
  expect(parsed).toBeCloseTo(expected, 1)
}

const DAY_MS = 24 * 60 * 60 * 1000

test.describe("dashboard portfolio history timeframes", () => {
  test.skip(!hasSupabaseAdminEnv(), "Supabase admin env is required for seeded portfolio history tests.")

  test("one snapshot keeps the chart honest and avoids fake performance", async ({ page }) => {
    test.setTimeout(60_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "dashboard-one-snapshot")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        {
          createdAt: isoOffset(6 * 60 * 60 * 1000),
          portfolioValue: 1000,
          investedAmount: 1000,
          performancePercent: 0,
        },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")
      await expect(page.getByTestId("portfolio-performance-empty").first()).toContainText("deuxième snapshot")
      await expect(page.getByTestId("portfolio-performance-build-note")).toContainText("snapshots quotidiens")

      for (const timeframe of ["1H", "1D", "7D", "1M", "3M", "1Y", "ALL"]) {
        await expect(page.getByTestId(`portfolio-timeframe-${timeframe}`)).toBeDisabled()
      }
      await expect(page.getByTestId("portfolio-performance-percent")).toHaveCount(0)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("two snapshots show a simple 1D/ALL segment while longer periods stay disabled", async ({ page }) => {
    test.setTimeout(60_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "dashboard-two-snapshots")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        {
          createdAt: isoOffset(2 * 60 * 60 * 1000),
          portfolioValue: 1000,
          investedAmount: 1000,
          performancePercent: 0,
        },
        {
          createdAt: isoOffset(15 * 60 * 1000),
          portfolioValue: 1035,
          investedAmount: 1000,
          performancePercent: 3.5,
        },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")

      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-3M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1Y")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-ALL")).toBeEnabled()

      await page.getByTestId("portfolio-timeframe-1D").click()
      await expectPercentCloseTo(page.getByTestId("portfolio-performance-percent"), 3.5)
      await expect(page.getByTestId("portfolio-performance-euro")).toHaveText("+35€")
      await expect(page.getByTestId("portfolio-performance-short-history")).toContainText("Historique encore trop court")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("3+ snapshots produce timeframe-specific values without enabling 1M too early", async ({ page }) => {
    test.setTimeout(60_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "dashboard-history")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        {
          createdAt: isoOffset(8 * DAY_MS),
          portfolioValue: 1000,
          investedAmount: 1000,
          performancePercent: 0,
        },
        {
          createdAt: isoOffset(3 * DAY_MS),
          portfolioValue: 1100,
          investedAmount: 1000,
          performancePercent: 10,
        },
        {
          createdAt: isoOffset(12 * 60 * 60 * 1000),
          portfolioValue: 1080,
          investedAmount: 1000,
          performancePercent: 8,
        },
        {
          createdAt: isoOffset(30 * 60 * 1000),
          portfolioValue: 1050,
          investedAmount: 1000,
          performancePercent: 5,
        },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")

      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-3M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1Y")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-ALL")).toBeEnabled()

      const percent = page.getByTestId("portfolio-performance-percent")
      const euro = page.getByTestId("portfolio-performance-euro")

      await page.getByTestId("portfolio-timeframe-1D").click()
      await expectPercentCloseTo(percent, -2.78)
      await expect(euro).toHaveText("-30€")

      await page.getByTestId("portfolio-timeframe-7D").click()
      await expectPercentCloseTo(percent, -4.55)
      await expect(euro).toHaveText("-50€")

      await page.getByTestId("portfolio-timeframe-ALL").click()
      await expectPercentCloseTo(percent, 5)
      await expect(euro).toHaveText("+50€")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

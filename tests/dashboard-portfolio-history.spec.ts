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
  const text = await locator.textContent()
  const parsed = Number((text ?? "").replace("%", "").replace("+", "").trim())
  expect(parsed).toBeCloseTo(expected, 1)
}

test.describe("dashboard portfolio history timeframes", () => {
  test.skip(!hasSupabaseAdminEnv(), "Supabase admin env is required for seeded portfolio history tests.")

  test("two snapshots show a simple ALL variation and keep unsupported periods disabled", async ({ page }) => {
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

      // 1H: only 1 snapshot in the last hour (15min) → disabled
      // 1D, 7D, 1M, ALL: both snapshots (2h + 15min) fall inside each window → enabled
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-ALL")).toBeEnabled()

      await page.getByTestId("portfolio-timeframe-ALL").click()
      await expectPercentCloseTo(page.getByTestId("portfolio-performance-percent"), 3.5)
      await expect(page.getByTestId("portfolio-performance-euro")).toHaveText("+35€")
      await expect(page.getByTestId("portfolio-performance-short-history")).toContainText("Historique encore trop court")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("seeded snapshots drive timeframe-specific portfolio values", async ({ page }) => {
    test.setTimeout(60_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "dashboard-history")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        {
          createdAt: isoOffset(8 * 24 * 60 * 60 * 1000),
          portfolioValue: 1000,
          investedAmount: 1000,
          performancePercent: 0,
        },
        {
          createdAt: isoOffset(2 * 24 * 60 * 60 * 1000),
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

      const card = page.getByTestId("portfolio-performance-card")
      await expect(card).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")

      const oneHour = page.getByTestId("portfolio-timeframe-1H")
      const oneDay = page.getByTestId("portfolio-timeframe-1D")
      const sevenDays = page.getByTestId("portfolio-timeframe-7D")
      const oneMonth = page.getByTestId("portfolio-timeframe-1M")
      const all = page.getByTestId("portfolio-timeframe-ALL")

      // 1H: only 1 snapshot in last hour (30min) → disabled
      // 1M: all 4 snapshots fall within the 30-day window → enabled
      await expect(oneHour).toBeDisabled()
      await expect(oneMonth).toBeEnabled()
      await expect(oneDay).toBeEnabled()
      await expect(sevenDays).toBeEnabled()
      await expect(all).toBeEnabled()

      const percent = page.getByTestId("portfolio-performance-percent")
      const euro = page.getByTestId("portfolio-performance-euro")

      await oneDay.click()
      await expectPercentCloseTo(percent, -2.78)
      await expect(euro).toHaveText("-30€")

      await sevenDays.click()
      await expectPercentCloseTo(percent, -4.55)
      await expect(euro).toHaveText("-50€")

      await all.click()
      await expectPercentCloseTo(percent, 5)
      await expect(euro).toHaveText("+50€")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

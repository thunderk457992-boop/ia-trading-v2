import { test, expect } from "@playwright/test"
import {
  createAdminClient,
  createTempUser,
  cleanupTempUser,
  hasSupabaseAdminEnv,
  loginAsUser,
  seedPortfolioSnapshots,
} from "./helpers/test-supabase"

function isoOffset(msOffset: number) {
  return new Date(Date.now() - msOffset).toISOString()
}

test.describe("dashboard portfolio history timeframes", () => {
  test.skip(!hasSupabaseAdminEnv(), "Supabase admin env is required for seeded portfolio history tests.")

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

      await loginAsUser(page, user)
      await page.goto("http://localhost:3000/dashboard")

      const card = page.getByTestId("portfolio-performance-card")
      await expect(card).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")

      const oneHour = page.getByTestId("portfolio-timeframe-1H")
      const oneDay = page.getByTestId("portfolio-timeframe-1D")
      const sevenDays = page.getByTestId("portfolio-timeframe-7D")
      const oneMonth = page.getByTestId("portfolio-timeframe-1M")
      const all = page.getByTestId("portfolio-timeframe-ALL")

      await expect(oneHour).toBeDisabled()
      await expect(oneMonth).toBeDisabled()
      await expect(oneDay).toBeEnabled()
      await expect(sevenDays).toBeEnabled()
      await expect(all).toBeEnabled()

      await oneDay.click()
      const oneDayPercent = (await page.getByTestId("portfolio-performance-percent").textContent())?.trim()
      const oneDayEuro = (await page.getByTestId("portfolio-performance-euro").textContent())?.trim()

      await sevenDays.click()
      const sevenDaysPercent = (await page.getByTestId("portfolio-performance-percent").textContent())?.trim()
      const sevenDaysEuro = (await page.getByTestId("portfolio-performance-euro").textContent())?.trim()

      await all.click()
      const allPercent = (await page.getByTestId("portfolio-performance-percent").textContent())?.trim()
      const allEuro = (await page.getByTestId("portfolio-performance-euro").textContent())?.trim()

      expect(oneDayPercent).toBeTruthy()
      expect(sevenDaysPercent).toBeTruthy()
      expect(allPercent).toBeTruthy()

      expect(oneDayPercent).not.toBe(sevenDaysPercent)
      expect(sevenDaysPercent).not.toBe(allPercent)
      expect(oneDayEuro).not.toBe(sevenDaysEuro)
      expect(sevenDaysEuro).not.toBe(allEuro)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

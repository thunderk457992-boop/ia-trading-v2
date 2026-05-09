import { test, expect } from "@playwright/test"
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

const MIN_MS = 60 * 1000
const HOUR_MS = 60 * MIN_MS
const DAY_MS = 24 * HOUR_MS
const INTRAHOUR_MESSAGE = "Disponible quand plusieurs snapshots sont créés dans la même heure."

test.describe("timeframe availability logic", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("1H enabled with 2 snapshots inside the last hour", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-1h-active")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(45 * MIN_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(15 * MIN_MS), portfolioValue: 1020, investedAmount: 1000, performancePercent: 2 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("1D uses recent 48h data when 2 snapshots exist in 48h but not 24h", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-1d-recent")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(31 * HOUR_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(6 * HOUR_MS), portfolioValue: 1050, investedAmount: 1000, performancePercent: 5 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toContainText("Récent")
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1H")).toHaveAttribute("title", INTRAHOUR_MESSAGE)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("3 days of history enable 7D and ALL, while 1M/3M/1Y stay disabled", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-3d-history")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(3 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(60 * HOUR_MS), portfolioValue: 1015, investedAmount: 1000, performancePercent: 1.5 },
        { createdAt: isoOffset(6 * HOUR_MS), portfolioValue: 1040, investedAmount: 1000, performancePercent: 4 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toHaveAttribute("title", /48h/)
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-3M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1Y")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-ALL")).toBeEnabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("25 days of history enable 1M", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-25d-history")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(25 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(2 * DAY_MS), portfolioValue: 1080, investedAmount: 1000, performancePercent: 8 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-3M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1Y")).toBeDisabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("70 days of history enable 3M", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-70d-history")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(70 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(5 * DAY_MS), portfolioValue: 1120, investedAmount: 1000, performancePercent: 12 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-timeframe-3M")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1Y")).toBeDisabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("200 days of history enable 1Y", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-200d-history")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(200 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(2 * DAY_MS), portfolioValue: 1250, investedAmount: 1000, performancePercent: 25 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-timeframe-1Y")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-ALL")).toBeEnabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

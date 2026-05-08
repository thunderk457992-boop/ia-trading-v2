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

const MIN_MS  = 60 * 1000
const HOUR_MS = 60 * MIN_MS
const DAY_MS  = 24 * HOUR_MS

test.describe("timeframe availability logic", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  // ── 1H active when 2 snapshots exist within the last hour ────────────────
  test("1H enabled with 2 snapshots 30min apart within last hour", async ({ page }) => {
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

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  // ── 1D active even when history span is < 24h (the original bug) ─────────
  test("1D enabled with 2 snapshots spanning 12h (span < 24h, old bug)", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-1d-active-short-span")

    try {
      // Both snapshots are within the last 24h, but their span is only 12h.
      // The old code incorrectly returned [] because 12h < 24h window.
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(18 * HOUR_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(6 * HOUR_MS),  portfolioValue: 1050, investedAmount: 1000, performancePercent: 5 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      // 1D must be enabled: both snapshots are within the last 24h
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
      // 1H must be disabled: only 1 snapshot is within the last hour
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  // ── 7D active, 1D disabled when all snapshots are > 24h old ─────────────
  test("7D active but 1D disabled when snapshots are only 3–7 days old", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-7d-active-1d-disabled")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(7 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(5 * DAY_MS), portfolioValue: 1030, investedAmount: 1000, performancePercent: 3 },
        { createdAt: isoOffset(3 * DAY_MS), portfolioValue: 1060, investedAmount: 1000, performancePercent: 6 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()

      // 7D has 2+ snapshots in its window → enabled
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeEnabled()

      // 1D has 0–1 snapshots in its 24h window → disabled
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeDisabled()

      // 1H disabled
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()

      // Disabled buttons carry the correct reason text in their title attribute
      const btn1D = page.getByTestId("portfolio-timeframe-1D")
      const title1D = await btn1D.getAttribute("title")
      expect(title1D).toMatch(/24h/)

      const btn1H = page.getByTestId("portfolio-timeframe-1H")
      const title1H = await btn1H.getAttribute("title")
      expect(title1H).toMatch(/intrajournaliers/)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  // ── Daily cron context: 1H message mentions intraday snapshots ───────────
  test("1H disabled message is about intraday snapshots (daily cron context)", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-1h-message")

    try {
      // Simulate daily cron: 1 snapshot per day, 3 days
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(3 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(2 * DAY_MS), portfolioValue: 1020, investedAmount: 1000, performancePercent: 2 },
        { createdAt: isoOffset(1 * DAY_MS), portfolioValue: 1040, investedAmount: 1000, performancePercent: 4 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()

      const btn = page.getByTestId("portfolio-timeframe-1H")
      const title = await btn.getAttribute("title")
      expect(title).toContain("intrajournaliers")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

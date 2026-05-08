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

  // ── 7D active when 2+ snapshots exist within the 7-day window ───────────────
  test("7D enabled when 2+ snapshots exist in 7D window", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-7d-active")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(7 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(5 * DAY_MS), portfolioValue: 1030, investedAmount: 1000, performancePercent: 3 },
        { createdAt: isoOffset(3 * DAY_MS), portfolioValue: 1060, investedAmount: 1000, performancePercent: 6 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()

      // anchor = 3d ago; 7D window = [10d ago, 3d ago] → all 3 snapshots included → 7D enabled
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeEnabled()

      // 1D has only the anchor snapshot (3d ago) in its 24h window → disabled
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()

      // Disabled buttons carry the correct reason text in their title attribute
      const title1D = await page.getByTestId("portfolio-timeframe-1D").getAttribute("title")
      expect(title1D).toMatch(/24h/)

      const title1H = await page.getByTestId("portfolio-timeframe-1H").getAttribute("title")
      expect(title1H).toMatch(/intrajournaliers/)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  // ── 7D disabled when fewer than 2 snapshots exist in 7D window ───────────
  test("7D disabled when only 1 snapshot exists in 7D window", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-7d-disabled")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(15 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(1 * DAY_MS),  portfolioValue: 1050, investedAmount: 1000, performancePercent: 5 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()

      // anchor = 1d ago; 7D window = [8d ago, 1d ago] → only 1d ago in window → 7D disabled
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeDisabled()

      // 1M window = [31d ago, 1d ago] → both snapshots included → 1M enabled
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeEnabled()

      const title7D = await page.getByTestId("portfolio-timeframe-7D").getAttribute("title")
      expect(title7D).toContain("Pas encore assez de snapshots pour cette période")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  // ── 1M active when 2+ snapshots exist within the 30-day window ───────────
  test("1M enabled with 2 snapshots in last 30 days", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "tf-1m-active")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(25 * DAY_MS), portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(5 * DAY_MS),  portfolioValue: 1100, investedAmount: 1000, performancePercent: 10 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()

      // anchor = 5d ago; 1M window = [35d ago, 5d ago] → both in window → 1M enabled
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeEnabled()
      // 7D window = [12d ago, 5d ago] → only 5d ago in window → disabled
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeDisabled()
      // 1D: only 5d ago in window → disabled
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeDisabled()
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

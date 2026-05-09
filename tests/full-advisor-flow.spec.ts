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

const DAY_MS = 24 * 60 * 60 * 1000

const advisorPayload = {
  riskTolerance: "moderate",
  horizon: "medium",
  capital: "1000",
  monthlyIncome: "3500",
  monthlyContribution: "200",
  lossTolerance: "medium",
  preciseObjective: "Construire un portefeuille long terme progressif.",
  investmentFrequency: "monthly",
  goals: ["croissance", "diversification"],
  excludedCryptos: "",
  experience: "intermediate",
  buyStrategy: "dca-monthly",
}

// ── Test 1: Session injection → dashboard reachable ──────────────────────────
test.describe("authenticated session reaches dashboard", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("injected session navigates to dashboard without redirect to login", async ({ page }) => {
    test.setTimeout(30_000)
    const admin = createAdminClient()
    const user = await createTempUser(admin, "session-inject")

    try {
      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")
      await expect(page).toHaveURL(/dashboard/, { timeout: 15_000 })
      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

// ── Test 2: Advisor → portfolio_history → dashboard chart ─────────────────────
test.describe("advisor generates portfolio_history and dashboard reflects it", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("POST /api/advisor creates snapshot visible on dashboard", async ({ page }) => {
    test.slow()
    test.setTimeout(180_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "advisor-dashboard")

    try {
      await authenticatePage(page, user)

      const res = await page.context().request.post("http://localhost:3000/api/advisor", {
        data: advisorPayload,
      })
      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.saved).toBe(true)
      const analysisId = String(body.id)

      const { data: rows, error } = await admin
        .from("portfolio_history")
        .select("portfolio_value, invested_amount, performance_percent, allocations")
        .eq("analysis_id", analysisId)
        .eq("user_id", user.id)

      expect(error).toBeNull()
      expect(rows).toHaveLength(1)
      expect(Number(rows![0].portfolio_value)).toBeGreaterThan(0)
      expect(Number(rows![0].invested_amount)).toBe(1000)
      expect(Array.isArray(rows![0].allocations)).toBe(true)

      await page.goto("http://localhost:3000/dashboard")
      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

// ── Test 3: Seeded snapshots → timeframe switching ────────────────────────────
test.describe("dashboard timeframe graph with seeded history", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("1D / 7D / ALL show different values, while 1M stays disabled with only 8 days of history", async ({ page }) => {
    test.setTimeout(60_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "timeframe-graph")

    try {
      await seedPortfolioSnapshots(admin, user.id, [
        { createdAt: isoOffset(8 * DAY_MS),         portfolioValue: 1000, investedAmount: 1000, performancePercent: 0 },
        { createdAt: isoOffset(3 * DAY_MS),         portfolioValue: 1100, investedAmount: 1000, performancePercent: 10 },
        { createdAt: isoOffset(12 * 60 * 60_000),  portfolioValue: 1080, investedAmount: 1000, performancePercent: 8 },
        { createdAt: isoOffset(30 * 60_000),        portfolioValue: 1050, investedAmount: 1000, performancePercent: 5 },
      ])

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()
      await expect(page.getByTestId("portfolio-performance-source")).toContainText("portfolio_history uniquement")

      // 1H: only 1 snapshot in the last hour (30min) -> disabled
      // 1M: history span is still too short -> disabled
      await expect(page.getByTestId("portfolio-timeframe-1H")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1M")).toBeDisabled()
      await expect(page.getByTestId("portfolio-timeframe-1D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-7D")).toBeEnabled()
      await expect(page.getByTestId("portfolio-timeframe-ALL")).toBeEnabled()

      await page.getByTestId("portfolio-timeframe-1D").click()
      await page.waitForTimeout(300)
      const pct1D = await page.getByTestId("portfolio-performance-percent").textContent()
      const eur1D = await page.getByTestId("portfolio-performance-euro").textContent()

      await page.getByTestId("portfolio-timeframe-7D").click()
      await page.waitForTimeout(300)
      const pct7D = await page.getByTestId("portfolio-performance-percent").textContent()
      const eur7D = await page.getByTestId("portfolio-performance-euro").textContent()

      await page.getByTestId("portfolio-timeframe-ALL").click()
      await page.waitForTimeout(300)
      const pctALL = await page.getByTestId("portfolio-performance-percent").textContent()
      const eurALL = await page.getByTestId("portfolio-performance-euro").textContent()

      expect(pct1D).toBeTruthy()
      expect(pct7D).toBeTruthy()
      expect(pctALL).toBeTruthy()

      expect(pct1D).not.toBe(pct7D)
      expect(pct7D).not.toBe(pctALL)
      expect(eur1D).not.toBe(eur7D)
      expect(eur7D).not.toBe(eurALL)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

// ── Test 4: Empty dashboard state for new user ────────────────────────────────
test.describe("dashboard empty state for new user", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("new user sees onboarding steps, not a broken chart", async ({ page }) => {
    test.setTimeout(30_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "empty-dashboard")

    try {
      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")

      await expect(page.getByTestId("portfolio-performance-card")).toBeVisible()

      // Two elements share this testid (stats header + chart area) — first() is intentional
      const emptyMsg = page.getByTestId("portfolio-performance-empty").first()
      await expect(emptyMsg).toBeVisible()
      await expect(emptyMsg).toContainText(/analyse|performance|portefeuille/i)

      await expect(page.getByTestId("portfolio-performance-source")).toContainText("aucune donnée portefeuille")

      for (const tf of ["1H", "1D", "7D", "1M", "3M", "1Y", "ALL"]) {
        await expect(page.getByTestId(`portfolio-timeframe-${tf}`)).toBeDisabled()
      }
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

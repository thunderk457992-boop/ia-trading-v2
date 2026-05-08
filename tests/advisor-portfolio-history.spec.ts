import { test, expect } from "@playwright/test"
import {
  authenticatePage,
  createAdminClient,
  createTempUser,
  cleanupTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

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

test.describe("advisor -> portfolio_history pipeline", () => {
  test.skip(!hasSupabaseAdminEnv(), "Supabase admin env is required for advisor pipeline assertions.")

  test("successful advisor generation creates ai_analyses and portfolio_history rows", async ({ page }) => {
    test.slow()
    test.setTimeout(180_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "advisor-history")

    try {
      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/dashboard")
      await expect(page).toHaveURL(/dashboard/)

      const response = await page.context().request.post("http://localhost:3000/api/advisor", {
        data: advisorPayload,
      })

      expect(response.status()).toBe(200)
      const body = await response.json()
      expect(body.saved).toBe(true)
      expect(typeof body.id).toBe("string")

      const analysisId = String(body.id)

      const [{ data: analysisRows, error: analysisError }, { data: snapshotRows, error: snapshotError }] = await Promise.all([
        admin
          .from("ai_analyses")
          .select("id, user_id, created_at")
          .eq("id", analysisId)
          .eq("user_id", user.id),
        admin
          .from("portfolio_history")
          .select("analysis_id, user_id, portfolio_value, invested_amount, performance_percent")
          .eq("analysis_id", analysisId)
          .eq("user_id", user.id),
      ])

      expect(analysisError).toBeNull()
      expect(snapshotError).toBeNull()
      expect(analysisRows).toHaveLength(1)
      expect(snapshotRows).toHaveLength(1)
      expect(Number(snapshotRows?.[0]?.portfolio_value ?? 0)).toBeGreaterThan(0)
      expect(Number(snapshotRows?.[0]?.invested_amount ?? 0)).toBe(1000)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

import { expect, test } from "@playwright/test"
import {
  authenticatePage,
  cleanupTempUser,
  createAdminClient,
  createTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

test.describe("post-login activation routing", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("a new user without analysis lands on the advisor", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "post-login-advisor")

    try {
      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/auth/post-login")
      await expect(page).toHaveURL(/\/advisor$/)
      await expect(page.getByRole("heading", { name: /conseiller ia/i })).toBeVisible()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("a user with an existing analysis lands on the dashboard", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "post-login-dashboard", "pro")

    try {
      const { error: seedError } = await admin.from("ai_analyses").insert({
        user_id: user.id,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        investor_profile: {
          capital: "1000",
          riskTolerance: "moderate",
          horizon: "medium",
        },
        allocations: [
          { symbol: "BTC", percentage: 55 },
          { symbol: "ETH", percentage: 30 },
          { symbol: "SOL", percentage: 15 },
        ],
        total_score: 78,
        market_context: "Analyse seedee pour le tunnel d'activation",
        recommendations: ["Conserver l'allocation"],
        warnings: [],
        model_used: "test-seed",
      })

      expect(seedError).toBeNull()

      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/auth/post-login")
      await expect(page).toHaveURL(/\/dashboard$/)
      await expect(page.getByRole("heading", { name: /dashboard/i })).toBeVisible()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

import { test, expect } from "@playwright/test"
import {
  authenticatePage,
  cleanupTempUser,
  createAdminClient,
  createTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

test.describe("portfolio-debug security", () => {
  test("POST /api/dashboard/portfolio-debug stays hidden without auth", async ({ request }) => {
    const response = await request.post("http://localhost:3000/api/dashboard/portfolio-debug", {
      headers: { "Content-Type": "application/json" },
      data: { timeframe: "1W", source: "test", pointCount: 0 },
    })
    expect(response.status()).toBe(404)
  })

  test(
    "POST /api/dashboard/portfolio-debug stays hidden for authenticated users when debug mode is disabled",
    async ({ page }) => {
      test.skip(!hasSupabaseAdminEnv(), "Supabase admin env is required for authenticated security checks.")

      const admin = createAdminClient()
      const user = await createTempUser(admin, "debug-hidden")

      try {
        await authenticatePage(page, user)

        const response = await page.context().request.post(
          "http://localhost:3000/api/dashboard/portfolio-debug",
          {
            headers: { "Content-Type": "application/json" },
            data: { timeframe: "1D", source: "portfolio_history", pointCount: 2 },
          }
        )

        expect(response.status()).toBe(404)
      } finally {
        await cleanupTempUser(admin, user.id)
      }
    }
  )
})

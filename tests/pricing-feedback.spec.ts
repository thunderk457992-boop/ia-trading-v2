import { expect, test } from "@playwright/test"
import {
  authenticatePage,
  cleanupTempUser,
  createAdminClient,
  createTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

test.describe("pricing feedback", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("pricing page shows a clear cancelled banner", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "pricing-cancelled")

    try {
      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/pricing?cancelled=true")
      await expect(page.getByTestId("pricing-cancelled-banner")).toContainText(/aucun montant/i)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

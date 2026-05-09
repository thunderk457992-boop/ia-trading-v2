import { expect, test } from "@playwright/test"
import {
  authenticatePage,
  cleanupTempUser,
  createAdminClient,
  createTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

test.describe("advisor step 7 validation", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("step 7 requires one choice in each section before continuing", async ({ page }) => {
    test.setTimeout(60_000)

    const admin = createAdminClient()
    const user = await createTempUser(admin, "advisor-step-7")

    try {
      await authenticatePage(page, user)
      await page.goto("http://localhost:3000/advisor?advisorStep=strategy")
      const advisorMain = page.locator("main")
      const continueButton = advisorMain.getByRole("button", { name: /^Continuer$/i })

      await expect(advisorMain.getByText(/Question 7\/8/i)).toBeVisible()

      await expect(advisorMain.getByText(/Choisissez une option dans chaque section pour continuer/i)).toBeVisible()
      await expect(continueButton).toBeDisabled()

      await advisorMain.getByRole("button", { name: /Chaque mois/i }).click()
      await expect(continueButton).toBeDisabled()

      await advisorMain.getByRole("button", { name: /DCA mensuel/i }).click()
      await expect(continueButton).toBeEnabled()
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

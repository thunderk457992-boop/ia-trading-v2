import { expect, test } from "@playwright/test"
import {
  authenticatePage,
  cleanupTempUser,
  createAdminClient,
  createTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

test.describe("account deletion route", () => {
  test("rejects unauthenticated users", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/account/delete", {
      data: { confirmation: "DELETE" },
    })

    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error).toMatch(/authentifi/i)
  })

  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("rejects authenticated deletion without DELETE confirmation", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "delete-account-confirmation")

    try {
      await authenticatePage(page, user)

      const res = await page.context().request.post("http://localhost:3000/api/account/delete", {
        data: { confirmation: "NOPE" },
      })

      expect(res.status()).toBe(400)
      const body = await res.json()
      expect(body.error).toMatch(/DELETE/i)
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })

  test("deletes the auth user and frees the email for reuse", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "delete-account")
    let deleted = false
    let recreatedUserId: string | null = null

    try {
      await authenticatePage(page, user)

      const res = await page.context().request.post("http://localhost:3000/api/account/delete", {
        data: { confirmation: "DELETE" },
      })

      expect(res.status()).toBe(200)
      const body = await res.json()
      expect(body.deleted).toBe(true)
      deleted = true

      const { data: recreatedUser, error: recreateError } = await admin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: "Playwright User" },
      })

      expect(recreateError).toBeNull()
      expect(recreatedUser.user?.email).toBe(user.email)
      recreatedUserId = recreatedUser.user?.id ?? null

      const { data: deletedProfile } = await admin
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle()

      expect(deletedProfile).toBeNull()
    } finally {
      if (!deleted) {
        await cleanupTempUser(admin, user.id)
      }

      if (recreatedUserId) {
        await admin.from("profiles").delete().eq("id", recreatedUserId)
        await admin.auth.admin.deleteUser(recreatedUserId)
      }
    }
  })
})

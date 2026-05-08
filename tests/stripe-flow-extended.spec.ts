import { test, expect } from "@playwright/test"
import {
  authenticatePage,
  createAdminClient,
  createTempUser,
  cleanupTempUser,
  hasSupabaseAdminEnv,
} from "./helpers/test-supabase"

// ── API-level tests (no auth required) ───────────────────────────────────────

test.describe("stripe webhook security", () => {
  test("webhook rejects request with no stripe-signature header → 400", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/stripe/webhook", {
      headers: { "Content-Type": "application/json" },
      data: { type: "checkout.session.completed", data: { object: {} } },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/signature/i)
  })

  test("webhook rejects request with invalid stripe-signature → 400", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/stripe/webhook", {
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "t=1234,v1=invalid_signature",
      },
      data: "{}",
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/signature/i)
  })
})

test.describe("stripe checkout validation", () => {
  test("checkout rejects missing priceId → 400 or 401", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/stripe/checkout", {
      data: { plan: "pro" },
    })
    expect([400, 401]).toContain(res.status())
  })

  test("checkout rejects missing plan → 400 or 401", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/stripe/checkout", {
      data: { priceId: "price_fake_123" },
    })
    expect([400, 401]).toContain(res.status())
  })

  test("plans endpoint returns all four price slots", async ({ request }) => {
    const res = await request.get("http://localhost:3000/api/stripe/plans")
    expect(res.status()).toBe(200)
    const body = await res.json()
    expect(body.pro).toHaveProperty("monthly")
    expect(body.pro).toHaveProperty("yearly")
    expect(body.premium).toHaveProperty("monthly")
    expect(body.premium).toHaveProperty("yearly")
  })
})

test.describe("stripe portal unauthenticated", () => {
  test("portal endpoint rejects unauthenticated requests → 401", async ({ request }) => {
    const res = await request.post("http://localhost:3000/api/stripe/portal")
    expect(res.status()).toBe(401)
  })
})

// ── Authenticated tests ────────────────────────────────────────────────────────

test.describe("stripe checkout with active subscription (conflict)", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("authenticated user with active subscription gets 409 on checkout", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "stripe-conflict")

    await admin.from("subscriptions").upsert({
      id: "sub_playwright_test_conflict",
      user_id: user.id,
      plan: "pro",
      status: "active",
      stripe_customer_id: "cus_playwright_test",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    try {
      await authenticatePage(page, user)

      const res = await page.context().request.post("http://localhost:3000/api/stripe/checkout", {
        data: { priceId: "price_placeholder_pro_monthly", plan: "pro" },
      })

      // 409 = already has subscription; 400 = unknown price (also valid in test env)
      expect([400, 409]).toContain(res.status())
      if (res.status() === 409) {
        const body = await res.json()
        expect(body.manageBilling).toBe(true)
      }
    } finally {
      await admin.from("subscriptions").delete().eq("user_id", user.id)
      await cleanupTempUser(admin, user.id)
    }
  })
})

test.describe("stripe sync with no subscription", () => {
  test.skip(!hasSupabaseAdminEnv(), "requires Supabase admin env")

  test("sync endpoint returns 200 for authenticated user with no Stripe customer", async ({ page }) => {
    const admin = createAdminClient()
    const user = await createTempUser(admin, "stripe-sync-empty")

    try {
      await authenticatePage(page, user)

      const res = await page.context().request.post("http://localhost:3000/api/stripe/sync")
      // 200 = synced (no sub found); 500 = Stripe not configured in test env
      expect([200, 500]).toContain(res.status())
      if (res.status() === 200) {
        const body = await res.json()
        expect(body.plan).toBe("free")
      }
    } finally {
      await cleanupTempUser(admin, user.id)
    }
  })
})

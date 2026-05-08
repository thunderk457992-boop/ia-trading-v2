import fs from "node:fs"
import path from "node:path"
import { test, expect } from "@playwright/test"

test.describe("portfolio snapshot cron configuration", () => {
  test("vercel.json keeps the daily Hobby-compatible cron schedule", async () => {
    const vercelConfigPath = path.join(process.cwd(), "vercel.json")
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf8")) as {
      crons?: Array<{ path: string; schedule: string }>
    }

    expect(vercelConfig.crons).toEqual([
      {
        path: "/api/cron/portfolio-snapshot",
        schedule: "0 0 * * *",
      },
    ])
  })

  test("portfolio snapshot cron route is not publicly callable without CRON_SECRET", async ({ request }) => {
    const response = await request.get("http://localhost:3000/api/cron/portfolio-snapshot")
    expect(response.status()).toBe(401)
  })
})

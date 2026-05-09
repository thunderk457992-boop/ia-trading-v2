import fs from "node:fs"
import path from "node:path"
import { expect, type Page } from "@playwright/test"
import { createClient, type Session, type SupabaseClient } from "@supabase/supabase-js"

type TestUser = {
  id: string
  email: string
  password: string
}

type PortfolioSnapshotSeed = {
  analysisId?: string | null
  createdAt: string
  portfolioValue: number
  investedAmount: number
  performancePercent: number
  allocations?: Array<{ symbol: string; percentage: number }>
}

const ENV_FILE_NAMES = [".env.local", ".env"]
const envCache = new Map<string, string>()
let envLoaded = false

function loadEnvFiles() {
  if (envLoaded) return
  envLoaded = true

  for (const fileName of ENV_FILE_NAMES) {
    const filePath = path.join(process.cwd(), fileName)
    if (!fs.existsSync(filePath)) continue

    const content = fs.readFileSync(filePath, "utf8")
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) continue

      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex <= 0) continue

      const key = trimmed.slice(0, separatorIndex).trim()
      let value = trimmed.slice(separatorIndex + 1).trim()

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }

      if (key && value && !envCache.has(key)) {
        envCache.set(key, value)
      }
    }
  }
}

function getEnv(name: string) {
  if (process.env[name]) return process.env[name]
  loadEnvFiles()
  return envCache.get(name)
}

function requireEnv(name: string) {
  const value = getEnv(name)
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

export function hasSupabaseAdminEnv() {
  return Boolean(
    getEnv("NEXT_PUBLIC_SUPABASE_URL")
    && getEnv("SUPABASE_SERVICE_ROLE_KEY")
  )
}

export function hasSupabasePublicEnv() {
  return Boolean(
    getEnv("NEXT_PUBLIC_SUPABASE_URL")
    && getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
  )
}

export function hasStripeServerEnv() {
  return Boolean(getEnv("STRIPE_SECRET_KEY"))
}

function getSupabaseUrl() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL")
}

function getSupabaseStorageKey() {
  return `sb-${new URL(getSupabaseUrl()).hostname.split(".")[0]}-auth-token`
}

function createCookieChunks(key: string, value: string, chunkSize = 3180) {
  let encodedValue = encodeURIComponent(value)
  if (encodedValue.length <= chunkSize) {
    return [{ name: key, value }]
  }

  const chunks: string[] = []

  while (encodedValue.length > 0) {
    let encodedChunkHead = encodedValue.slice(0, chunkSize)
    const lastEscapePos = encodedChunkHead.lastIndexOf("%")

    if (lastEscapePos > chunkSize - 3) {
      encodedChunkHead = encodedChunkHead.slice(0, lastEscapePos)
    }

    chunks.push(decodeURIComponent(encodedChunkHead))
    encodedValue = encodedValue.slice(encodedChunkHead.length)
  }

  return chunks.map((chunk, index) => ({ name: `${key}.${index}`, value: chunk }))
}

function requirePublicSupabaseKey() {
  return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export function createPublicClient() {
  return createClient(getSupabaseUrl(), requirePublicSupabaseKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export function createAdminClient() {
  return createClient(
    getSupabaseUrl(),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

export async function createTempUser(admin: SupabaseClient, label: string, plan = "free"): Promise<TestUser> {
  const nonce = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const email = `playwright+${label}-${nonce}@example.com`
  const password = `Axiom!${Math.random().toString(36).slice(2, 10)}9`

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: "Playwright User" },
  })

  if (error || !data.user) {
    throw error ?? new Error("Failed to create temp user")
  }

  const { error: profileError } = await admin
    .from("profiles")
    .upsert(
      {
        id: data.user.id,
        full_name: "Playwright User",
        plan,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )

  if (profileError) {
    await admin.auth.admin.deleteUser(data.user.id)
    throw profileError
  }

  return {
    id: data.user.id,
    email,
    password,
  }
}

export async function cleanupTempUser(admin: SupabaseClient, userId: string) {
  await admin.from("portfolio_history").delete().eq("user_id", userId)
  await admin.from("ai_analyses").delete().eq("user_id", userId)
  await admin.from("subscriptions").delete().eq("user_id", userId)
  await admin.from("profiles").delete().eq("id", userId)
  await admin.auth.admin.deleteUser(userId)
}

export async function loginAsUser(page: Page, user: TestUser) {
  await page.goto("http://localhost:3000/login")
  await page.getByRole("textbox").first().fill(user.email)
  await page.locator('input[type="password"]').fill(user.password)
  await page.getByRole("button", { name: /se connecter/i }).click()

  const loginError = page.locator("text=/incorrect|confirmez|trop de tentatives|invalide/i").first()
  try {
    await expect(page).toHaveURL(/dashboard/, { timeout: 15000 })
  } catch (error) {
    const errorText = await loginError.textContent().catch(() => null)
    throw new Error(`Login failed for temp user${errorText ? `: ${errorText}` : ""}`, { cause: error })
  }
}

export async function createBrowserSession(user: TestUser) {
  const publicKey = requirePublicSupabaseKey()
  const client = createClient(getSupabaseUrl(), publicKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  })

  if (error || !data.session) {
    throw error ?? new Error("Unable to create a browser session for the temp user.")
  }

  return data.session as Session
}

export async function authenticatePage(page: Page, user: TestUser) {
  const session = await createBrowserSession(user)
  const encodedSession = `base64-${Buffer.from(JSON.stringify(session), "utf8").toString("base64url")}`
  const cookies = createCookieChunks(getSupabaseStorageKey(), encodedSession).map((cookie) => ({
    name: cookie.name,
    value: cookie.value,
    url: "http://localhost:3000",
  }))

  await page.context().addCookies(cookies)
}

export async function seedPortfolioSnapshots(
  admin: SupabaseClient,
  userId: string,
  seeds: PortfolioSnapshotSeed[]
) {
  const rows = seeds.map((seed) => ({
    user_id: userId,
    analysis_id: seed.analysisId ?? null,
    created_at: seed.createdAt,
    portfolio_value: seed.portfolioValue,
    invested_amount: seed.investedAmount,
    performance_percent: seed.performancePercent,
    allocations: seed.allocations ?? [
      { symbol: "BTC", percentage: 60 },
      { symbol: "ETH", percentage: 40 },
    ],
  }))

  const { error } = await admin.from("portfolio_history").insert(rows)
  if (error) throw error
}

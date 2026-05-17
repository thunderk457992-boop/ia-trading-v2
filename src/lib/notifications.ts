import { createServerClient } from "@supabase/ssr"

export type NotificationType =
  | "market_weekly"
  | "portfolio_drift"
  | "analysis_ready"
  | "upgrade"
  | "system"

export interface NotificationPayload {
  userId: string
  type: NotificationType
  title: string
  message: string
  href?: string
}

function getAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured")
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )
}

// ── createNotification ────────────────────────────────────────────────────────
// Safe insert — fails silently if notifications table doesn't exist yet.

export async function createNotification(payload: NotificationPayload): Promise<boolean> {
  try {
    const db = getAdmin()
    const { error } = await db.from("notifications").insert({
      user_id:    payload.userId,
      type:       payload.type,
      title:      payload.title,
      message:    payload.message,
      href:       payload.href ?? null,
      created_at: new Date().toISOString(),
    })
    if (error) {
      console.warn("[notifications] insert failed:", error.message)
      return false
    }
    return true
  } catch (err) {
    console.warn("[notifications] unexpected error:", err)
    return false
  }
}

// ── Anti-spam: check if notification of this type was sent recently ───────────

export async function wasNotificationRecentlySent(
  userId: string,
  type: NotificationType,
  withinMs: number
): Promise<boolean> {
  try {
    const db = getAdmin()
    const cutoff = new Date(Date.now() - withinMs).toISOString()
    const { count, error } = await db
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", type)
      .gte("created_at", cutoff)

    if (error) return false
    return (count ?? 0) > 0
  } catch {
    return false
  }
}

// ── Pre-built notification creators ──────────────────────────────────────────

const HOUR_MS  = 60 * 60 * 1000
const DAY_MS   = 24 * HOUR_MS
const WEEK_MS  = 7 * DAY_MS

export async function notifyAnalysisReady(userId: string): Promise<void> {
  const alreadySent = await wasNotificationRecentlySent(userId, "analysis_ready", 5 * 60 * 1000)
  if (alreadySent) return

  await createNotification({
    userId,
    type: "analysis_ready",
    title: "Analyse disponible",
    message: "Votre nouvelle analyse IA est prête. Consultez l'allocation et le plan d'action.",
    href: "/advisor",
  })
}

export async function notifyPortfolioDrift(userId: string, maxDriftPts: number): Promise<void> {
  if (maxDriftPts < 3) return
  const alreadySent = await wasNotificationRecentlySent(userId, "portfolio_drift", DAY_MS)
  if (alreadySent) return

  await createNotification({
    userId,
    type: "portfolio_drift",
    title: "Drift portefeuille détecté",
    message: `Votre portefeuille s'est éloigné de l'allocation cible (${maxDriftPts.toFixed(1)} pts de drift). Une mise à jour peut être utile.`,
    href: "/dashboard",
  })
}

export async function notifyMarketWeekly(userId: string, btcChange7d: number): Promise<void> {
  const alreadySent = await wasNotificationRecentlySent(userId, "market_weekly", WEEK_MS)
  if (alreadySent) return

  const sign = btcChange7d >= 0 ? "+" : ""
  await createNotification({
    userId,
    type: "market_weekly",
    title: "Résumé marché de la semaine",
    message: `BTC ${sign}${btcChange7d.toFixed(1)}% cette semaine. Vérifiez si le contexte a changé pour votre plan.`,
    href: "/dashboard",
  })
}

export async function notifyUpgradeAvailable(userId: string, feature: string): Promise<void> {
  const alreadySent = await wasNotificationRecentlySent(userId, "upgrade", 7 * DAY_MS)
  if (alreadySent) return

  await createNotification({
    userId,
    type: "upgrade",
    title: `${feature} disponible en Pro`,
    message: "Passez au plan Pro pour débloquer cette fonctionnalité et améliorer votre suivi.",
    href: "/pricing",
  })
}

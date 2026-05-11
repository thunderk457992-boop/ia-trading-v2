"use client"

// Analytics abstraction — wraps Vercel Analytics + ready for PostHog.
// Import only in "use client" components or event handlers.
// Never import in server components or API routes.

export type TrackEvent =
  // Acquisition
  | "cta_clicked"
  | "signup_started"
  | "login_success"
  // Activation
  | "advisor_started"
  | "advisor_completed"
  | "advisor_error"
  // Revenue
  | "checkout_started"
  | "checkout_success"
  | "checkout_cancelled"
  | "portal_opened"
  // Engagement
  | "chat_message_sent"
  | "dashboard_viewed"
  | "kraken_live_viewed"
  | "guide_viewed"

export type TrackProps = Record<string, string | number | boolean | null | undefined>

function trackVercel(event: string, props?: TrackProps) {
  if (typeof window === "undefined") return
  import("@vercel/analytics").then(({ track }) => {
    track(event, props)
  }).catch(() => {})
}

function trackPostHog(event: string, props?: TrackProps) {
  if (typeof window === "undefined") return
  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return
  try {
    // PostHog loaded via snippet in layout — see ANALYTICS.md
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ph = (window as Record<string, any>).posthog
    if (typeof ph?.capture === "function") ph.capture(event, props)
  } catch {}
}

export function track(event: TrackEvent, props?: TrackProps) {
  trackVercel(event, props)
  trackPostHog(event, props)
}

// Convenience helpers for the most common events

export const Analytics = {
  ctaClicked: (label: string, destination: string) =>
    track("cta_clicked", { label, destination }),

  signupStarted: () =>
    track("signup_started"),

  loginSuccess: (plan: string) =>
    track("login_success", { plan }),

  advisorStarted: (plan: string) =>
    track("advisor_started", { plan }),

  advisorCompleted: (plan: string, assetCount: number, score: number) =>
    track("advisor_completed", { plan, assetCount, score }),

  advisorError: (plan: string, errorType: string) =>
    track("advisor_error", { plan, errorType }),

  checkoutStarted: (plan: string, billing: string) =>
    track("checkout_started", { plan, billing }),

  checkoutSuccess: (plan: string) =>
    track("checkout_success", { plan }),

  checkoutCancelled: () =>
    track("checkout_cancelled"),

  portalOpened: () =>
    track("portal_opened"),

  chatMessageSent: (plan: string, mode: string) =>
    track("chat_message_sent", { plan, mode }),

  dashboardViewed: (hasAnalyses: boolean) =>
    track("dashboard_viewed", { hasAnalyses }),
}

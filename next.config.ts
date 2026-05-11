import type { NextConfig } from "next"
import { withSentryConfig } from "@sentry/nextjs"

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control",  value: "on" },
  { key: "X-Frame-Options",         value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options",  value: "nosniff" },
  { key: "Referrer-Policy",         value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy",      value: "camera=(), microphone=(), geolocation=()" },
]

function getHostnameFromUrl(value?: string) {
  if (!value) return null
  try {
    return new URL(value).hostname
  } catch {
    return value.trim() || null
  }
}

const envOriginHosts = [
  process.env.NEXT_PUBLIC_SITE_URL,
  process.env.SITE_URL,
  process.env.APP_URL,
  process.env.NEXT_PUBLIC_APP_URL,
]
  .map(getHostnameFromUrl)
  .filter((value): value is string => Boolean(value))

const nextConfig: NextConfig = {
  allowedDevOrigins: [...new Set(["192.168.*.*", ...envOriginHosts])],
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }]
  },
  serverExternalPackages: ["stripe"],
  turbopack: { root: __dirname },
}

export default withSentryConfig(nextConfig, {
  // Suppress source map upload when SENTRY_AUTH_TOKEN is not set (local/CI without token)
  silent: !process.env.SENTRY_AUTH_TOKEN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT ?? "axiom-ai",

  // Upload source maps only in production builds with auth token
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  // Auto-instrument server components + API routes
  autoInstrumentServerFunctions: true,
  autoInstrumentMiddleware: true,

  // Disable the Sentry build-time telemetry
  telemetry: false,

})

import type { NextConfig } from "next"

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
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
  serverExternalPackages: ["stripe"],
  turbopack: {
    root: __dirname,
  },
}

export default nextConfig

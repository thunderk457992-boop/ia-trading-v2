import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "development",

  // Capture 10 % of transactions in prod — raise to 100 % during debug
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session replay: 5 % of sessions, 100 % of sessions with errors
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Do not capture errors from browser extensions or irrelevant sources
  denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],

  // Do not send if DSN is missing (local dev without .env.local)
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
})

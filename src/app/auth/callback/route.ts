import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import type { EmailOtpType } from "@supabase/supabase-js"

const ALLOWED_OTP_TYPES = new Set<EmailOtpType>([
  "email", "signup", "invite", "magiclink", "recovery", "email_change",
])

function safeNextPath(raw: string | null): string {
  if (!raw) return "/auth/post-login"
  // Prevent open-redirect: only allow absolute paths
  return raw.startsWith("/") ? raw : "/auth/post-login"
}

// Build a Supabase server client whose session cookies are written
// directly onto `response` — the exact object returned to the browser.
// This is the only pattern that reliably propagates auth cookies through
// a NextResponse.redirect() in Next.js App Router Route Handlers.
function buildSupabaseForResponse(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const rawType    = searchParams.get("type")
  const code       = searchParams.get("code")
  const next       = safeNextPath(searchParams.get("next"))

  const errorRedirect = NextResponse.redirect(
    new URL("/login?error=link_expired", origin)
  )

  // ── token_hash flow ────────────────────────────────────────────────────────
  // Stateless: no prior session or PKCE verifier needed.
  // Works from any browser, device, or email client.
  // Requires the Supabase "Confirm signup" template to use:
  //   {{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=email
  if (token_hash && rawType && ALLOWED_OTP_TYPES.has(rawType as EmailOtpType)) {
    const successRedirect = NextResponse.redirect(new URL(next, origin))
    const supabase = buildSupabaseForResponse(request, successRedirect)

    const { error } = await supabase.auth.verifyOtp({
      type: rawType as EmailOtpType,
      token_hash,
    })

    if (!error) return successRedirect
    return errorRedirect
  }

  // ── PKCE code exchange ─────────────────────────────────────────────────────
  // Used when Supabase still redirects with ?code= (old template, or OAuth).
  // Requires the pkce_code_verifier cookie from the signup browser session.
  // Only reliable when the link is opened in the same browser that signed up.
  if (code) {
    const successRedirect = NextResponse.redirect(new URL(next, origin))
    const supabase = buildSupabaseForResponse(request, successRedirect)

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) return successRedirect
    return errorRedirect
  }

  // ── No usable auth params ──────────────────────────────────────────────────
  // Supabase sends OTP failures as URL fragments (#error=access_denied …).
  // Fragments are never forwarded to the server, so this branch handles:
  //   - expired / already-used tokens
  //   - cross-browser PKCE attempts without a verifier cookie
  return errorRedirect
}

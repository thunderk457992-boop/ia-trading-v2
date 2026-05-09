import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { buildAuthCallbackUrl } from "@/lib/auth-redirect"

function createPublicSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error("Supabase public auth client is not configured.")
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: Request) {
  let email = ""
  let nextPath = "/dashboard"

  try {
    const body = await request.json()
    email = typeof body?.email === "string" ? body.email.trim() : ""
    nextPath = typeof body?.nextPath === "string" ? body.nextPath : "/dashboard"
  } catch {
    email = ""
  }

  if (!email) {
    return NextResponse.json(
      { error: "Entrez votre email pour renvoyer la confirmation." },
      { status: 400 }
    )
  }

  try {
    const supabase = createPublicSupabaseClient()
    const origin = new URL(request.url).origin
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: buildAuthCallbackUrl(origin, nextPath),
      },
    })

    if (error) {
      const status = /rate limit|too many/i.test(error.message) ? 429 : 400
      return NextResponse.json({ error: error.message }, { status })
    }

    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("[auth] resend confirmation failed", error)
    return NextResponse.json(
      { error: "Impossible de renvoyer l'email de confirmation pour le moment." },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }

  let confirmation = ""

  try {
    const body = await request.json()
    confirmation = typeof body?.confirmation === "string" ? body.confirmation.trim().toUpperCase() : ""
  } catch {
    confirmation = ""
  }

  if (confirmation !== "DELETE") {
    return NextResponse.json(
      { error: "Confirmation invalide. Tapez DELETE pour confirmer." },
      { status: 400 }
    )
  }

  try {
    const admin = createAdminClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error("[account-delete] admin delete failed", error)
      return NextResponse.json(
        { error: "Impossible de supprimer le compte pour le moment." },
        { status: 500 }
      )
    }

    await supabase.auth.signOut().catch(() => undefined)

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error("[account-delete] unexpected error", error)
    return NextResponse.json(
      { error: "Impossible de supprimer le compte pour le moment." },
      { status: 500 }
    )
  }
}

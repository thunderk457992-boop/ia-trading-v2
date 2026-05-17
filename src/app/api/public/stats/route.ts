import { NextResponse } from "next/server"
import { fetchMarketSnapshot } from "@/lib/coingecko"
import { createAdminClient } from "@/lib/supabase/admin"

export const revalidate = 60

export async function GET() {
  try {
    const admin = createAdminClient()

    const [{ count: analysesCount, error }, marketSnapshot] = await Promise.all([
      admin
        .from("ai_analyses")
        .select("*", { count: "exact", head: true }),
      fetchMarketSnapshot().catch((marketError) => {
        console.warn("[public/stats] market snapshot unavailable:", marketError)
        return null
      }),
    ])

    if (error) {
      console.warn("[public/stats] count query failed:", error.message)
      return NextResponse.json(
        {
          analysesCount: null,
          activeAssets: marketSnapshot?.summary?.trackedAssets ?? marketSnapshot?.prices.length ?? null,
          marketUpdatedAt: marketSnapshot ? new Date(marketSnapshot.fetchedAt).toISOString() : null,
          fetchedAt: new Date().toISOString(),
        },
        {
          status: 200,
          headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" },
        }
      )
    }

    return NextResponse.json(
      {
        analysesCount: analysesCount ?? null,
        activeAssets: marketSnapshot?.summary?.trackedAssets ?? marketSnapshot?.prices.length ?? null,
        marketUpdatedAt: marketSnapshot ? new Date(marketSnapshot.fetchedAt).toISOString() : null,
        fetchedAt: new Date().toISOString(),
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
      }
    )
  } catch (err) {
    console.error("[public/stats] unexpected error:", err)
    return NextResponse.json(
      { analysesCount: null, activeAssets: null, marketUpdatedAt: null, fetchedAt: new Date().toISOString() },
      { status: 200 }
    )
  }
}

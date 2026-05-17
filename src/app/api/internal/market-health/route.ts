import { NextResponse } from "next/server"
import { getMarketHealthSnapshot } from "@/lib/market-observability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function isAuthorized(request: Request) {
  const configuredToken = process.env.MARKET_DEBUG_TOKEN ?? process.env.CRON_SECRET
  if (!configuredToken) return false

  const authorization = request.headers.get("authorization") ?? ""
  if (!authorization.startsWith("Bearer ")) return false

  const token = authorization.slice("Bearer ".length).trim()
  return token.length > 0 && token === configuredToken
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const snapshot = await getMarketHealthSnapshot()
  return NextResponse.json(snapshot, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
    },
  })
}

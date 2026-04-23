import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    pro: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
      yearly:  process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    },
    premium: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? null,
      yearly:  process.env.STRIPE_PRICE_PREMIUM_YEARLY ?? null,
    },
  })
}

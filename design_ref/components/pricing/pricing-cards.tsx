"use client"

import { Check, Crown, Sparkles, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface PricingTier {
  name: string
  description: string
  price: string
  period: string
  icon: React.ElementType
  featured?: boolean
  features: string[]
  cta: string
}

const tiers: PricingTier[] = [
  {
    name: "Free",
    description: "Get started with basic tracking",
    price: "$0",
    period: "forever",
    icon: Zap,
    features: [
      "Portfolio tracking up to $10k",
      "5 AI analyses per month",
      "Basic market data",
      "Email support",
    ],
    cta: "Get Started",
  },
  {
    name: "Pro",
    description: "For serious investors",
    price: "$29",
    period: "per month",
    icon: Sparkles,
    featured: true,
    features: [
      "Unlimited portfolio value",
      "50 AI analyses per month",
      "Real-time market data",
      "Priority support",
      "Up to 5 portfolios",
      "Advanced charting",
      "API access",
    ],
    cta: "Start Free Trial",
  },
  {
    name: "Premium",
    description: "Full intelligence suite",
    price: "$99",
    period: "per month",
    icon: Crown,
    features: [
      "Everything in Pro",
      "Unlimited AI analyses",
      "Institutional-grade data",
      "24/7 dedicated support",
      "Unlimited portfolios",
      "Custom AI models",
      "Exclusive research",
    ],
    cta: "Contact Sales",
  },
]

export function PricingCards() {
  return (
    <div className="mx-auto max-w-4xl">
      <div className="grid gap-4 lg:grid-cols-3">
        {tiers.map((tier) => {
          const Icon = tier.icon
          
          return (
            <div
              key={tier.name}
              className={cn(
                "relative rounded-xl border p-5 transition-all",
                tier.featured
                  ? "border-foreground bg-card"
                  : "border-border bg-card/50"
              )}
            >
              {tier.featured && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-0.5 text-[10px] font-medium text-background">
                    Popular
                  </span>
                </div>
              )}
              
              <div className="mb-4">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="text-[15px] font-semibold text-foreground">{tier.name}</h3>
                <p className="text-[11px] text-muted-foreground">{tier.description}</p>
              </div>
              
              <div className="mb-4">
                <div className="flex items-baseline gap-0.5">
                  <span className="text-2xl font-bold tracking-tight text-foreground">
                    {tier.price}
                  </span>
                  <span className="text-[11px] text-muted-foreground">/{tier.period}</span>
                </div>
              </div>
              
              <ul className="mb-5 space-y-2">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                    <span className="text-[12px] text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <button
                className={cn(
                  "w-full rounded-lg py-2 text-[12px] font-medium transition-colors",
                  tier.featured
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "border border-border bg-secondary/50 text-foreground hover:bg-secondary"
                )}
              >
                {tier.cta}
              </button>
            </div>
          )
        })}
      </div>
      
      <div className="mt-8 rounded-xl border border-border bg-card/50 p-5 text-center">
        <h3 className="text-[15px] font-semibold text-foreground mb-1">Need a custom solution?</h3>
        <p className="text-[12px] text-muted-foreground mb-4 max-w-sm mx-auto">
          For institutions requiring custom features or dedicated infrastructure.
        </p>
        <button className="rounded-lg border border-border bg-secondary/50 px-5 py-2 text-[12px] font-medium text-foreground transition-colors hover:bg-secondary">
          Contact Sales
        </button>
      </div>
    </div>
  )
}

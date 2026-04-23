"use client"

import { useState } from "react"
import { Sidebar, MobileNav } from "@/components/dashboard/sidebar"
import { AdvisorQuestionnaire } from "@/components/advisor/questionnaire"
import { AdvisorResults } from "@/components/advisor/results"

export interface AnalysisResult {
  aiScore: number
  marketSignal: "bullish" | "bearish" | "neutral"
  riskLevel: "low" | "medium" | "high"
  allocation: {
    name: string
    current: number
    recommended: number
    color: string
  }[]
  timeline: {
    date: string
    action: string
    priority: "high" | "medium" | "low"
  }[]
  opportunities: string[]
  risks: string[]
  timing: string
}

export default function AdvisorPage() {
  const [showResults, setShowResults] = useState(false)
  const [results, setResults] = useState<AnalysisResult | null>(null)

  const handleComplete = () => {
    setResults({
      aiScore: 87,
      marketSignal: "bullish",
      riskLevel: "medium",
      allocation: [
        { name: "Bitcoin", current: 45, recommended: 40, color: "oklch(0.25 0.01 250)" },
        { name: "Ethereum", current: 25, recommended: 30, color: "oklch(0.55 0.14 250)" },
        { name: "Solana", current: 15, recommended: 18, color: "oklch(0.55 0.16 155)" },
        { name: "Stablecoins", current: 10, recommended: 8, color: "oklch(0.70 0 0)" },
        { name: "Other", current: 5, recommended: 4, color: "oklch(0.85 0 0)" },
      ],
      timeline: [
        { date: "Week 1", action: "Reduce BTC position by 5%", priority: "high" },
        { date: "Week 2", action: "Increase ETH allocation", priority: "high" },
        { date: "Week 3", action: "Add SOL to portfolio", priority: "medium" },
        { date: "Week 4", action: "Review and rebalance", priority: "low" },
      ],
      opportunities: [
        "ETH showing strong accumulation patterns with institutional interest",
        "SOL ecosystem growth indicates potential 40% upside",
        "DeFi sector recovery presenting yield opportunities",
      ],
      risks: [
        "BTC dominance at resistance level - potential correction risk",
        "Regulatory uncertainty in key markets",
        "Macroeconomic factors may impact risk assets",
      ],
      timing: "Current market conditions favor gradual position building over the next 4-6 weeks. Avoid large single entries.",
    })
    setShowResults(true)
  }

  const handleReset = () => {
    setShowResults(false)
    setResults(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="lg:pl-60 pb-16 lg:pb-0">
        <div className="px-4 py-5 lg:px-6 lg:py-6">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              AI Advisor
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Get personalized investment recommendations
            </p>
          </div>
          
          {showResults && results ? (
            <AdvisorResults results={results} onReset={handleReset} />
          ) : (
            <AdvisorQuestionnaire onComplete={handleComplete} />
          )}
        </div>
      </main>
    </div>
  )
}

"use client"

import { Sparkles, ArrowRight, TrendingUp, Shield, Clock, Zap, Target, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface Recommendation {
  id: string
  type: "rebalance" | "buy" | "sell" | "hold"
  title: string
  description: string
  potential: string
  risk: "low" | "medium" | "high"
  timeframe: string
  confidence: number
  priority: "high" | "medium" | "low"
}

const recommendations: Recommendation[] = [
  {
    id: "1",
    type: "rebalance",
    title: "Increase ETH Allocation",
    description: "Market conditions favor ETH growth. Consider moving 5% from BTC.",
    potential: "+12%",
    risk: "medium",
    timeframe: "30 days",
    confidence: 87,
    priority: "high"
  },
  {
    id: "2",
    type: "buy",
    title: "LINK Accumulation Zone",
    description: "Strong support at current levels with bullish divergence forming.",
    potential: "+28%",
    risk: "medium",
    timeframe: "60 days",
    confidence: 82,
    priority: "medium"
  },
  {
    id: "3",
    type: "sell",
    title: "Take Profit on ADA",
    description: "Approaching resistance. Consider securing gains.",
    potential: "-8%",
    risk: "high",
    timeframe: "7 days",
    confidence: 74,
    priority: "low"
  }
]

const typeConfig = {
  rebalance: { icon: Zap, color: "text-accent", bg: "bg-accent/10" },
  buy: { icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
  sell: { icon: Target, color: "text-destructive", bg: "bg-destructive/10" },
  hold: { icon: Shield, color: "text-muted-foreground", bg: "bg-secondary" },
}

const riskConfig = {
  low: { color: "text-success", label: "Low" },
  medium: { color: "text-warning", label: "Med" },
  high: { color: "text-destructive", label: "High" },
}

export function RecommendationCard() {
  const primaryRec = recommendations[0]
  const TypeIcon = typeConfig[primaryRec.type].icon

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-[11px] font-semibold text-accent uppercase tracking-wide">AI Recommendations</span>
        </div>
        
        <div className="flex items-start gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", typeConfig[primaryRec.type].bg)}>
            <TypeIcon className={cn("h-5 w-5", typeConfig[primaryRec.type].color)} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-[14px] font-semibold text-foreground mb-0.5">{primaryRec.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{primaryRec.description}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-4 gap-2 mt-4">
          <div className="rounded-lg bg-secondary/60 p-2">
            <div className="flex items-center gap-1 text-success mb-0.5">
              <TrendingUp className="h-2.5 w-2.5" />
              <span className="text-[9px] font-medium">Potential</span>
            </div>
            <p className="text-[13px] font-bold text-foreground">{primaryRec.potential}</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Shield className="h-2.5 w-2.5" />
              <span className="text-[9px] font-medium">Risk</span>
            </div>
            <p className={cn("text-[13px] font-bold", riskConfig[primaryRec.risk].color)}>{riskConfig[primaryRec.risk].label}</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Clock className="h-2.5 w-2.5" />
              <span className="text-[9px] font-medium">Time</span>
            </div>
            <p className="text-[13px] font-bold text-foreground">{primaryRec.timeframe}</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-2">
            <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
              <Target className="h-2.5 w-2.5" />
              <span className="text-[9px] font-medium">Confidence</span>
            </div>
            <p className="text-[13px] font-bold text-foreground">{primaryRec.confidence}%</p>
          </div>
        </div>
        
        <button className="group flex w-full items-center justify-center gap-1.5 rounded-lg bg-foreground px-3 py-2.5 mt-4 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90">
          Apply Recommendation
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
      
      <div className="p-3">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Suggestions</p>
        <div className="space-y-2">
          {recommendations.slice(1).map((rec) => {
            const Icon = typeConfig[rec.type].icon
            return (
              <button 
                key={rec.id}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-secondary/60 transition-colors text-left group"
              >
                <div className={cn("flex h-7 w-7 items-center justify-center rounded-md shrink-0", typeConfig[rec.type].bg)}>
                  <Icon className={cn("h-3.5 w-3.5", typeConfig[rec.type].color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground truncate">{rec.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {rec.potential} potential | {rec.confidence}% confidence
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

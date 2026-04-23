"use client"

import { Clock, ArrowUpRight, TrendingUp, TrendingDown, Minus, Brain, Target, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Analysis {
  id: string
  asset: string
  symbol: string
  signal: "bullish" | "bearish" | "neutral"
  score: number
  confidence: number
  timestamp: string
  priceTarget?: string
  risk: "low" | "medium" | "high"
  summary: string
}

const recentAnalyses: Analysis[] = [
  { 
    id: "1", 
    asset: "Bitcoin", 
    symbol: "BTC", 
    signal: "bullish", 
    score: 85,
    confidence: 92,
    timestamp: "2 hours ago",
    priceTarget: "$72,500",
    risk: "low",
    summary: "Strong accumulation pattern with institutional inflows"
  },
  { 
    id: "2", 
    asset: "Ethereum", 
    symbol: "ETH", 
    signal: "bullish", 
    score: 78,
    confidence: 87,
    timestamp: "5 hours ago",
    priceTarget: "$3,800",
    risk: "medium",
    summary: "ETF approval momentum driving demand"
  },
  { 
    id: "3", 
    asset: "Solana", 
    symbol: "SOL", 
    signal: "neutral", 
    score: 62,
    confidence: 74,
    timestamp: "8 hours ago",
    risk: "medium",
    summary: "Consolidation phase, watching for breakout"
  },
  { 
    id: "4", 
    asset: "Cardano", 
    symbol: "ADA", 
    signal: "bearish", 
    score: 34,
    confidence: 81,
    timestamp: "12 hours ago",
    priceTarget: "$0.38",
    risk: "high",
    summary: "Bearish divergence on declining volume"
  },
  { 
    id: "5", 
    asset: "Chainlink", 
    symbol: "LINK", 
    signal: "bullish", 
    score: 76,
    confidence: 85,
    timestamp: "1 day ago",
    priceTarget: "$18.50",
    risk: "medium",
    summary: "CCIP adoption driving network activity"
  },
]

const signalConfig = {
  bullish: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Buy" },
  bearish: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", label: "Sell" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-secondary", label: "Hold" },
}

const riskConfig = {
  low: { color: "text-success", bg: "bg-success/10" },
  medium: { color: "text-warning", bg: "bg-warning/10" },
  high: { color: "text-destructive", bg: "bg-destructive/10" },
}

function ScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 70) return "bg-success"
    if (score >= 40) return "bg-warning"
    return "bg-destructive"
  }
  
  return (
    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", getColor())} style={{ width: `${score}%` }} />
    </div>
  )
}

export function RecentAnalyses() {
  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <div>
            <h3 className="text-[15px] font-semibold text-foreground">AI Analyses</h3>
            <p className="text-[11px] text-muted-foreground">Real-time market intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
            {recentAnalyses.length} active
          </span>
          <button className="flex items-center gap-1 text-[11px] font-medium text-accent hover:underline transition-colors">
            View All
            <ArrowUpRight className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Asset</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Signal</th>
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Score</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:table-cell">Confidence</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground md:table-cell">Target</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">Risk</th>
              <th className="hidden px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground xl:table-cell">Summary</th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recentAnalyses.map((analysis) => {
              const signal = signalConfig[analysis.signal]
              const risk = riskConfig[analysis.risk]
              const SignalIcon = signal.icon
              
              return (
                <tr key={analysis.id} className="transition-colors hover:bg-secondary/30 cursor-pointer">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
                        {analysis.symbol.charAt(0)}
                      </div>
                      <div>
                        <p className="text-[13px] font-medium text-foreground">{analysis.asset}</p>
                        <p className="text-[10px] text-muted-foreground">{analysis.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5", signal.bg)}>
                      <SignalIcon className={cn("h-3 w-3", signal.color)} />
                      <span className={cn("text-[10px] font-semibold", signal.color)}>{signal.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-foreground tabular-nums">{analysis.score}</span>
                      <ScoreBar score={analysis.score} />
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 sm:table-cell">
                    <span className="text-[12px] text-muted-foreground tabular-nums">{analysis.confidence}%</span>
                  </td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    {analysis.priceTarget ? (
                      <div className="flex items-center gap-1">
                        <Target className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[12px] font-medium text-foreground tabular-nums">{analysis.priceTarget}</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <div className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize", risk.bg, risk.color)}>
                      <AlertCircle className="h-2.5 w-2.5" />
                      {analysis.risk}
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 xl:table-cell max-w-[200px]">
                    <p className="text-[11px] text-muted-foreground truncate">{analysis.summary}</p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {analysis.timestamp}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Updated every 15 minutes</span>
        <button className="text-[11px] font-medium text-accent hover:underline">Request New Analysis</button>
      </div>
    </div>
  )
}

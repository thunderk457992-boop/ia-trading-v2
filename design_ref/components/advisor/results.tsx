"use client"

import { 
  TrendingUp, 
  TrendingDown,
  Minus,
  Shield, 
  AlertTriangle, 
  Lightbulb, 
  Clock, 
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Download
} from "lucide-react"
import { cn } from "@/lib/utils"
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from "recharts"
import type { AnalysisResult } from "@/app/advisor/page"

interface ResultsProps {
  results: AnalysisResult
  onReset: () => void
}

const signalConfig = {
  bullish: { icon: TrendingUp, color: "text-success", bg: "bg-success/10", label: "Bullish" },
  bearish: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", label: "Bearish" },
  neutral: { icon: Minus, color: "text-muted-foreground", bg: "bg-secondary", label: "Neutral" },
}

const riskConfig = {
  low: { color: "text-success", bg: "bg-success/10", label: "Low Risk" },
  medium: { color: "text-warning", bg: "bg-warning/10", label: "Medium Risk" },
  high: { color: "text-destructive", bg: "bg-destructive/10", label: "High Risk" },
}

export function AdvisorResults({ results, onReset }: ResultsProps) {
  const signal = signalConfig[results.marketSignal]
  const risk = riskConfig[results.riskLevel]
  const SignalIcon = signal.icon

  const chartData = results.allocation.map((item) => ({
    name: item.name,
    current: item.current,
    recommended: item.recommended,
    color: item.color,
  }))

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; current: number; recommended: number } }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-1.5 shadow-sm">
          <p className="text-[13px] font-medium text-foreground">{data.name}</p>
          <p className="text-[11px] text-muted-foreground">Current: {data.current}%</p>
          <p className="text-[11px] text-accent">Recommended: {data.recommended}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0">
            <svg className="h-24 w-24 -rotate-90 transform">
              <circle cx="48" cy="48" r="42" fill="none" stroke="oklch(0.92 0.003 250)" strokeWidth="6" />
              <circle cx="48" cy="48" r="42" fill="none" stroke="oklch(0.55 0.14 250)" strokeWidth="6" strokeDasharray={`${(results.aiScore / 100) * 264} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{results.aiScore}</span>
              <span className="text-[10px] text-muted-foreground">Score</span>
            </div>
          </div>
          
          <div className="flex-1">
            <h2 className="text-[17px] font-semibold text-foreground mb-1">Analysis Complete</h2>
            <p className="text-[12px] text-muted-foreground mb-3">
              Based on your profile and market conditions, here are your recommendations.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", signal.bg)}>
                <SignalIcon className={cn("h-3 w-3", signal.color)} />
                <span className={cn("text-[11px] font-medium", signal.color)}>{signal.label}</span>
              </div>
              <div className={cn("flex items-center gap-1.5 rounded-full px-2.5 py-1", risk.bg)}>
                <Shield className={cn("h-3 w-3", risk.color)} />
                <span className={cn("text-[11px] font-medium", risk.color)}>{risk.label}</span>
              </div>
            </div>
          </div>
          
          <button className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0" title="Export analysis">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-1">Recommended Allocation</h3>
        <p className="text-[11px] text-muted-foreground mb-4">Current vs recommended portfolio distribution</p>
        
        <div className="h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" barGap={3}>
              <XAxis type="number" domain={[0, 50]} tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="current" radius={[0, 3, 3, 0]} barSize={10}>
                {chartData.map((_, index) => (
                  <Cell key={`current-${index}`} fill="oklch(0.88 0 0)" />
                ))}
              </Bar>
              <Bar dataKey="recommended" radius={[0, 3, 3, 0]} barSize={10}>
                {chartData.map((entry, index) => (
                  <Cell key={`recommended-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-3 flex items-center justify-center gap-5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-[oklch(0.88_0_0)]" />
            <span className="text-muted-foreground">Current</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm bg-accent" />
            <span className="text-muted-foreground">Recommended</span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-1.5 mb-4">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold text-foreground">Action Timeline</h3>
        </div>
        
        <div className="space-y-3">
          {results.timeline.map((item, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-medium",
                  item.priority === "high" ? "bg-foreground text-background" :
                  item.priority === "medium" ? "bg-secondary text-foreground" :
                  "bg-secondary/60 text-muted-foreground"
                )}>
                  {index + 1}
                </div>
                {index < results.timeline.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-border" />
                )}
              </div>
              <div className="flex-1 pb-2">
                <p className="text-[10px] font-medium text-muted-foreground">{item.date}</p>
                <p className="text-[13px] font-medium text-foreground">{item.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Lightbulb className="h-4 w-4 text-success" />
            <h3 className="text-[14px] font-semibold text-foreground">Opportunities</h3>
          </div>
          <div className="space-y-2.5">
            {results.opportunities.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-success" />
                <p className="text-[12px] text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <h3 className="text-[14px] font-semibold text-foreground">Risks</h3>
          </div>
          <div className="space-y-2.5">
            {results.risks.map((item, index) => (
              <div key={index} className="flex items-start gap-2">
                <XCircle className="h-4 w-4 mt-0.5 shrink-0 text-destructive" />
                <p className="text-[12px] text-muted-foreground leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-[14px] font-semibold text-foreground">Market Timing</h3>
        </div>
        <p className="text-[12px] text-muted-foreground leading-relaxed">{results.timing}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          New Analysis
        </button>
        <button className="flex items-center gap-1.5 rounded-lg bg-foreground px-5 py-2.5 text-[12px] font-medium text-background transition-colors hover:bg-foreground/90">
          Apply Recommendations
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

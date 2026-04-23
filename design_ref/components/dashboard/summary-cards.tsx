"use client"

import { TrendingUp, TrendingDown, Brain, Crown, BarChart3, Activity, Wallet, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { LineChart, Line, ResponsiveContainer } from "recharts"

interface SummaryCardProps {
  title: string
  value: string
  subtitle?: string
  change?: {
    value: string
    positive: boolean
  }
  icon: React.ReactNode
  sparkline?: number[]
  trend?: "up" | "down" | "neutral"
}

function MiniSparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((value, index) => ({ value, index }))
  return (
    <div className="h-8 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={positive ? "oklch(0.55 0.16 155)" : "oklch(0.55 0.2 25)"}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function SummaryCard({ title, value, subtitle, change, icon, sparkline, trend }: SummaryCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-0.5 flex-1">
          <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-xl font-bold tracking-tight text-foreground">{value}</p>
            {sparkline && trend && (
              <MiniSparkline data={sparkline} positive={trend === "up"} />
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-muted-foreground">{subtitle}</p>
          )}
          {change && (
            <div className={cn(
              "flex items-center gap-1 text-[11px] font-medium mt-1",
              change.positive ? "text-success" : "text-destructive"
            )}>
              {change.positive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{change.value}</span>
              <span className="text-muted-foreground font-normal">24h</span>
            </div>
          )}
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          {icon}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, change, positive }: { label: string; value: string; change?: string; positive?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[12px] font-medium text-foreground">{value}</span>
        {change && (
          <span className={cn("text-[10px] font-medium", positive ? "text-success" : "text-destructive")}>
            {change}
          </span>
        )}
      </div>
    </div>
  )
}

export function SummaryCards() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Portfolio Value"
          value="$147,892.34"
          change={{ value: "+$3,421.18 (2.4%)", positive: true }}
          icon={<Wallet className="h-4 w-4" />}
          sparkline={[65, 68, 66, 70, 69, 72, 71, 74, 73, 76]}
          trend="up"
        />
        <SummaryCard
          title="24h P&L"
          value="+$3,421.18"
          subtitle="Best: SOL (+8.2%)"
          change={{ value: "+2.4%", positive: true }}
          icon={<Activity className="h-4 w-4" />}
        />
        <SummaryCard
          title="AI Score"
          value="87/100"
          subtitle="Strong Buy Signal"
          icon={<Brain className="h-4 w-4" />}
        />
        <SummaryCard
          title="Win Rate"
          value="73.2%"
          subtitle="Last 30 trades"
          icon={<Percent className="h-4 w-4" />}
        />
      </div>
      
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Market Status</span>
          </div>
          <div className="divide-y divide-border">
            <MetricCard label="BTC Dominance" value="52.4%" change="+0.3%" positive />
            <MetricCard label="Total Market Cap" value="$2.48T" change="+1.2%" positive />
            <MetricCard label="24h Volume" value="$89.2B" change="-5.4%" positive={false} />
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fear & Greed Index</span>
            <span className="text-[10px] font-medium text-success">Greed</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-gradient-to-r from-destructive via-warning to-success overflow-hidden">
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-4 w-1 bg-foreground rounded-full shadow-sm"
              style={{ left: '72%' }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[9px] text-muted-foreground">Extreme Fear</span>
            <span className="text-[12px] font-bold text-foreground">72</span>
            <span className="text-[9px] text-muted-foreground">Extreme Greed</span>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Your Plan</span>
          </div>
          <div className="divide-y divide-border">
            <MetricCard label="Current Plan" value="Pro" />
            <MetricCard label="Analyses Used" value="47/50" />
            <MetricCard label="Renews" value="Dec 24, 2024" />
          </div>
        </div>
      </div>
    </div>
  )
}

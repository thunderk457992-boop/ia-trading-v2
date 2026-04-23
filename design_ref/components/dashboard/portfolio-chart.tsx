"use client"

import { useState, useMemo } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import { cn } from "@/lib/utils"
import { RefreshCw, Download, TrendingUp, TrendingDown, Maximize2, Settings2, ChevronDown } from "lucide-react"

const timeframes = ["1H", "1D", "7D", "1M", "3M", "1Y", "ALL"]

const generateChartData = (period: string) => {
  const configs: Record<string, { points: number; labels: (i: number) => string }> = {
    "1H": { points: 60, labels: (i) => `${i}m` },
    "1D": { points: 24, labels: (i) => `${i}:00` },
    "7D": { points: 7, labels: (i) => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i % 7] },
    "1M": { points: 30, labels: (i) => `${i + 1}` },
    "3M": { points: 12, labels: (i) => `W${i + 1}` },
    "1Y": { points: 12, labels: (i) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][i] },
    "ALL": { points: 24, labels: (i) => `${2022 + Math.floor(i / 12)}` },
  }
  
  const config = configs[period] || configs["1M"]
  const baseValue = 147892
  const btcBase = 67000
  const ethBase = 3521
  const data = []
  
  for (let i = 0; i < config.points; i++) {
    const portfolioVariation = (Math.random() - 0.4) * 5000
    const portfolioTrend = i * (baseValue * 0.0015)
    const btcVariation = (Math.random() - 0.45) * 3000
    const btcTrend = i * (btcBase * 0.001)
    const ethVariation = (Math.random() - 0.42) * 200
    const ethTrend = i * (ethBase * 0.0012)
    
    data.push({
      name: config.labels(i),
      portfolio: Math.round(baseValue - 15000 + portfolioTrend + portfolioVariation),
      btc: Math.round(btcBase - 5000 + btcTrend + btcVariation),
      eth: Math.round(ethBase - 300 + ethTrend + ethVariation),
    })
  }
  return data
}

const periodPerformance: Record<string, { portfolio: number; btc: number; eth: number; high: number; low: number }> = {
  "1H": { portfolio: 0.3, btc: 0.2, eth: 0.4, high: 148234, low: 147123 },
  "1D": { portfolio: 2.4, btc: 1.8, eth: 2.1, high: 149892, low: 144532 },
  "7D": { portfolio: 5.2, btc: 3.1, eth: 4.8, high: 152341, low: 139872 },
  "1M": { portfolio: 12.8, btc: 8.4, eth: 11.2, high: 158234, low: 128943 },
  "3M": { portfolio: 28.4, btc: 19.2, eth: 24.5, high: 165432, low: 112345 },
  "1Y": { portfolio: 67.3, btc: 52.1, eth: 61.8, high: 178234, low: 89234 },
  "ALL": { portfolio: 234.5, btc: 189.3, eth: 212.4, high: 198234, low: 45234 },
}

export function PortfolioChart() {
  const [selectedTimeframe, setSelectedTimeframe] = useState("1M")
  const [showBtc, setShowBtc] = useState(true)
  const [showEth, setShowEth] = useState(false)
  const [chartType, setChartType] = useState<"area" | "line">("area")
  const data = useMemo(() => generateChartData(selectedTimeframe), [selectedTimeframe])
  const performance = periodPerformance[selectedTimeframe]

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <p className="text-[10px] text-muted-foreground mb-1.5 font-medium">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <div className={cn(
                  "h-2 w-2 rounded-full",
                  entry.dataKey === "portfolio" ? "bg-accent" :
                  entry.dataKey === "btc" ? "bg-orange-500" : "bg-purple-500"
                )} />
                <span className="text-[11px] text-muted-foreground capitalize">{entry.dataKey}</span>
              </div>
              <span className="text-[12px] font-medium text-foreground tabular-nums">{formatValue(entry.value)}</span>
            </div>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="p-5 border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Portfolio Value</span>
              <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Live</span>
            </div>
            <div className="flex items-baseline gap-3">
              <h2 className="text-3xl font-bold tracking-tight text-foreground tabular-nums">$147,892.34</h2>
              <div className={cn(
                "flex items-center gap-0.5 text-[14px] font-semibold",
                performance.portfolio >= 0 ? "text-success" : "text-destructive"
              )}>
                {performance.portfolio >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {performance.portfolio >= 0 ? "+" : ""}{performance.portfolio}%
              </div>
            </div>
            <p className="text-[12px] text-muted-foreground mt-1">
              {performance.portfolio >= 0 ? "+" : "-"}${Math.abs(Math.round(147892 * performance.portfolio / 100)).toLocaleString()} ({selectedTimeframe})
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5 bg-secondary/30">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={cn(
                    "rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                    selectedTimeframe === tf
                      ? "bg-foreground text-background shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  )}
                >
                  {tf}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Chart settings">
                <Settings2 className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Fullscreen">
                <Maximize2 className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
              <button className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Export">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <button className="flex items-center gap-1.5 group">
            <div className="h-2.5 w-2.5 rounded-full bg-accent" />
            <span className="text-[11px] font-medium text-foreground">Portfolio</span>
            <span className={cn("text-[11px] font-semibold", performance.portfolio >= 0 ? "text-success" : "text-destructive")}>
              {performance.portfolio >= 0 ? "+" : ""}{performance.portfolio}%
            </span>
          </button>
          <button 
            onClick={() => setShowBtc(!showBtc)}
            className={cn("flex items-center gap-1.5 transition-opacity", showBtc ? "opacity-100" : "opacity-40")}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <span className="text-[11px] font-medium text-foreground">BTC</span>
            <span className={cn("text-[11px] font-semibold", performance.btc >= 0 ? "text-success" : "text-destructive")}>
              {performance.btc >= 0 ? "+" : ""}{performance.btc}%
            </span>
          </button>
          <button 
            onClick={() => setShowEth(!showEth)}
            className={cn("flex items-center gap-1.5 transition-opacity", showEth ? "opacity-100" : "opacity-40")}
          >
            <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
            <span className="text-[11px] font-medium text-foreground">ETH</span>
            <span className={cn("text-[11px] font-semibold", performance.eth >= 0 ? "text-success" : "text-destructive")}>
              {performance.eth >= 0 ? "+" : ""}{performance.eth}%
            </span>
          </button>
          
          <div className="ml-auto flex items-center gap-4 text-[11px]">
            <div>
              <span className="text-muted-foreground">High: </span>
              <span className="font-medium text-success tabular-nums">{formatValue(performance.high)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Low: </span>
              <span className="font-medium text-destructive tabular-nums">{formatValue(performance.low)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="h-[320px] w-full p-4 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.55 0.14 250)" stopOpacity={0.2} />
                <stop offset="100%" stopColor="oklch(0.55 0.14 250)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="btcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ethGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.003 250)" vertical={false} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 10 }}
              dy={8}
            />
            <YAxis
              yAxisId="portfolio"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "oklch(0.45 0.01 250)", fontSize: 10 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              dx={-8}
              width={55}
            />
            <YAxis
              yAxisId="btc"
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#f97316", fontSize: 10 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              dx={8}
              width={55}
              hide={!showBtc && !showEth}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              yAxisId="portfolio"
              type="monotone"
              dataKey="portfolio"
              stroke="oklch(0.55 0.14 250)"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
            {showBtc && (
              <Area
                yAxisId="btc"
                type="monotone"
                dataKey="btc"
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                fill="url(#btcGradient)"
              />
            )}
            {showEth && (
              <Area
                yAxisId="btc"
                type="monotone"
                dataKey="eth"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 2"
                fill="url(#ethGradient)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface AllocationItem {
  name: string
  symbol: string
  value: number
  amount: string
  usdValue: string
  change24h: number
  color: string
}

const allocationData: AllocationItem[] = [
  { name: "Bitcoin", symbol: "BTC", value: 45, amount: "1.24 BTC", usdValue: "$83,615.90", change24h: 2.34, color: "oklch(0.25 0.01 250)" },
  { name: "Ethereum", symbol: "ETH", value: 25, amount: "12.5 ETH", usdValue: "$44,018.13", change24h: 1.87, color: "oklch(0.55 0.14 250)" },
  { name: "Solana", symbol: "SOL", value: 12, amount: "45 SOL", usdValue: "$8,051.40", change24h: -0.56, color: "oklch(0.55 0.16 155)" },
  { name: "BNB", symbol: "BNB", value: 8, amount: "8.2 BNB", usdValue: "$5,021.19", change24h: 0.92, color: "oklch(0.65 0.12 80)" },
  { name: "Others", symbol: "ALT", value: 10, amount: "Various", usdValue: "$7,185.72", change24h: 1.23, color: "oklch(0.80 0 0)" },
]

export function AllocationChart() {
  const totalValue = "$147,892.34"
  
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: AllocationItem }> }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: data.color }} />
            <p className="text-[13px] font-semibold text-foreground">{data.name}</p>
          </div>
          <p className="text-[12px] text-muted-foreground">{data.amount}</p>
          <p className="text-[12px] font-medium text-foreground">{data.usdValue}</p>
          <div className={cn("text-[11px] font-medium mt-1", data.change24h >= 0 ? "text-success" : "text-destructive")}>
            {data.change24h >= 0 ? "+" : ""}{data.change24h}% (24h)
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Allocation</h3>
          <p className="text-[11px] text-muted-foreground">Portfolio distribution</p>
        </div>
        <button className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors">
          Details
          <ArrowUpRight className="h-3 w-3" />
        </button>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="relative h-[160px] w-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-muted-foreground">Total</span>
            <span className="text-[15px] font-bold text-foreground">{totalValue}</span>
          </div>
        </div>
        
        <div className="mt-4 w-full space-y-2">
          {allocationData.map((item) => (
            <div key={item.name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <div>
                  <span className="text-[12px] font-medium text-foreground">{item.symbol}</span>
                  <span className="text-[10px] text-muted-foreground ml-1.5">{item.value}%</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[12px] font-medium text-foreground tabular-nums">{item.usdValue}</p>
                <div className={cn(
                  "flex items-center justify-end gap-0.5 text-[10px] font-medium",
                  item.change24h >= 0 ? "text-success" : "text-destructive"
                )}>
                  {item.change24h >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(item.change24h)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

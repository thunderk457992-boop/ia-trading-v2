"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"

const ASSET_COLORS: Record<string, string> = {
  BTC: "#f59e0b", ETH: "#3b82f6", SOL: "#a855f7",
  BNB: "#eab308", XRP: "#0ea5e9", ADA: "#2563eb",
  AVAX: "#ef4444", DOT: "#ec4899", LINK: "#1d4ed8",
  NEAR: "#22c55e", MATIC: "#7c3aed", ATOM: "#6366f1",
  ALGO: "#14b8a6", FTM: "#8b5cf6", ONE: "#06b6d4",
}

const FALLBACK_COLORS = ["#94a3b8", "#64748b", "#475569", "#334155", "#1e293b"]

interface Allocation {
  asset: string
  percentage: number
}

interface TooltipEntry {
  name: string
  value: number
  payload: { fill: string }
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: TooltipEntry[] }) {
  if (!active || !payload?.length) return null
  const item = payload[0]
  return (
    <div style={{
      background: "#fff",
      border: "none",
      borderRadius: 10,
      padding: "7px 13px",
      boxShadow: "0 8px 24px rgba(0,0,0,0.11)",
      display: "flex",
      alignItems: "center",
      gap: 8,
    }}>
      <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.payload.fill, flexShrink: 0 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.name}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color: "#0f172a" }}>{item.value}%</span>
    </div>
  )
}

export function PortfolioChart({ allocations }: { allocations: Allocation[] }) {
  if (!allocations.length) return null

  const data   = allocations.map((a) => ({ name: a.asset, value: a.percentage }))
  const colors = allocations.map((a, i) => ASSET_COLORS[a.asset] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])
  const top    = allocations[0]

  return (
    <div className="relative w-full h-full">
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
          {top.asset}
        </span>
        <span className="text-xl font-black text-slate-800 tabular-nums leading-none">
          {top.percentage}%
        </span>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius="54%"
            outerRadius="82%"
            paddingAngle={2}
            dataKey="value"
            strokeWidth={0}
            startAngle={90}
            endAngle={-270}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts"

interface Allocation {
  symbol: string
  name: string
  percentage: number
}

const COLORS = [
  "#6366f1", "#8b5cf6", "#d946ef", "#ec4899",
  "#f59e0b", "#10b981", "#3b82f6", "#06b6d4",
]

export function PortfolioChart({ allocations }: { allocations: Allocation[] }) {
  const data = allocations.map((a) => ({
    name: a.symbol,
    value: a.percentage,
  }))

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "rgba(0,0,0,0.9)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#fff",
              fontSize: "12px",
            }}
            formatter={(value) => [`${value}%`, ""]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "12px" }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

"use client"

import { useEffect, useRef, useState } from "react"
import { PieChart, Pie, Cell, Tooltip } from "recharts"

const ASSET_COLORS: Record<string, string> = {
  BTC: "#f59e0b", ETH: "#3b82f6", SOL: "#a855f7",
  BNB: "#eab308", XRP: "#0ea5e9", ADA: "#2563eb",
  AVAX: "#ef4444", DOT: "#ec4899", LINK: "#1d4ed8",
  NEAR: "#22c55e", MATIC: "#7c3aed", POL: "#7c3aed", ATOM: "#6366f1",
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
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateSize = (width: number, height: number) => {
      if (width <= 0 || height <= 0) return
      setChartSize((current) => (
        current.width === width && current.height === height
          ? current
          : { width, height }
      ))
    }

    updateSize(container.clientWidth, container.clientHeight)

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return
      updateSize(entry.contentRect.width, entry.contentRect.height)
    })

    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  if (!allocations.length) return null

  const data   = allocations.map((a) => ({ name: a.asset, value: a.percentage }))
  const colors = allocations.map((a, i) => ASSET_COLORS[a.asset] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length])
  const top    = allocations[0]

  return (
    <div ref={containerRef} className="relative h-full w-full min-h-0 min-w-0">
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-0.5">
          {top.asset}
        </span>
        <span className="text-xl font-semibold text-foreground tabular-nums leading-none">
          {top.percentage}%
        </span>
      </div>

      {chartSize.width > 0 && chartSize.height > 0 && (
        <PieChart width={chartSize.width} height={chartSize.height}>
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
      )}
    </div>
  )
}

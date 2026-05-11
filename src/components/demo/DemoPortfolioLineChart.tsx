"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts"

type DemoPoint = {
  dateLabel: string
  shortLabel: string
  value: number
  invested: number
  pnl: number
}

function formatEuro(value: number) {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  })
}

function DemoTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ payload: DemoPoint }>
}) {
  if (!active || !payload?.length) return null

  const point = payload[0].payload

  return (
    <div className="min-w-[220px] rounded-2xl border border-white/10 bg-[#0b0d12]/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/45">{point.dateLabel}</p>
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-white/65">Valeur portefeuille</span>
          <span className="font-semibold text-white">{formatEuro(point.value)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-white/65">Capital investi</span>
          <span className="font-semibold text-white/90">{formatEuro(point.invested)}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-sm">
          <span className="text-white/65">Variation</span>
          <span className={point.pnl >= 0 ? "font-semibold text-emerald-400" : "font-semibold text-rose-400"}>
            {point.pnl >= 0 ? "+" : ""}
            {formatEuro(point.pnl)}
          </span>
        </div>
      </div>
    </div>
  )
}

export function DemoPortfolioLineChart({ data }: { data: DemoPoint[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      const nextWidth = container.clientWidth
      if (nextWidth > 0) setWidth(nextWidth)
    }

    update()

    if (typeof ResizeObserver === "undefined") return

    const observer = new ResizeObserver(() => update())
    observer.observe(container)

    return () => observer.disconnect()
  }, [])

  const chartData = useMemo(() => data, [data])
  const isSmooth = chartData.length >= 5
  const curveType = isSmooth ? "monotone" : "linear"
  const showMarkers = chartData.length <= 4
  const min = Math.min(...chartData.map((point) => point.value))
  const max = Math.max(...chartData.map((point) => point.value))
  const padding = Math.max((max - min) * 0.18, 250)

  return (
    <div ref={containerRef} className="h-[290px] w-full">
      {width > 0 ? (
        <AreaChart width={width} height={290} data={chartData} margin={{ top: 18, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="demo-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4c15d" stopOpacity={0.42} />
              <stop offset="72%" stopColor="#f4c15d" stopOpacity={0.06} />
              <stop offset="100%" stopColor="#f4c15d" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="rgba(255,255,255,0.07)" strokeDasharray="3 7" vertical={false} />
          <XAxis
            dataKey="shortLabel"
            tick={{ fill: "rgba(255,255,255,0.50)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[Math.max(0, min - padding), max + padding]}
            tickFormatter={(value) => `${Math.round(value / 1000)}k EUR`}
            tick={{ fill: "rgba(255,255,255,0.50)", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={62}
          />
          <RechartsTooltip content={<DemoTooltip />} cursor={{ stroke: "rgba(244,193,93,0.24)", strokeWidth: 1 }} />
          <Area
            type={curveType}
            dataKey="value"
            stroke="#f4c15d"
            strokeWidth={3}
            fill="url(#demo-chart-fill)"
            dot={showMarkers ? { r: 4, fill: "#f4c15d", strokeWidth: 0 } : false}
            activeDot={{ r: 5, fill: "#fff3d6", stroke: "#f4c15d", strokeWidth: 2 }}
            isAnimationActive
            animationDuration={1200}
          />
        </AreaChart>
      ) : null}
    </div>
  )
}

"use client"

import { memo } from "react"
import { AreaChart, Area } from "recharts"

interface SparklineProps {
  symbol: string
  currentPrice: number
  change24h: number
  sparklineData?: number[]
  width?: number
  height?: number
}

export const SparklineChart = memo(function SparklineChart({
  sparklineData,
  change24h,
  width = 80,
  height = 32,
}: SparklineProps) {
  if (!sparklineData || sparklineData.length < 4) {
    return (
      <div
        style={{
          width: `${width}px`,
          height: `${height}px`,
          minWidth: `${width}px`,
          minHeight: `${height}px`,
        }}
        className="flex items-center justify-center"
      >
        <svg width={width - 4} height={2}>
          <line
            x1="0"
            y1="1"
            x2={width - 4}
            y2="1"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            strokeDasharray="3 2"
          />
        </svg>
      </div>
    )
  }

  const data = sparklineData.map((v) => ({ v }))
  const positive =
    sparklineData[sparklineData.length - 1] >= sparklineData[0]
      ? true
      : change24h >= 0

  const stroke = positive ? "#10B981" : "#EF4444"
  const fill = positive ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)"

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        minWidth: `${width}px`,
        minHeight: `${height}px`,
      }}
    >
      <AreaChart
        width={width}
        height={height}
        data={data}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        <Area
          type="monotone"
          dataKey="v"
          stroke={stroke}
          strokeWidth={1.5}
          fill={fill}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  )
})

import React from "react"
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

const colors = {
  bg: "#060709",
  bgSoft: "#0d1015",
  panel: "rgba(20, 22, 30, 0.78)",
  panelStrong: "rgba(27, 30, 40, 0.92)",
  border: "rgba(255, 255, 255, 0.12)",
  text: "#f8f8f6",
  muted: "rgba(248, 248, 246, 0.64)",
  subtle: "rgba(248, 248, 246, 0.38)",
  gold: "#d4af37",
  goldSoft: "rgba(212, 175, 55, 0.16)",
  green: "#31c48d",
} as const

const allocations = [
  { asset: "BTC", pct: 42, color: "#d4af37" },
  { asset: "ETH", pct: 28, color: "#6b7cff" },
  { asset: "SOL", pct: 14, color: "#9a6bff" },
  { asset: "BNB", pct: 9, color: "#f3d273" },
  { asset: "AVAX", pct: 7, color: "#ff6b6b" },
]

const chartPoints = [
  { x: 0, y: 760 },
  { x: 110, y: 740 },
  { x: 230, y: 705 },
  { x: 360, y: 650 },
  { x: 510, y: 612 },
  { x: 670, y: 575 },
  { x: 835, y: 530 },
  { x: 980, y: 492 },
]

const cardStyle: React.CSSProperties = {
  background: colors.panel,
  border: `1px solid ${colors.border}`,
  borderRadius: 34,
  backdropFilter: "blur(22px)",
  boxShadow: "0 30px 90px rgba(0,0,0,0.34)",
}

const sectionLabel: React.CSSProperties = {
  fontSize: 18,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: colors.subtle,
  fontWeight: 700,
}

const titleStyle: React.CSSProperties = {
  fontSize: 92,
  fontWeight: 700,
  lineHeight: 1.02,
  letterSpacing: 0,
  color: colors.text,
}

const bodyStyle: React.CSSProperties = {
  fontSize: 32,
  lineHeight: 1.55,
  color: colors.muted,
}

const smallLabel: React.CSSProperties = {
  fontSize: 16,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  color: colors.subtle,
  fontWeight: 700,
}

const metricValue: React.CSSProperties = {
  fontSize: 36,
  fontWeight: 700,
  color: colors.text,
}

const metricLabel: React.CSSProperties = {
  fontSize: 17,
  color: colors.subtle,
}

const pillStyle: React.CSSProperties = {
  borderRadius: 999,
  border: `1px solid rgba(212, 175, 55, 0.24)`,
  background: colors.goldSoft,
  color: "#f4e1a0",
  padding: "10px 18px",
  fontWeight: 700,
  fontSize: 18,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
}

const fullDisclaimer =
  "Demo data. Educational showcase only. Crypto assets involve risk and this is not financial advice."

const slideUp = (frame: number, fps: number, delay: number, distance = 40) => {
  const progress = spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 20,
      mass: 0.9,
      stiffness: 120,
    },
  })

  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  }
}

const fadeIn = (frame: number, fps: number, delay: number) => {
  return spring({
    frame: frame - delay,
    fps,
    config: {
      damping: 24,
      stiffness: 120,
      mass: 0.8,
    },
  })
}

const TypingLine: React.FC<{
  text: string
  startFrame: number
  charsPerFrame?: number
  y: number
}> = ({ text, startFrame, charsPerFrame = 1.6, y }) => {
  const frame = useCurrentFrame()
  const visibleChars = Math.max(0, Math.floor((frame - startFrame) * charsPerFrame))
  const shown = text.slice(0, visibleChars)
  const caretVisible = Math.floor(frame / 12) % 2 === 0

  return (
    <div
      style={{
        position: "absolute",
        left: 84,
        right: 84,
        top: y,
        fontSize: 28,
        color: colors.text,
        lineHeight: 1.4,
        fontWeight: 500,
      }}
    >
      {shown}
      {caretVisible ? <span style={{ color: colors.gold }}>|</span> : null}
    </div>
  )
}

const AxiomLogoVideo: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const markSize = compact ? 58 : 76
  const textSize = compact ? 36 : 54

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
      <div
        style={{
          width: markSize,
          height: markSize,
          borderRadius: compact ? 18 : 22,
          background: "#fffdf7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <svg width={compact ? 28 : 36} height={compact ? 28 : 36} viewBox="0 0 16 16" fill="none">
          <path
            d="M3 13L8 3L13 13"
            stroke="#0a0c10"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 9.4H10.5"
            stroke="#0a0c10"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: textSize, fontWeight: 800, color: colors.text }}>Axiom</span>
        <span
          style={{
            ...pillStyle,
            fontSize: compact ? 12 : 16,
            padding: compact ? "6px 10px" : "8px 14px",
            letterSpacing: "0.14em",
          }}
        >
          AI
        </span>
      </div>
    </div>
  )
}

const Background: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const shimmer = interpolate(frame, [0, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at top left, rgba(212,175,55,0.16), transparent 28%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.06), transparent 18%), linear-gradient(180deg, #050607 0%, #090c11 42%, #050608 100%)",
        overflow: "hidden",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.16,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: width * 0.9,
          height: height * 0.6,
          left: width * -0.12 + shimmer * 40,
          top: -height * 0.18,
          background: "radial-gradient(circle, rgba(212,175,55,0.14), rgba(212,175,55,0) 70%)",
          filter: "blur(40px)",
        }}
      />
    </AbsoluteFill>
  )
}

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ padding: "120px 76px 96px" }}>
      <div style={slideUp(frame, fps, 0, 30)}>
        <AxiomLogoVideo />
      </div>
      <div style={{ ...slideUp(frame, fps, 8, 48), marginTop: 72 }}>
        <div style={pillStyle}>AI-powered crypto investing platform</div>
      </div>
      <div style={{ ...slideUp(frame, fps, 14, 60), marginTop: 34 }}>
        <div style={titleStyle}>AI portfolio strategy for calm, structured crypto decisions.</div>
        <div style={{ ...bodyStyle, marginTop: 26 }}>
          Advisor, allocation, portfolio snapshots, and a clean dashboard built for real product demos.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 22,
          marginTop: 72,
          ...slideUp(frame, fps, 22, 42),
        }}
      >
        {[
          ["Analysis time", "~ 1 min"],
          ["Tracked capital", "15 000 EUR"],
          ["Market context", "Updated daily"],
        ].map(([label, value], index) => (
          <div key={label} style={{ ...cardStyle, padding: 28, opacity: fadeIn(frame, fps, 24 + index * 4) }}>
            <div style={metricLabel}>{label}</div>
            <div style={{ ...metricValue, marginTop: 14 }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "auto",
          ...smallLabel,
          opacity: interpolate(frame, [40, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Demo video composition for product presentation
      </div>
    </AbsoluteFill>
  )
}

const QuestionnaireScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const selected1 = frame > 108
  const selected2 = frame > 130
  const ready = frame > 174

  return (
    <AbsoluteFill style={{ padding: "88px 64px 84px" }}>
      <div style={slideUp(frame, fps, 0, 24)}>
        <div style={sectionLabel}>Advisor questionnaire</div>
        <div style={{ ...titleStyle, fontSize: 68, marginTop: 20 }}>Build the investor profile in seconds.</div>
      </div>

      <div style={{ ...cardStyle, marginTop: 42, padding: 32, ...slideUp(frame, fps, 10, 36) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={smallLabel}>Question 7 / 8</div>
            <div style={{ fontSize: 34, fontWeight: 650, color: colors.text, marginTop: 10 }}>
              Investment rhythm and entry strategy
            </div>
          </div>
          <div
            style={{
              width: 210,
              height: 12,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${interpolate(frame, [94, 170], [45, 88], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                })}%`,
                height: "100%",
                background: colors.gold,
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 32 }}>
          <div style={{ ...cardStyle, padding: 24, background: colors.panelStrong }}>
            <div style={{ ...smallLabel, color: "#ecd79a" }}>Investment cadence</div>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {[
                { label: "One-time entry", active: false },
                { label: "Weekly", active: false },
                { label: "Monthly", active: selected1 },
                { label: "Opportunistic", active: false },
              ].map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 22,
                    border: item.active ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`,
                    background: item.active ? colors.goldSoft : "rgba(255,255,255,0.03)",
                    color: item.active ? colors.text : colors.muted,
                    padding: "20px 22px",
                    fontSize: 28,
                    fontWeight: item.active ? 650 : 500,
                    opacity: fadeIn(frame, fps, 18 + index * 3),
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 24, background: colors.panelStrong }}>
            <div style={{ ...smallLabel, color: "#ecd79a" }}>Entry strategy</div>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {[
                { label: "Lump sum", active: false },
                { label: "Monthly DCA", active: selected2 },
                { label: "Weekly DCA", active: false },
              ].map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 22,
                    border: item.active ? `2px solid ${colors.gold}` : `1px solid ${colors.border}`,
                    background: item.active ? colors.goldSoft : "rgba(255,255,255,0.03)",
                    color: item.active ? colors.text : colors.muted,
                    padding: "20px 22px",
                    fontSize: 28,
                    fontWeight: item.active ? 650 : 500,
                    opacity: fadeIn(frame, fps, 30 + index * 3),
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 26 }}>
          {[
            ["Profile", "Moderate"],
            ["Initial capital", "5 000 EUR"],
            ["Monthly DCA", "400 EUR"],
            ["Horizon", "3 to 5 years"],
          ].map(([label, value], index) => (
            <div key={label} style={{ ...cardStyle, padding: 20, opacity: fadeIn(frame, fps, 44 + index * 3) }}>
              <div style={metricLabel}>{label}</div>
              <div style={{ marginTop: 10, color: colors.text, fontSize: 28, fontWeight: 650 }}>{value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            ...cardStyle,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 26px",
            marginTop: 24,
            opacity: fadeIn(frame, fps, 58),
          }}
        >
          <div>
            <div style={{ fontSize: 28, color: colors.text, fontWeight: 650 }}>Primary objective</div>
            <div style={{ ...bodyStyle, fontSize: 24, marginTop: 10 }}>
              Build a long-term portfolio and reduce emotional mistakes with a calmer entry plan.
            </div>
          </div>
          <div
            style={{
              ...pillStyle,
              opacity: ready ? 1 : 0.45,
              transform: `scale(${ready ? 1 : 0.96})`,
              transition: "all 0.2s ease",
            }}
          >
            Ready to analyze
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const AllocationDonut: React.FC = () => {
  return (
    <div
      style={{
        width: 270,
        height: 270,
        borderRadius: "50%",
        background:
          "conic-gradient(#d4af37 0 42%, #6b7cff 42% 70%, #9a6bff 70% 84%, #f3d273 84% 93%, #ff6b6b 93% 100%)",
        position: "relative",
        boxShadow: "0 24px 60px rgba(0,0,0,0.32)",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 46,
          borderRadius: "50%",
          background: "#0b0d12",
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
        }}
      >
        <div style={smallLabel}>BTC</div>
        <div style={{ marginTop: 8, fontSize: 40, fontWeight: 750, color: colors.text }}>42%</div>
      </div>
    </div>
  )
}

const AnalysisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ padding: "88px 64px 84px" }}>
      <div style={slideUp(frame, fps, 0, 24)}>
        <div style={sectionLabel}>AI analysis output</div>
        <div style={{ ...titleStyle, fontSize: 68, marginTop: 20 }}>Turn profile inputs into a clear allocation.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.02fr", gap: 24, marginTop: 42 }}>
        <div style={{ display: "grid", gap: 22 }}>
          <div
            style={{
              ...cardStyle,
              padding: 28,
              background: "rgba(21, 46, 38, 0.78)",
              border: "1px solid rgba(49,196,141,0.24)",
              ...slideUp(frame, fps, 12, 34),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ ...smallLabel, color: "rgba(214,255,240,0.72)" }}>AI score</div>
                <div style={{ fontSize: 76, fontWeight: 760, color: colors.text, marginTop: 10 }}>84</div>
              </div>
              <div
                style={{
                  borderRadius: 999,
                  padding: "10px 16px",
                  fontSize: 18,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  border: "1px solid rgba(255,255,255,0.14)",
                  color: "#d5ffea",
                }}
              >
                Moderate risk
              </div>
            </div>
            <div style={{ ...bodyStyle, fontSize: 25, marginTop: 18 }}>
              The model keeps BTC and ETH as the liquid core and limits the satellite basket to measured upside.
            </div>
          </div>

          <div style={{ ...cardStyle, padding: 28, ...slideUp(frame, fps, 22, 38) }}>
            <div style={{ ...smallLabel, color: "#ecd79a" }}>Main recommendation</div>
            <TypingLine
              startFrame={252}
              y={74}
              text="Enter progressively on BTC and ETH, keep SOL and AVAX as a capped satellite sleeve, and review after the next daily snapshot."
              charsPerFrame={1.25}
            />
            <div style={{ height: 166 }} />
          </div>
        </div>

        <div style={{ ...cardStyle, padding: 28, ...slideUp(frame, fps, 18, 40) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={smallLabel}>Crypto allocation</div>
              <div style={{ ...bodyStyle, fontSize: 23, marginTop: 10 }}>Model portfolio - demo data</div>
            </div>
            <div style={pillStyle}>Demo</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 24, alignItems: "center", marginTop: 26 }}>
            <AllocationDonut />
            <div style={{ display: "grid", gap: 14 }}>
              {allocations.map((item, index) => (
                <div
                  key={item.asset}
                  style={{
                    ...cardStyle,
                    background: colors.panelStrong,
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: fadeIn(frame, fps, 32 + index * 4),
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", background: item.color }} />
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 650, color: colors.text }}>{item.asset}</div>
                      <div style={{ fontSize: 18, color: colors.subtle }}>
                        {item.asset === "BTC"
                          ? "Conviction core"
                          : item.asset === "ETH"
                            ? "Liquid growth"
                            : item.asset === "SOL"
                              ? "Measured beta"
                              : item.asset === "BNB"
                                ? "Yield sleeve"
                                : "Satellite"}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f4e1a0" }}>{item.pct}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const DashboardChart: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = spring({
    frame: frame - 395,
    fps,
    config: {
      damping: 18,
      mass: 0.9,
      stiffness: 80,
    },
  })

  const path = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  const length = 1400
  const dashOffset = interpolate(progress, [0, 1], [length, 0])

  return (
    <div style={{ position: "relative", height: 560, marginTop: 18 }}>
      <svg viewBox="0 0 1000 820" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="line-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(212,175,55,0.26)" />
            <stop offset="80%" stopColor="rgba(212,175,55,0.02)" />
            <stop offset="100%" stopColor="rgba(212,175,55,0)" />
          </linearGradient>
        </defs>
        {[520, 650, 780].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="1000"
            y2={y}
            stroke="rgba(255,255,255,0.08)"
            strokeDasharray="6 14"
          />
        ))}
        <path d={`${path} L 980 820 L 0 820 Z`} fill="url(#line-fill)" opacity={progress} />
        <path
          d={path}
          fill="none"
          stroke={colors.gold}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={length}
          strokeDashoffset={dashOffset}
        />
        {chartPoints.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={6}
            fill={colors.gold}
            opacity={interpolate(progress, [0.4, 1], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
          />
        ))}
      </svg>
    </div>
  )
}

const PortfolioScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <AbsoluteFill style={{ padding: "88px 64px 84px" }}>
      <div style={slideUp(frame, fps, 0, 24)}>
        <div style={sectionLabel}>Portfolio dashboard</div>
        <div style={{ ...titleStyle, fontSize: 68, marginTop: 20 }}>Track capital, snapshots, and action steps.</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginTop: 40 }}>
        {[
          ["Invested capital", "15 000 EUR", "2 analyses + DCA in motion"],
          ["Portfolio value", "18 420 EUR", "+620 EUR over the period"],
          ["Source", "portfolio_history", "Last snapshot 09:12"],
          ["AI read", "Healthy recent variation", "No invented performance"],
        ].map(([label, value, hint], index) => (
          <div key={label} style={{ ...cardStyle, padding: 22, opacity: fadeIn(frame, fps, 8 + index * 4) }}>
            <div style={metricLabel}>{label}</div>
            <div style={{ marginTop: 14, color: colors.text, fontSize: 38, fontWeight: 700 }}>{value}</div>
            <div style={{ marginTop: 10, color: colors.subtle, fontSize: 18 }}>{hint}</div>
          </div>
        ))}
      </div>

      <div style={{ ...cardStyle, padding: 28, marginTop: 24, ...slideUp(frame, fps, 22, 34) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={smallLabel}>Portfolio curve</div>
            <div style={{ ...bodyStyle, fontSize: 23, marginTop: 10 }}>
              Aggregated snapshots only. Demo repricing shown for presentation.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {["1H", "Recent", "7D", "1M", "ALL"].map((label, index) => (
              <div
                key={label}
                style={{
                  borderRadius: 999,
                  padding: "10px 16px",
                  fontSize: 18,
                  fontWeight: 650,
                  color: index === 3 ? "#f4e1a0" : index === 0 ? "rgba(255,255,255,0.28)" : colors.muted,
                  border:
                    index === 3
                      ? `1px solid rgba(212,175,55,0.36)`
                      : `1px solid rgba(255,255,255,${index === 0 ? "0.08" : "0.12"})`,
                  background: index === 3 ? colors.goldSoft : "rgba(255,255,255,0.03)",
                }}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
        <DashboardChart />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16, color: colors.subtle, fontSize: 17 }}>
          <div>The curve grows with your analyses and daily snapshots.</div>
          <div>Demo history only - no real performance shown here.</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 14, marginTop: 24 }}>
        {[
          "Deploy the first 2 500 EUR on BTC and ETH.",
          "Schedule 400 EUR of monthly DCA for the next 90 days.",
          "Review the dashboard after the next snapshot to adjust risk.",
        ].map((step, index) => (
          <div
            key={step}
            style={{
              ...cardStyle,
              padding: "20px 24px",
              display: "flex",
              alignItems: "center",
              gap: 18,
              opacity: fadeIn(frame, fps, 34 + index * 4),
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: "#fffdf7",
                color: "#0b0d12",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
              }}
            >
              {index + 1}
            </div>
            <div style={{ fontSize: 26, color: colors.text, lineHeight: 1.4 }}>{step}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const scale = spring({
    frame,
    fps,
    config: {
      damping: 16,
      stiffness: 80,
      mass: 0.9,
    },
  })

  return (
    <AbsoluteFill style={{ padding: "140px 72px 116px", justifyContent: "space-between" }}>
      <div style={{ ...slideUp(frame, fps, 0, 30), display: "flex", justifyContent: "center" }}>
        <AxiomLogoVideo />
      </div>

      <div style={{ textAlign: "center", ...slideUp(frame, fps, 8, 42) }}>
        <div style={{ ...pillStyle, display: "inline-flex" }}>Axiom AI</div>
        <div style={{ ...titleStyle, fontSize: 94, marginTop: 28 }}>Build a clearer crypto strategy.</div>
        <div style={{ ...bodyStyle, fontSize: 34, marginTop: 26 }}>
          Advisor, allocation, portfolio snapshots, and a dashboard that stays honest.
        </div>
      </div>

      <div
        style={{
          ...cardStyle,
          padding: "26px 34px",
          alignSelf: "center",
          transform: `scale(${interpolate(scale, [0, 1], [0.94, 1])})`,
          opacity: scale,
          width: 760,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 28, color: colors.subtle, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700 }}>
          Call to action
        </div>
        <div style={{ marginTop: 14, fontSize: 40, color: colors.text, fontWeight: 700 }}>
          Launch your first analysis on axiom-trade.dev
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 18, color: colors.subtle }}>{fullDisclaimer}</div>
    </AbsoluteFill>
  )
}

export const AxiomShortVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <Sequence from={0} durationInFrames={90}>
        <IntroScene />
      </Sequence>
      <Sequence from={90} durationInFrames={150}>
        <QuestionnaireScene />
      </Sequence>
      <Sequence from={240} durationInFrames={150}>
        <AnalysisScene />
      </Sequence>
      <Sequence from={390} durationInFrames={120}>
        <PortfolioScene />
      </Sequence>
      <Sequence from={510} durationInFrames={90}>
        <FinalScene />
      </Sequence>
    </AbsoluteFill>
  )
}

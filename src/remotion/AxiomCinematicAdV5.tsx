import React from "react"
import {
  AbsoluteFill,
  Audio,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

type AxiomCinematicAdV5Props = {
  hasMusic?: boolean
}

const colors = {
  bg: "#040506",
  bgSoft: "#090c10",
  panel: "rgba(15, 18, 24, 0.74)",
  panelStrong: "rgba(16, 19, 28, 0.9)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.06)",
  text: "#f7f4ed",
  muted: "rgba(247,244,237,0.72)",
  subtle: "rgba(247,244,237,0.4)",
  gold: "#d8b55a",
  goldGlow: "rgba(216,181,90,0.22)",
  red: "#ff5a67",
  redGlow: "rgba(255,90,103,0.24)",
  blue: "#7f8cff",
  purple: "#ab88ff",
  green: "#30c48d",
} as const

const beatFrames = [0, 18, 36, 60, 84, 114, 150, 186, 228, 270, 330, 390, 480]

const hookPoints = [
  [0, 72],
  [10, 68],
  [18, 70],
  [28, 63],
  [38, 58],
  [50, 50],
  [62, 40],
  [76, 30],
  [90, 20],
] as const

const portfolioPoints = [
  [0, 63],
  [10, 62],
  [22, 58],
  [34, 56],
  [48, 50],
  [62, 47],
  [76, 42],
  [90, 35],
  [100, 28],
] as const

const donutSegments = [
  { label: "BTC", pct: 46, color: colors.gold },
  { label: "ETH", pct: 24, color: colors.blue },
  { label: "SOL", pct: 14, color: colors.purple },
  { label: "BNB", pct: 9, color: "#efd98b" },
  { label: "USDC", pct: 7, color: colors.green },
] as const

const pricingPlans = [
  { name: "Free", price: "0 EUR", meta: "Pour commencer" },
  { name: "Pro", price: "24.99 EUR", meta: "Le plus populaire" },
  { name: "Premium", price: "59.99 EUR", meta: "Recherche avancee" },
] as const

const easePremium = Easing.bezier(0.16, 1, 0.3, 1)

const beatPulse = (frame: number, cueFrame: number, spread = 10) =>
  interpolate(frame, [cueFrame - spread, cueFrame, cueFrame + spread], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

const beatEnergy = (frame: number) =>
  Math.min(1, beatFrames.reduce((max, cue) => Math.max(max, beatPulse(frame, cue, 10)), 0))

const rangeProgress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easePremium,
  })

const springIn = (frame: number, fps: number, delay: number, duration = 22) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: duration,
    config: {
      damping: 200,
      stiffness: 150,
      mass: 1.05,
    },
  })

const sceneVisibility = (frame: number, durationInFrames: number) => {
  const fadeIn = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const fadeOut = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  return Math.min(fadeIn, fadeOut)
}

const chartPath = (points: readonly (readonly [number, number])[]) =>
  points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ")

const GlassCard: React.FC<{
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ children, style }) => (
  <div
    style={{
      borderRadius: 34,
      border: `1px solid ${colors.border}`,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 22%, rgba(6,8,10,0.34) 100%)",
      backdropFilter: "blur(28px)",
      boxShadow: "0 24px 80px rgba(0,0,0,0.42)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
)

const AxiomMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const size = compact ? 50 : 70
  const glyph = compact ? 22 : 30

  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 18 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: compact ? 18 : 24,
          background: "linear-gradient(180deg, #fffdf7 0%, #e7d4a6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 14px 30px rgba(0,0,0,0.26)",
        }}
      >
        <div
          style={{
            width: glyph,
            height: glyph,
            clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
            background: "linear-gradient(180deg, #111315 0%, #242830 100%)",
          }}
        />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: compact ? 2 : 4 }}>
        <span
          style={{
            fontSize: compact ? 13 : 14,
            textTransform: "uppercase",
            letterSpacing: "0.28em",
            fontWeight: 700,
            color: colors.subtle,
          }}
        >
          Axiom
        </span>
        <span
          style={{
            fontSize: compact ? 28 : 40,
            fontWeight: 780,
            color: colors.text,
            lineHeight: 0.92,
          }}
        >
          AI
        </span>
      </div>
    </div>
  )
}

const Background: React.FC<{ frame: number }> = ({ frame }) => {
  const energy = beatEnergy(frame)
  const goldShift = interpolate(frame, [0, 540], [-90, 90], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const blueShift = interpolate(frame, [0, 540], [60, -120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${colors.bg} 0%, #07080b 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${22 + goldShift / 18}% 18%, rgba(216,181,90,0.22), transparent 42%)`,
          opacity: 0.95,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${74 + blueShift / 20}% 22%, rgba(127,140,255,0.16), transparent 40%)`,
          opacity: 0.84,
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle at 54% 68%, rgba(255,90,103,0.14), transparent 34%)",
          opacity: 0.82,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.16,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          transform: `translateY(${interpolate(frame, [0, 540], [0, 40])}px)`,
        }}
      />
      {Array.from({ length: 12 }).map((_, index) => {
        const size = 2 + (index % 4)
        const baseX = 8 + ((index * 11) % 80)
        const baseY = 10 + ((index * 15) % 74)
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: 999,
              background: index % 3 === 0 ? colors.gold : "rgba(255,255,255,0.7)",
              left: `${baseX}%`,
              top: `${baseY}%`,
              opacity: 0.12 + energy * 0.12,
              transform: `translate3d(0, ${interpolate(frame + index * 8, [0, 540], [0, -30 - index * 2])}px, 0) scale(${1 + energy * 0.28})`,
              boxShadow:
                index % 3 === 0
                  ? `0 0 ${8 + energy * 12}px rgba(216,181,90,0.24)`
                  : "0 0 6px rgba(255,255,255,0.12)",
            }}
          />
        )
      })}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 14%, transparent 86%, rgba(255,255,255,0.06) 100%)",
          mixBlendMode: "soft-light",
          opacity: 0.38,
        }}
      />
    </AbsoluteFill>
  )
}

const CaptionBlock: React.FC<{
  kicker?: string
  lines: string[]
  align?: "left" | "center"
  width?: number
}> = ({ kicker, lines, align = "left", width = 720 }) => (
  <div
    style={{
      width,
      display: "flex",
      flexDirection: "column",
      gap: 14,
      alignItems: align === "center" ? "center" : "flex-start",
      textAlign: align,
    }}
  >
    {kicker ? (
      <div
        style={{
          padding: "10px 18px",
          borderRadius: 999,
          border: `1px solid ${colors.border}`,
          background: "rgba(7,9,12,0.62)",
          color: colors.subtle,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          fontWeight: 700,
          fontSize: 18,
          backdropFilter: "blur(14px)",
        }}
      >
        {kicker}
      </div>
    ) : null}
    {lines.map((line, index) => (
      <div
        key={`${line}-${index}`}
        style={{
          fontSize: lines.length > 1 && index > 0 ? 72 : 94,
          lineHeight: 0.92,
          fontWeight: 800,
          color: colors.text,
          letterSpacing: 0,
          textShadow: "0 18px 54px rgba(0,0,0,0.42)",
        }}
      >
        {line}
      </div>
    ))}
  </div>
)

const MiniScreenHeader: React.FC<{ label: string; meta: string }> = ({ label, meta }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "20px 24px 0",
      color: colors.subtle,
      fontSize: 15,
      letterSpacing: "0.14em",
      textTransform: "uppercase",
      fontWeight: 700,
    }}
  >
    <span>{label}</span>
    <span>{meta}</span>
  </div>
)

const GlowLineChart: React.FC<{
  points: readonly (readonly [number, number])[]
  color: string
  frame: number
  duration: number
}> = ({ points, color, frame, duration }) => {
  const path = chartPath(points)
  const progress = rangeProgress(frame, 0, duration)

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <path
          d={path}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - progress}
          style={{ filter: `drop-shadow(0 0 16px ${color})` }}
        />
      </svg>
    </div>
  )
}

const HookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const visibility = sceneVisibility(frame, 60)
  const energy = beatEnergy(frame)
  const cameraScale = interpolate(frame, [0, 60], [1.08, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const cameraX = interpolate(frame, [0, 60], [-24, 16], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill
      style={{
        opacity: visibility,
        transform: `translate3d(${cameraX}px, 0, 0) scale(${cameraScale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 90,
          display: "grid",
          gridTemplateColumns: "1.06fr 0.94fr",
          gap: 24,
        }}
      >
        <GlassCard
          style={{
            padding: 30,
            background: "linear-gradient(180deg, rgba(24,11,13,0.84) 0%, rgba(15,12,15,0.90) 100%)",
            boxShadow: `0 40px 120px rgba(0,0,0,0.56), 0 0 ${60 + energy * 34}px rgba(255,90,103,0.12)`,
          }}
        >
          <MiniScreenHeader label="market shock" meta="-14.2%" />
          <div style={{ height: 1040, marginTop: 18 }}>
            <GlowLineChart points={hookPoints} color={colors.red} frame={frame} duration={42} />
          </div>
        </GlassCard>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            paddingTop: 80,
            paddingBottom: 90,
          }}
        >
          <CaptionBlock lines={["Tu achetes", "tes cryptos", "au hasard ?"]} />
          <div
            style={{
              alignSelf: "flex-start",
              padding: "14px 18px",
              borderRadius: 22,
              background: "rgba(255,90,103,0.14)",
              border: "1px solid rgba(255,90,103,0.24)",
              color: colors.red,
              fontSize: 22,
              fontWeight: 700,
            }}
          >
            Gros risque. Peu de plan.
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const StopScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sceneVisibility(frame, 90)
  const shock = beatEnergy(frame + 60)
  const stopIn = springIn(frame, fps, 0, 18)

  return (
    <AbsoluteFill style={{ opacity: visibility }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, rgba(255,90,103,${0.12 + shock * 0.18}), transparent 34%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 88,
          display: "grid",
          gridTemplateColumns: "0.8fr 1.2fr",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 360,
            height: 360,
            borderRadius: 999,
            border: "1px solid rgba(255,90,103,0.28)",
            background: "radial-gradient(circle at 50% 50%, rgba(255,90,103,0.22), rgba(255,90,103,0.06) 58%, transparent 74%)",
            boxShadow: "0 0 60px rgba(255,90,103,0.16)",
            transform: `scale(${0.9 + stopIn * 0.1 + shock * 0.04})`,
          }}
        >
          <div style={{ fontSize: 116, fontWeight: 820, color: colors.text, letterSpacing: 0 }}>Stop.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <CaptionBlock kicker="Switch" lines={["Passe a", "une vraie methode."]} width={600} />
          <GlassCard style={{ padding: 22 }}>
            <MiniScreenHeader label="axiom ai" meta="structured flow" />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                marginTop: 18,
              }}
            >
              {["profil", "analyse", "plan"].map((step, index) => (
                <div
                  key={step}
                  style={{
                    padding: "18px 16px",
                    borderRadius: 22,
                    background: index === 1 ? colors.goldGlow : "rgba(255,255,255,0.04)",
                    border:
                      index === 1 ? "1px solid rgba(216,181,90,0.22)" : `1px solid ${colors.borderSoft}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    etape
                  </div>
                  <div style={{ marginTop: 8, fontSize: 28, fontWeight: 780, color: colors.text }}>{step}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const AdvisorScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sceneVisibility(frame, 120)
  const scan = interpolate(frame, [0, 120], [-120, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ opacity: visibility, transform: `scale(${interpolate(frame, [0, 120], [1.02, 1.10])})` }}>
      <div
        style={{
          position: "absolute",
          inset: 88,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 24,
        }}
      >
        <GlassCard style={{ padding: 28, position: "relative" }}>
          <MiniScreenHeader label="advisor" meta="questionnaire" />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: scan,
              height: 110,
              background:
                "linear-gradient(180deg, transparent 0%, rgba(216,181,90,0.08) 32%, rgba(216,181,90,0.20) 50%, rgba(216,181,90,0.08) 72%, transparent 100%)",
              mixBlendMode: "screen",
              opacity: 0.84,
            }}
          />
          <div style={{ padding: "22px 24px 0" }}>
            <div style={{ fontSize: 18, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Axiom AI analyse ton profil
            </div>
            <div style={{ marginTop: 10, fontSize: 54, fontWeight: 800, color: colors.text, lineHeight: 0.94 }}>
              Budget, risque, objectif.
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, padding: "26px 24px 0" }}>
            {[
              { label: "Budget", value: "1 000 EUR" },
              { label: "Risque", value: "Equilibre" },
              { label: "Objectif", value: "Croissance" },
            ].map((metric, index) => {
              const entered = springIn(frame, fps, 10 + index * 6, 18)
              return (
                <div
                  key={metric.label}
                  style={{
                    padding: "18px 16px",
                    borderRadius: 22,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${colors.borderSoft}`,
                    opacity: entered,
                    transform: `translateY(${interpolate(entered, [0, 1], [14, 0])}px)`,
                  }}
                >
                  <div style={{ fontSize: 14, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {metric.label}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 28, fontWeight: 760, color: colors.text }}>{metric.value}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "18px 24px 24px", flexWrap: "wrap" }}>
            {["Horizon 5 ans", "DCA", "BTC/ETH coeur"].map((tag, index) => (
              <div
                key={tag}
                style={{
                  padding: "10px 16px",
                  borderRadius: 999,
                  border: `1px solid ${index === 1 ? "rgba(216,181,90,0.22)" : colors.borderSoft}`,
                  background: index === 1 ? colors.goldGlow : "rgba(255,255,255,0.03)",
                  color: index === 1 ? "#f5e1aa" : colors.muted,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {tag}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 24 }}>
          <MiniScreenHeader label="processing" meta="ai" />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 30 }}>
            <div
              style={{
                width: 260,
                height: 260,
                borderRadius: 999,
                border: "1px solid rgba(216,181,90,0.24)",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(216,181,90,0.16) 0%, rgba(127,140,255,0.10) 38%, transparent 74%)",
                boxShadow: "0 0 70px rgba(216,181,90,0.12)",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 26,
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.10)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  left: 24,
                  right: 24,
                  top: "50%",
                  height: 3,
                  background: "linear-gradient(90deg, transparent, rgba(216,181,90,0.82), transparent)",
                  transform: `translateY(${interpolate(frame, [0, 120], [-94, 94])}px)`,
                  boxShadow: "0 0 18px rgba(216,181,90,0.34)",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {["Profil", "Allocation", "Suivi"].map((line, index) => (
              <div
                key={line}
                style={{
                  padding: "16px 18px",
                  borderRadius: 22,
                  background: index === 1 ? colors.goldGlow : "rgba(255,255,255,0.04)",
                  border:
                    index === 1 ? "1px solid rgba(216,181,90,0.22)" : `1px solid ${colors.borderSoft}`,
                  color: index === 1 ? "#f5e1aa" : colors.text,
                  fontSize: 20,
                  fontWeight: 680,
                }}
              >
                {line}
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  )
}

const ResultScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sceneVisibility(frame, 120)

  return (
    <AbsoluteFill style={{ opacity: visibility, transform: `scale(${interpolate(frame, [0, 120], [1.03, 1.08])})` }}>
      <div
        style={{
          position: "absolute",
          inset: 88,
          display: "grid",
          gridTemplateColumns: "0.88fr 1.12fr",
          gap: 24,
        }}
      >
        <GlassCard style={{ padding: 28 }}>
          <MiniScreenHeader label="allocation" meta="claire" />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
            <div
              style={{
                width: 300,
                height: 300,
                borderRadius: 999,
                background: `conic-gradient(${donutSegments
                  .map((segment, index) => {
                    const start = donutSegments
                      .slice(0, index)
                      .reduce((sum, current) => sum + current.pct, 0)
                    return `${segment.color} ${start}% ${start + segment.pct}%`
                  })
                  .join(", ")})`,
                position: "relative",
                boxShadow: "0 0 44px rgba(216,181,90,0.14)",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 62,
                  borderRadius: 999,
                  background: "rgba(8,10,14,0.98)",
                  border: `1px solid ${colors.borderSoft}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 14, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.16em" }}>
                  Allocation
                </div>
                <div style={{ fontSize: 40, fontWeight: 800, color: colors.text }}>Optimisee</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 26 }}>
            {donutSegments.map((segment, index) => {
              const entered = springIn(frame, fps, 12 + index * 5, 18)
              return (
                <div
                  key={segment.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 16px",
                    borderRadius: 20,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${colors.borderSoft}`,
                    opacity: entered,
                    transform: `translateX(${interpolate(entered, [0, 1], [18, 0])}px)`,
                  }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: 999, background: segment.color }} />
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.text }}>{segment.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: colors.muted }}>{segment.pct}%</div>
                </div>
              )
            })}
          </div>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateRows: "0.58fr 0.42fr", gap: 24 }}>
          <GlassCard style={{ padding: 28 }}>
            <MiniScreenHeader label="plan d'action" meta="simple" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
              {[
                "Allocation",
                "Plan d'action",
                "Suivi",
              ].map((step, index) => (
                <div
                  key={step}
                  style={{
                    padding: "18px 16px",
                    borderRadius: 22,
                    background: index === 1 ? colors.goldGlow : "rgba(255,255,255,0.04)",
                    border:
                      index === 1 ? "1px solid rgba(216,181,90,0.22)" : `1px solid ${colors.borderSoft}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    bloc
                  </div>
                  <div style={{ marginTop: 10, fontSize: 28, fontWeight: 780, color: colors.text }}>{step}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
              {[
                "BTC/ETH comme coeur de portefeuille",
                "Satellites limites et tailles bornees",
                "DCA et revue apres snapshots quotidiens",
              ].map((line) => (
                <div
                  key={line}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 18,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${colors.borderSoft}`,
                    color: colors.text,
                    fontSize: 18,
                    fontWeight: 560,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 24 }}>
            <MiniScreenHeader label="courbe" meta="suivi" />
            <div style={{ height: 210, marginTop: 20 }}>
              <GlowLineChart points={portfolioPoints} color={colors.gold} frame={frame + 18} duration={64} />
            </div>
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const ProofScene: React.FC = () => {
  const frame = useCurrentFrame()
  const visibility = sceneVisibility(frame, 90)

  return (
    <AbsoluteFill style={{ opacity: visibility, transform: `scale(${interpolate(frame, [0, 90], [1.02, 1.08])})` }}>
      <div
        style={{
          position: "absolute",
          inset: 90,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 24,
        }}
      >
        <GlassCard style={{ padding: 28 }}>
          <MiniScreenHeader label="dashboard" meta="tout est structure" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
            {[
              { label: "Capital", value: "2 000 EUR" },
              { label: "Valeur", value: "2 236 EUR" },
              { label: "Source", value: "history" },
            ].map((metric, index) => (
              <div
                key={metric.label}
                style={{
                  padding: "16px 14px",
                  borderRadius: 20,
                  background: index === 2 ? colors.goldGlow : "rgba(255,255,255,0.04)",
                  border:
                    index === 2 ? "1px solid rgba(216,181,90,0.22)" : `1px solid ${colors.borderSoft}`,
                }}
              >
                <div style={{ fontSize: 13, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                  {metric.label}
                </div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 760, color: colors.text }}>{metric.value}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 340, marginTop: 18 }}>
            <GlowLineChart points={portfolioPoints} color={colors.gold} frame={frame + 18} duration={54} />
          </div>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateRows: "0.54fr 0.46fr", gap: 24 }}>
          <GlassCard style={{ padding: 24 }}>
            <MiniScreenHeader label="chat ia" meta="follow-up" />
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 18 }}>
              {[
                { role: "user", text: "Je garde mon DCA ?" },
                { role: "ai", text: "Oui. BTC/ETH stable, satellites sous 25%." },
                { role: "user", text: "Prochaine etape ?" },
                { role: "ai", text: "Reviens apres le prochain snapshot quotidien." },
              ].map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                    maxWidth: "82%",
                    padding: "14px 16px",
                    borderRadius: 20,
                    background: message.role === "user" ? colors.goldGlow : "rgba(255,255,255,0.05)",
                    border:
                      message.role === "user"
                        ? "1px solid rgba(216,181,90,0.22)"
                        : `1px solid ${colors.borderSoft}`,
                    color: message.role === "user" ? "#f7e5b5" : colors.text,
                    fontSize: 17,
                    lineHeight: 1.34,
                  }}
                >
                  {message.text}
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 24 }}>
            <MiniScreenHeader label="pricing" meta="gratuit" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 18 }}>
              {pricingPlans.map((plan, index) => (
                <div
                  key={plan.name}
                  style={{
                    padding: "16px 14px",
                    borderRadius: 22,
                    background: index === 0 ? colors.goldGlow : "rgba(255,255,255,0.04)",
                    border:
                      index === 0 ? "1px solid rgba(216,181,90,0.22)" : `1px solid ${colors.borderSoft}`,
                  }}
                >
                  <div style={{ fontSize: 14, color: index === 0 ? "#f5e1aa" : colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {plan.name}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 26, fontWeight: 780, color: colors.text }}>{plan.price}</div>
                  <div style={{ marginTop: 8, fontSize: 14, color: colors.muted, lineHeight: 1.32 }}>{plan.meta}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sceneVisibility(frame, 60)
  const intro = springIn(frame, fps, 0, 20)

  return (
    <AbsoluteFill style={{ opacity: visibility }}>
      <div
        style={{
          position: "absolute",
          inset: 110,
          borderRadius: 48,
          border: `1px solid ${colors.border}`,
          background: "rgba(10,13,18,0.46)",
          transform: `scale(${interpolate(frame, [0, 60], [0.96, 1.04])})`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(216,181,90,0.16) 0%, transparent 28%, rgba(127,140,255,0.16) 100%)",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          transform: `translateY(${interpolate(intro, [0, 1], [20, 0])}px) scale(${0.96 + intro * 0.04})`,
        }}
      >
        <AxiomMark />
        <div style={{ fontSize: 108, fontWeight: 800, color: colors.text, lineHeight: 0.9 }}>Axiom AI</div>
        <div style={{ fontSize: 40, color: colors.muted, fontWeight: 600 }}>Gratuit pour commencer</div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          bottom: 58,
          textAlign: "center",
          fontSize: 16,
          fontWeight: 500,
          color: colors.subtle,
          lineHeight: 1.4,
        }}
      >
        Pas un conseil financier. Risque de perte en capital.
      </div>
    </AbsoluteFill>
  )
}

export const AxiomCinematicAdV5: React.FC<AxiomCinematicAdV5Props> = ({ hasMusic = false }) => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: colors.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      {hasMusic ? <Audio src={staticFile("audio/music.mp3")} volume={0.18} /> : null}
      <Background frame={frame} />
      <Sequence from={0} durationInFrames={60}>
        <HookScene />
      </Sequence>
      <Sequence from={60} durationInFrames={90}>
        <StopScene />
      </Sequence>
      <Sequence from={150} durationInFrames={120}>
        <AdvisorScene />
      </Sequence>
      <Sequence from={270} durationInFrames={120}>
        <ResultScene />
      </Sequence>
      <Sequence from={390} durationInFrames={90}>
        <ProofScene />
      </Sequence>
      <Sequence from={480} durationInFrames={60}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  )
}

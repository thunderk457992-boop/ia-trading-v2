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

type AxiomCinematicAdV4Props = {
  hasMusic?: boolean
  hasVoiceover?: boolean
}

const colors = {
  bg: "#040506",
  bgSoft: "#090c10",
  panel: "rgba(16, 18, 24, 0.74)",
  panelStrong: "rgba(17, 19, 28, 0.92)",
  border: "rgba(255,255,255,0.12)",
  borderSoft: "rgba(255,255,255,0.06)",
  text: "#f7f4ed",
  muted: "rgba(247,244,237,0.72)",
  subtle: "rgba(247,244,237,0.42)",
  gold: "#d8b55a",
  goldGlow: "rgba(216,181,90,0.24)",
  red: "#ff5a67",
  redGlow: "rgba(255,90,103,0.28)",
  blue: "#7f8cff",
  purple: "#ab88ff",
  green: "#30c48d",
} as const

const beatFrames = [0, 18, 36, 60, 84, 114, 150, 186, 228, 270, 330, 390, 480, 600, 690]

const captionTimeline = [
  { start: 0, end: 90, kicker: "Hook", text: "Tu investis encore au feeling ?" },
  { start: 90, end: 210, kicker: "Probleme", text: "Sans plan. Sans methode." },
  { start: 210, end: 390, kicker: "Solution", text: "Axiom AI analyse ton profil" },
  { start: 390, end: 540, kicker: "Resultat", text: "Un plan crypto clair" },
  { start: 540, end: 660, kicker: "Produit", text: "Dashboard, chat IA, pricing gratuit" },
  { start: 660, end: 720, kicker: "CTA", text: "Axiom AI" },
]

const hookPoints = [
  [0, 72],
  [12, 66],
  [24, 70],
  [36, 64],
  [48, 56],
  [60, 52],
  [72, 44],
  [84, 32],
  [100, 18],
] as const

const portfolioPoints = [
  [0, 62],
  [10, 64],
  [22, 60],
  [34, 58],
  [48, 54],
  [62, 49],
  [76, 44],
  [88, 36],
  [100, 30],
] as const

const donutSegments = [
  { label: "BTC", pct: 44, color: colors.gold },
  { label: "ETH", pct: 26, color: colors.blue },
  { label: "SOL", pct: 14, color: colors.purple },
  { label: "BNB", pct: 9, color: "#efd98b" },
  { label: "USDC", pct: 7, color: colors.green },
] as const

const chaosRows = [
  { asset: "BTC", change: "-7.8%" },
  { asset: "ETH", change: "-9.4%" },
  { asset: "SOL", change: "-12.6%" },
  { asset: "ALT", change: "-16.1%" },
] as const

const pricingPlans = [
  { name: "Free", price: "0 EUR", meta: "Commencer" },
  { name: "Pro", price: "24.99 EUR", meta: "Le plus populaire" },
  { name: "Premium", price: "59.99 EUR", meta: "Recherche avancee" },
] as const

const formatCurrency = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
})

const easePremium = Easing.bezier(0.16, 1, 0.3, 1)

const rangeProgress = (frame: number, start: number, end: number) =>
  interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easePremium,
  })

const pulseAt = (frame: number, cueFrame: number, spread = 10) =>
  interpolate(frame, [cueFrame - spread, cueFrame, cueFrame + spread], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

const beatEnergy = (frame: number) =>
  Math.min(
    1,
    beatFrames.reduce((max, cueFrame) => Math.max(max, pulseAt(frame, cueFrame, 10)), 0)
  )

const springIn = (frame: number, fps: number, delay: number, duration = 26) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: duration,
    config: {
      damping: 200,
      stiffness: 150,
      mass: 1.06,
    },
  })

const sequenceVisibility = (frame: number, durationInFrames: number) => {
  const fadeIn = interpolate(frame, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const fadeOut = interpolate(frame, [durationInFrames - 14, durationInFrames], [1, 0], {
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
      borderRadius: 38,
      border: `1px solid ${colors.border}`,
      background:
        "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 22%, rgba(6,8,10,0.32) 100%)",
      backdropFilter: "blur(28px)",
      boxShadow: "0 24px 90px rgba(0,0,0,0.42)",
      overflow: "hidden",
      ...style,
    }}
  >
    {children}
  </div>
)

const AxiomMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const size = compact ? 52 : 72
  const glyph = compact ? 22 : 31

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
  const goldShift = interpolate(frame, [0, 720], [-120, 120], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const blueShift = interpolate(frame, [0, 720], [80, -140], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const redGlow = interpolate(frame, [0, 210], [1, 0.24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${colors.bg} 0%, #07080b 100%)` }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${22 + goldShift / 18}% 18%, rgba(216,181,90,0.24), transparent 44%)`,
          opacity: 0.95,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${74 + blueShift / 26}% 22%, rgba(127,140,255,0.18), transparent 42%)`,
          opacity: 0.88,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 56% 66%, rgba(255,90,103,${0.12 + redGlow * 0.16}), transparent 38%)`,
          opacity: 0.88,
        }}
      />
      <AbsoluteFill
        style={{
          opacity: 0.18,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          transform: `translateY(${interpolate(frame, [0, 720], [0, 50])}px)`,
        }}
      />
      {Array.from({ length: 14 }).map((_, index) => {
        const size = 2 + (index % 4)
        const baseX = 6 + ((index * 13) % 84)
        const baseY = 8 + ((index * 17) % 76)
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
              opacity: 0.14 + ((index % 5) * 0.04 + energy * 0.12),
              transform: `translate3d(0, ${interpolate(frame + index * 9, [0, 720], [0, -40 - index * 2])}px, 0) scale(${1 + energy * 0.32})`,
              boxShadow:
                index % 3 === 0
                  ? `0 0 ${10 + energy * 18}px rgba(216,181,90,0.28)`
                  : "0 0 6px rgba(255,255,255,0.14)",
            }}
          />
        )
      })}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 16%, transparent 84%, rgba(255,255,255,0.06) 100%)",
          mixBlendMode: "soft-light",
          opacity: 0.42,
        }}
      />
    </AbsoluteFill>
  )
}

const CaptionOverlay: React.FC<{ frame: number }> = ({ frame }) => {
  const current =
    captionTimeline.find((caption) => frame >= caption.start && frame < caption.end) ?? captionTimeline[0]
  const localFrame = frame - current.start
  const inProgress = springIn(localFrame, 30, 0, 24)
  const energy = beatEnergy(frame)

  return (
    <div
      style={{
        position: "absolute",
        left: 80,
        right: 80,
        bottom: 110,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        pointerEvents: "none",
        opacity: sequenceVisibility(localFrame, current.end - current.start),
        transform: `translateY(${interpolate(inProgress, [0, 1], [24, 0])}px)`,
      }}
    >
      <div
        style={{
          alignSelf: "flex-start",
          padding: "10px 18px",
          borderRadius: 999,
          border: `1px solid rgba(255,255,255,0.12)`,
          background: "rgba(7,9,12,0.62)",
          color: colors.subtle,
          textTransform: "uppercase",
          letterSpacing: "0.20em",
          fontWeight: 700,
          fontSize: 18,
          backdropFilter: "blur(16px)",
        }}
      >
        {current.kicker}
      </div>
      <div
        style={{
          maxWidth: 760,
          fontSize: current.kicker === "CTA" ? 92 : 106,
          lineHeight: 0.92,
          fontWeight: 800,
          color: colors.text,
          letterSpacing: 0,
          textShadow: "0 18px 60px rgba(0,0,0,0.44)",
          transform: `scale(${1 + energy * 0.03})`,
        }}
      >
        {current.text}
      </div>
    </div>
  )
}

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
  valueLabel?: string
}> = ({ points, color, frame, duration, valueLabel }) => {
  const path = chartPath(points)
  const progress = rangeProgress(frame, 0, duration)

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id={`gradient-${color.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="1" />
          </linearGradient>
        </defs>
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
      {valueLabel ? (
        <div
          style={{
            position: "absolute",
            left: 20,
            bottom: 18,
            fontSize: 18,
            fontWeight: 700,
            color,
            letterSpacing: "0.08em",
          }}
        >
          {valueLabel}
        </div>
      ) : null}
    </div>
  )
}

const HookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sequenceVisibility(frame, 90)
  const energy = beatEnergy(frame)
  const cameraScale = interpolate(frame, [0, 90], [1.06, 1.18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const cameraX = interpolate(frame, [0, 90], [-34, 22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const cameraY = interpolate(frame, [0, 90], [14, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const badgeIn = springIn(frame, fps, 4, 22)

  return (
    <AbsoluteFill
      style={{
        opacity: visibility,
        transform: `translate3d(${cameraX}px, ${cameraY}px, 0) scale(${cameraScale})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 90,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 26,
        }}
      >
        <GlassCard
          style={{
            padding: 30,
            background: "linear-gradient(180deg, rgba(24,11,13,0.84) 0%, rgba(15,12,15,0.88) 100%)",
            boxShadow: `0 40px 120px rgba(0,0,0,0.56), 0 0 ${60 + energy * 40}px rgba(255,90,103,0.12)`,
          }}
        >
          <MiniScreenHeader label="portfolio shock" meta="-12.8%" />
          <div style={{ display: "flex", justifyContent: "space-between", padding: "18px 24px 0" }}>
            <div>
              <div style={{ fontSize: 20, color: colors.subtle, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                exposition emotionnelle
              </div>
              <div style={{ marginTop: 12, fontSize: 86, fontWeight: 800, color: colors.text, lineHeight: 0.94 }}>
                {formatCurrency.format(10842)}
              </div>
            </div>
            <div
              style={{
                alignSelf: "flex-start",
                padding: "12px 16px",
                borderRadius: 20,
                background: "rgba(255,90,103,0.14)",
                border: "1px solid rgba(255,90,103,0.28)",
                color: colors.red,
                fontSize: 18,
                fontWeight: 700,
                transform: `scale(${0.9 + badgeIn * 0.1 + energy * 0.02})`,
              }}
            >
              drawdown brutal
            </div>
          </div>
          <div style={{ flex: 1, height: 860, marginTop: 22 }}>
            <GlowLineChart points={hookPoints} color={colors.red} frame={frame} duration={64} valueLabel="-18.4%" />
          </div>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateRows: "1fr auto", gap: 24 }}>
          <GlassCard
            style={{
              padding: 24,
              background: "linear-gradient(180deg, rgba(21,17,20,0.88) 0%, rgba(14,14,16,0.92) 100%)",
            }}
          >
            <MiniScreenHeader label="market tape" meta="panic mode" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 22 }}>
              {chaosRows.map((row, index) => {
                const enter = springIn(frame, fps, 8 + index * 5, 24)
                return (
                  <div
                    key={row.asset}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "18px 20px",
                      borderRadius: 24,
                      background: "rgba(255,255,255,0.03)",
                      border: `1px solid ${colors.borderSoft}`,
                      transform: `translateX(${interpolate(enter, [0, 1], [40, 0])}px)`,
                      opacity: enter,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span style={{ fontSize: 24, fontWeight: 700, color: colors.text }}>{row.asset}</span>
                      <span style={{ fontSize: 15, color: colors.subtle }}>exposition non structuree</span>
                    </div>
                    <span style={{ fontSize: 24, fontWeight: 700, color: colors.red }}>{row.change}</span>
                  </div>
                )
              })}
            </div>
          </GlassCard>
          <GlassCard
            style={{
              padding: 26,
              minHeight: 240,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ fontSize: 20, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.16em" }}>
              aucun garde-fou
            </div>
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {["FOMO", "entrées tardives", "trop d'altcoins"].map((pill) => (
                <div
                  key={pill}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.04)",
                    color: colors.muted,
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {pill}
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 52% 50%, rgba(255,90,103,${0.08 + energy * 0.12}), transparent 40%)`,
          opacity: 0.9,
        }}
      />
    </AbsoluteFill>
  )
}

const ProblemScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sequenceVisibility(frame, 120)
  const pan = interpolate(frame, [0, 120], [42, -24], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const tilt = interpolate(frame, [0, 120], [2.6, -1.4], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill
      style={{
        opacity: visibility,
        transform: `translate3d(${pan}px, -6px, 0) rotate(${tilt}deg) scale(1.06)`,
      }}
    >
      <div style={{ position: "absolute", inset: 104, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <GlassCard style={{ padding: 30, background: "linear-gradient(180deg, rgba(16,15,20,0.86), rgba(12,12,15,0.92))" }}>
          <MiniScreenHeader label="sans plan" meta="dispersion" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18, marginTop: 28 }}>
            {[
              { label: "BTC", value: "20%" },
              { label: "ETH", value: "12%" },
              { label: "SOL", value: "18%" },
              { label: "meme", value: "27%" },
              { label: "cash", value: "4%" },
              { label: "autres", value: "19%" },
            ].map((item, index) => {
              const entered = springIn(frame, fps, index * 4, 20)
              return (
                <div
                  key={item.label}
                  style={{
                    padding: "20px 18px",
                    borderRadius: 26,
                    background: "rgba(255,255,255,0.03)",
                    border: `1px solid ${colors.borderSoft}`,
                    opacity: entered,
                    transform: `translateY(${interpolate(entered, [0, 1], [20, 0])}px)`,
                  }}
                >
                  <div style={{ fontSize: 15, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {item.label}
                  </div>
                  <div style={{ marginTop: 10, fontSize: 38, fontWeight: 780, color: colors.text }}>{item.value}</div>
                </div>
              )
            })}
          </div>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateRows: "0.56fr 0.44fr", gap: 24 }}>
          <GlassCard style={{ padding: 28 }}>
            <MiniScreenHeader label="sans methode" meta="bruit" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 26 }}>
              {[
                "Acheter sur la peur ?",
                "Renforcer les pertes ?",
                "Sortir trop tard ?",
                "Empiler les signaux contradictoires ?",
              ].map((line, index) => {
                const entered = springIn(frame, fps, 6 + index * 4, 20)
                return (
                  <div
                    key={line}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 22,
                      background: "rgba(255,90,103,0.08)",
                      border: "1px solid rgba(255,90,103,0.16)",
                      color: "#ffb7be",
                      fontSize: 21,
                      fontWeight: 600,
                      opacity: entered,
                      transform: `translateX(${interpolate(entered, [0, 1], [18, 0])}px)`,
                    }}
                  >
                    {line}
                  </div>
                )
              })}
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 26, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 17, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.16em" }}>
                temps perdu
              </div>
              <div style={{ fontSize: 58, fontWeight: 800, color: colors.text }}>chaos</div>
            </div>
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: 999,
                background:
                  "radial-gradient(circle at 50% 50%, rgba(255,90,103,0.34) 0%, rgba(255,90,103,0.10) 42%, transparent 72%)",
                border: "1px solid rgba(255,90,103,0.18)",
                boxShadow: "0 0 50px rgba(255,90,103,0.18)",
              }}
            />
          </GlassCard>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sequenceVisibility(frame, 180)
  const reveal = rangeProgress(frame, 12, 120)
  const scan = interpolate(frame, [0, 180], [-140, 560], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })
  const cameraScale = interpolate(frame, [0, 180], [1.02, 1.12], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ opacity: visibility, transform: `scale(${cameraScale}) translateY(-8px)` }}>
      <div
        style={{
          position: "absolute",
          inset: 88,
          display: "grid",
          gridTemplateColumns: "1.08fr 0.92fr",
          gap: 26,
        }}
      >
        <GlassCard style={{ padding: 28, position: "relative", overflow: "hidden" }}>
          <MiniScreenHeader label="advisor" meta="questionnaire" />
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: scan,
              height: 120,
              background:
                "linear-gradient(180deg, transparent 0%, rgba(216,181,90,0.10) 32%, rgba(216,181,90,0.26) 50%, rgba(216,181,90,0.10) 72%, transparent 100%)",
              mixBlendMode: "screen",
              opacity: 0.86,
            }}
          />
          <div style={{ padding: "24px 24px 0" }}>
            <div style={{ fontSize: 20, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
              Profil investisseur
            </div>
            <div style={{ marginTop: 10, fontSize: 58, fontWeight: 800, color: colors.text, lineHeight: 0.94 }}>
              Quel niveau de risque peux-tu supporter ?
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, padding: "24px 24px 0" }}>
            {["Conservateur", "Equilibre", "Dynamique"].map((option, index) => {
              const selected = frame > 36 + index * 14
              return (
                <div
                  key={option}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 999,
                    border: `1px solid ${selected ? "rgba(216,181,90,0.34)" : colors.borderSoft}`,
                    background: selected ? colors.goldGlow : "rgba(255,255,255,0.03)",
                    color: selected ? "#f8e5ad" : colors.muted,
                    fontSize: 17,
                    fontWeight: 600,
                    transform: `translateY(${selected ? 0 : 10}px)`,
                    transition: "all 220ms ease",
                  }}
                >
                  {option}
                </div>
              )
            })}
          </div>
          <div style={{ display: "flex", gap: 10, padding: "16px 24px 0" }}>
            {["Horizon 3-5 ans", "DCA mensuel", "BTC / ETH coeur"].map((option, index) => {
              const selected = frame > 74 + index * 10
              return (
                <div
                  key={option}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: `1px solid ${selected ? "rgba(127,140,255,0.30)" : colors.borderSoft}`,
                    background: selected ? "rgba(127,140,255,0.16)" : "rgba(255,255,255,0.03)",
                    color: selected ? "#cbd0ff" : colors.muted,
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                >
                  {option}
                </div>
              )
            })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, padding: "28px 24px 24px" }}>
            {[
              { label: "Risque", value: "6/10" },
              { label: "Temps", value: "5 ans" },
              { label: "Apport", value: "1 000 EUR" },
              { label: "Style", value: "DCA" },
            ].map((metric, index) => {
              const entered = springIn(frame, fps, 44 + index * 6, 20)
              return (
                <div
                  key={metric.label}
                  style={{
                    padding: "18px 16px",
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${colors.borderSoft}`,
                    opacity: entered,
                    transform: `translateY(${interpolate(entered, [0, 1], [18, 0])}px)`,
                  }}
                >
                  <div style={{ fontSize: 13, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                    {metric.label}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 24, fontWeight: 760, color: colors.text }}>{metric.value}</div>
                </div>
              )
            })}
          </div>
        </GlassCard>
        <div style={{ display: "grid", gridTemplateRows: "0.52fr 0.48fr", gap: 24 }}>
          <GlassCard style={{ padding: 28 }}>
            <MiniScreenHeader label="ai processing" meta="live reasoning" />
            <div style={{ display: "flex", justifyContent: "center", marginTop: 34 }}>
              <div
                style={{
                  width: 250,
                  height: 250,
                  borderRadius: 999,
                  border: "1px solid rgba(216,181,90,0.24)",
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(216,181,90,0.18) 0%, rgba(127,140,255,0.10) 40%, transparent 74%)",
                  boxShadow: "0 0 80px rgba(216,181,90,0.14)",
                  position: "relative",
                  transform: `scale(${1 + beatEnergy(frame + 210) * 0.05})`,
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 24,
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 52,
                    borderRadius: 999,
                    border: "1px solid rgba(216,181,90,0.36)",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: 30,
                    right: 30,
                    top: "50%",
                    height: 3,
                    background: "linear-gradient(90deg, transparent, rgba(216,181,90,0.86), transparent)",
                    transform: `translateY(${interpolate(frame, [0, 180], [-92, 92])}px)`,
                    boxShadow: "0 0 18px rgba(216,181,90,0.34)",
                  }}
                />
              </div>
            </div>
            <div style={{ marginTop: 30, display: "flex", gap: 12, flexWrap: "wrap" }}>
              {["risque", "horizon", "discipline", "allocation"].map((chip, index) => (
                <div
                  key={chip}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: index % 2 === 0 ? colors.goldGlow : "rgba(127,140,255,0.12)",
                    color: index % 2 === 0 ? "#f5e2ab" : "#ccd3ff",
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </GlassCard>
          <GlassCard style={{ padding: 28 }}>
            <MiniScreenHeader label="insight" meta="clear output" />
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
              {[
                "Profil equilibre, horizon 5 ans",
                "BTC et ETH comme coeur de portefeuille",
                "Satellites limites a 25%",
                "Plan d'entree progressif et discipliné",
              ].map((line, index) => {
                const entered = springIn(frame, fps, 30 + index * 6, 18)
                return (
                  <div
                    key={line}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 22,
                      background: "rgba(255,255,255,0.04)",
                      border: `1px solid ${colors.borderSoft}`,
                      color: colors.text,
                      fontSize: 18,
                      fontWeight: 560,
                      opacity: entered,
                      transform: `translateY(${interpolate(entered, [0, 1], [14, 0])}px)`,
                    }}
                  >
                    {line}
                  </div>
                )
              })}
            </div>
          </GlassCard>
        </div>
      </div>
      <AbsoluteFill
        style={{
          opacity: 0.24 + reveal * 0.12,
          background: "radial-gradient(circle at 70% 40%, rgba(216,181,90,0.18), transparent 28%)",
        }}
      />
    </AbsoluteFill>
  )
}

const ResultScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sequenceVisibility(frame, 150)
  const push = interpolate(frame, [0, 150], [0, -18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ opacity: visibility, transform: `translateY(${push}px) scale(1.04)` }}>
      <div
        style={{
          position: "absolute",
          inset: 86,
          display: "grid",
          gridTemplateColumns: "0.86fr 1.14fr",
          gridTemplateRows: "0.58fr 0.42fr",
          gap: 24,
        }}
      >
        <GlassCard style={{ padding: 28, gridRow: "1 / span 2" }}>
          <MiniScreenHeader label="allocation" meta="globale" />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 24 }}>
            <div
              style={{
                width: 320,
                height: 320,
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
                boxShadow: "0 0 46px rgba(216,181,90,0.16)",
                transform: `scale(${0.92 + rangeProgress(frame, 0, 60) * 0.08})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 66,
                  borderRadius: 999,
                  background: "rgba(9,11,14,0.98)",
                  border: `1px solid ${colors.borderSoft}`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <div style={{ fontSize: 14, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.16em" }}>
                  portefeuille
                </div>
                <div style={{ fontSize: 42, fontWeight: 800, color: colors.text }}>{formatCurrency.format(2064)}</div>
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 28 }}>
            {donutSegments.map((segment, index) => {
              const entered = springIn(frame, fps, 14 + index * 5, 18)
              return (
                <div
                  key={segment.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "auto 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    padding: "14px 16px",
                    borderRadius: 22,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${colors.borderSoft}`,
                    opacity: entered,
                    transform: `translateX(${interpolate(entered, [0, 1], [24, 0])}px)`,
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
        <GlassCard style={{ padding: 28 }}>
          <MiniScreenHeader label="portfolio curve" meta="snapshots reels" />
          <div style={{ height: 340, marginTop: 18 }}>
            <GlowLineChart points={portfolioPoints} color={colors.gold} frame={frame} duration={84} valueLabel="+11.8%" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 18 }}>
            {[
              { label: "Capital", value: "2 000 EUR" },
              { label: "Valeur", value: "2 236 EUR" },
              { label: "Plan", value: "Equilibre" },
            ].map((metric) => (
              <div
                key={metric.label}
                style={{
                  padding: "16px 14px",
                  borderRadius: 20,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${colors.borderSoft}`,
                }}
              >
                <div style={{ fontSize: 13, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                  {metric.label}
                </div>
                <div style={{ marginTop: 8, fontSize: 24, fontWeight: 760, color: colors.text }}>{metric.value}</div>
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 26 }}>
          <MiniScreenHeader label="plan d'action" meta="simple" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
            {[
              "BTC/ETH au coeur du portefeuille",
              "Satellites limites et tailles clairement bornees",
              "DCA mensuel et revue apres snapshots quotidiens",
            ].map((step, index) => {
              const entered = springIn(frame, fps, 24 + index * 8, 18)
              return (
                <div
                  key={step}
                  style={{
                    padding: "18px 18px 20px",
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${colors.borderSoft}`,
                    opacity: entered,
                    transform: `translateY(${interpolate(entered, [0, 1], [18, 0])}px)`,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 999,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: colors.goldGlow,
                      color: "#f2d78e",
                      fontSize: 16,
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 18, lineHeight: 1.36, fontWeight: 560, color: colors.text }}>
                    {step}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  )
}

const ProofScene: React.FC = () => {
  const frame = useCurrentFrame()
  const visibility = sequenceVisibility(frame, 120)
  const cameraX = interpolate(frame, [0, 120], [-14, 18], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ opacity: visibility, transform: `translateX(${cameraX}px) scale(1.05)` }}>
      <div
        style={{
          position: "absolute",
          inset: 92,
          display: "grid",
          gridTemplateColumns: "0.98fr 1.02fr",
          gridTemplateRows: "0.56fr 0.44fr",
          gap: 24,
        }}
      >
        <GlassCard style={{ padding: 28, gridRow: "1 / span 2" }}>
          <MiniScreenHeader label="dashboard" meta="portfolio history" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 24 }}>
            <div
              style={{
                padding: 18,
                borderRadius: 24,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${colors.borderSoft}`,
              }}
            >
              <div style={{ fontSize: 14, color: colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                capital investi
              </div>
              <div style={{ marginTop: 8, fontSize: 34, fontWeight: 780, color: colors.text }}>2 000 EUR</div>
            </div>
            <div
              style={{
                padding: 18,
                borderRadius: 24,
                background: colors.goldGlow,
                border: "1px solid rgba(216,181,90,0.22)",
              }}
            >
              <div style={{ fontSize: 14, color: "#f6e4b1", textTransform: "uppercase", letterSpacing: "0.14em" }}>
                source
              </div>
              <div style={{ marginTop: 8, fontSize: 28, fontWeight: 780, color: colors.text }}>portfolio_history</div>
            </div>
          </div>
          <div style={{ height: 300, marginTop: 18 }}>
            <GlowLineChart points={portfolioPoints} color={colors.gold} frame={frame + 18} duration={76} />
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
            {["1D", "7D", "1M", "ALL"].map((tf, index) => (
              <div
                key={tf}
                style={{
                  padding: "10px 14px",
                  borderRadius: 999,
                  border: `1px solid ${index === 3 ? "rgba(216,181,90,0.22)" : colors.borderSoft}`,
                  background: index === 3 ? colors.goldGlow : "rgba(255,255,255,0.03)",
                  color: index === 3 ? "#f5e1aa" : colors.muted,
                  fontSize: 15,
                  fontWeight: 700,
                }}
              >
                {tf}
              </div>
            ))}
          </div>
        </GlassCard>
        <GlassCard style={{ padding: 24 }}>
          <MiniScreenHeader label="ai chat" meta="follow-up" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 22 }}>
            {[
              { role: "user", text: "Je garde mon DCA ?" },
              { role: "ai", text: "Oui. Garde le coeur BTC/ETH stable et limite les satellites a 25%." },
              { role: "user", text: "Prochaine alerte ?" },
              { role: "ai", text: "Reviens apres le prochain snapshot quotidien pour ajuster le rythme." },
            ].map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                style={{
                  alignSelf: message.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "82%",
                  padding: "14px 16px",
                  borderRadius: 22,
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
          <MiniScreenHeader label="pricing" meta="gratuit pour commencer" />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 22 }}>
            {pricingPlans.map((plan, index) => (
              <div
                key={plan.name}
                style={{
                  padding: "18px 16px",
                  borderRadius: 24,
                  background: index === 0 ? colors.goldGlow : "rgba(255,255,255,0.04)",
                  border:
                    index === 0 ? "1px solid rgba(216,181,90,0.22)" : `1px solid ${colors.borderSoft}`,
                }}
              >
                <div style={{ fontSize: 14, color: index === 0 ? "#f5e1aa" : colors.subtle, textTransform: "uppercase", letterSpacing: "0.14em" }}>
                  {plan.name}
                </div>
                <div style={{ marginTop: 10, fontSize: 30, fontWeight: 780, color: colors.text }}>{plan.price}</div>
                <div style={{ marginTop: 8, fontSize: 15, color: colors.muted, lineHeight: 1.34 }}>{plan.meta}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </AbsoluteFill>
  )
}

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const visibility = sequenceVisibility(frame, 60)
  const intro = springIn(frame, fps, 0, 22)
  const productBackdrop = interpolate(frame, [0, 60], [0.88, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

  return (
    <AbsoluteFill style={{ opacity: visibility }}>
      <div
        style={{
          position: "absolute",
          inset: 110,
          borderRadius: 50,
          border: `1px solid ${colors.border}`,
          background: "rgba(10,13,18,0.46)",
          filter: "blur(0px)",
          transform: `scale(${productBackdrop})`,
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
        <div style={{ position: "absolute", inset: 28, borderRadius: 38, border: `1px solid ${colors.borderSoft}` }} />
      </div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          transform: `translateY(${interpolate(intro, [0, 1], [20, 0])}px) scale(${0.96 + intro * 0.04})`,
        }}
      >
        <AxiomMark />
        <div style={{ fontSize: 112, fontWeight: 800, color: colors.text, lineHeight: 0.9 }}>Axiom AI</div>
        <div style={{ fontSize: 42, color: colors.muted, fontWeight: 600 }}>Gratuit pour commencer</div>
        <div
          style={{
            marginTop: 10,
            padding: "18px 28px",
            borderRadius: 999,
            background: colors.goldGlow,
            border: "1px solid rgba(216,181,90,0.22)",
            color: colors.text,
            fontSize: 24,
            fontWeight: 700,
            boxShadow: "0 14px 40px rgba(216,181,90,0.12)",
          }}
        >
          {"Demarrer l'analyse"}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          bottom: 64,
          textAlign: "center",
          fontSize: 18,
          fontWeight: 500,
          color: colors.subtle,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        Pas un conseil financier
      </div>
    </AbsoluteFill>
  )
}

export const AxiomCinematicAdV4: React.FC<AxiomCinematicAdV4Props> = ({
  hasMusic = false,
  hasVoiceover = false,
}) => {
  const frame = useCurrentFrame()

  return (
    <AbsoluteFill style={{ background: colors.bg, fontFamily: "Inter, system-ui, sans-serif" }}>
      {hasMusic ? <Audio src={staticFile("audio/music.mp3")} volume={0.18} /> : null}
      {hasVoiceover ? <Audio src={staticFile("audio/voiceover.mp3")} volume={0.86} /> : null}
      <Background frame={frame} />
      <Sequence from={0} durationInFrames={90}>
        <HookScene />
      </Sequence>
      <Sequence from={90} durationInFrames={120}>
        <ProblemScene />
      </Sequence>
      <Sequence from={210} durationInFrames={180}>
        <SolutionScene />
      </Sequence>
      <Sequence from={390} durationInFrames={150}>
        <ResultScene />
      </Sequence>
      <Sequence from={540} durationInFrames={120}>
        <ProofScene />
      </Sequence>
      <Sequence from={660} durationInFrames={60}>
        <CTAScene />
      </Sequence>
      <CaptionOverlay frame={frame} />
    </AbsoluteFill>
  )
}

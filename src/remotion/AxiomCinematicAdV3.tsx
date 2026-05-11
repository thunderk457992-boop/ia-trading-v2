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
  bg: "#050608",
  bgSoft: "#0b0f14",
  panel: "rgba(16, 19, 25, 0.80)",
  panelStrong: "rgba(20, 24, 32, 0.92)",
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.06)",
  text: "#f8f7f2",
  muted: "rgba(248,247,242,0.64)",
  subtle: "rgba(248,247,242,0.36)",
  gold: "#d4af37",
  goldSoft: "rgba(212,175,55,0.14)",
  goldGlow: "rgba(212,175,55,0.28)",
  red: "#ff646b",
  redSoft: "rgba(255,100,107,0.18)",
  green: "#31c48d",
  greenSoft: "rgba(49,196,141,0.18)",
  blue: "#7b88ff",
  purple: "#ae7dff",
} as const

const captions = [
  {
    start: 0,
    end: 105,
    title: "Hook",
    text: "Tu investis encore au feeling ?",
  },
  {
    start: 105,
    end: 315,
    title: "Advisor",
    text: "Axiom AI transforme ton profil investisseur en strategie claire.",
  },
  {
    start: 315,
    end: 585,
    title: "Analysis",
    text: "Score IA, allocation crypto et plan d'action en une seule lecture.",
  },
  {
    start: 585,
    end: 915,
    title: "Dashboard",
    text: "Capital investi, snapshots et courbe portefeuille sans performance inventee.",
  },
  {
    start: 915,
    end: 1140,
    title: "Chat and pricing",
    text: "Comprendre le plan, poser ses questions, puis monter en gamme au bon moment.",
  },
  {
    start: 1140,
    end: 1350,
    title: "CTA",
    text: "Passe de l'intuition a la methode avec Axiom AI.",
  },
]

const beatFrames = [0, 24, 48, 90, 150, 315, 585, 915, 1140]

const donutData = [
  { asset: "BTC", pct: 42, amount: "6 300 EUR", color: colors.gold },
  { asset: "ETH", pct: 28, amount: "4 200 EUR", color: colors.blue },
  { asset: "SOL", pct: 14, amount: "2 100 EUR", color: colors.purple },
  { asset: "BNB", pct: 9, amount: "1 350 EUR", color: "#eed173" },
  { asset: "AVAX", pct: 7, amount: "1 050 EUR", color: colors.red },
]

const linePoints = [
  { x: 0, y: 575 },
  { x: 110, y: 560 },
  { x: 220, y: 536 },
  { x: 340, y: 498 },
  { x: 470, y: 466 },
  { x: 600, y: 438 },
  { x: 740, y: 404 },
  { x: 860, y: 372 },
  { x: 980, y: 344 },
]

const candleData = [
  { x: 40, low: 612, high: 502, open: 592, close: 526 },
  { x: 120, low: 600, high: 510, open: 560, close: 544 },
  { x: 200, low: 590, high: 500, open: 560, close: 520 },
  { x: 280, low: 568, high: 458, open: 520, close: 474 },
  { x: 360, low: 540, high: 446, open: 486, close: 456 },
  { x: 440, low: 530, high: 434, open: 468, close: 502 },
  { x: 520, low: 514, high: 410, open: 498, close: 432 },
  { x: 600, low: 502, high: 392, open: 432, close: 408 },
  { x: 680, low: 486, high: 378, open: 410, close: 444 },
  { x: 760, low: 472, high: 356, open: 440, close: 388 },
  { x: 840, low: 456, high: 342, open: 388, close: 360 },
  { x: 920, low: 440, high: 326, open: 360, close: 338 },
]

const pricingCards = [
  {
    name: "Free",
    price: "0 EUR",
    subtitle: "Starter workflow",
    features: ["1 analyse IA / mois", "12 messages de chat", "Dashboard essentiel"],
    accent: false,
  },
  {
    name: "Pro",
    price: "24.99 EUR",
    subtitle: "Most popular",
    features: ["20 analyses IA", "Signal marche detaille", "Historique etendu"],
    accent: true,
  },
  {
    name: "Premium",
    price: "59.99 EUR",
    subtitle: "Deep research mode",
    features: ["Analyses illimitees", "Chat premium", "Alertes risque"],
    accent: false,
  },
]

const chatMessages = [
  { role: "user", text: "Je garde le DCA si BTC reste au-dessus du dernier snapshot ?" },
  {
    role: "ai",
    text: "Oui, garde la taille du DCA stable. L'allocation actuelle suppose de la discipline, pas une entree agressive.",
  },
  { role: "user", text: "Quel est le prochain point de risque a surveiller ?" },
  {
    role: "ai",
    text: "Reviens apres le prochain snapshot quotidien. Surveille le poids du coeur BTC/ETH et garde les satellites sous 25%.",
  },
]

const cardStyle: React.CSSProperties = {
  borderRadius: 34,
  border: `1px solid ${colors.border}`,
  background: colors.panel,
  backdropFilter: "blur(26px)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.38)",
}

const panelStyle: React.CSSProperties = {
  borderRadius: 40,
  border: `1px solid ${colors.border}`,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 16%, rgba(0,0,0,0.02) 100%)",
  backdropFilter: "blur(30px)",
  boxShadow: "0 36px 120px rgba(0,0,0,0.46)",
}

const overlineStyle: React.CSSProperties = {
  fontSize: 18,
  letterSpacing: "0.26em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: colors.subtle,
}

const titleStyle: React.CSSProperties = {
  fontSize: 102,
  lineHeight: 0.96,
  fontWeight: 780,
  letterSpacing: 0,
  color: colors.text,
}

const metricLabelStyle: React.CSSProperties = {
  fontSize: 16,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700,
  color: colors.subtle,
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "10px 18px",
  border: `1px solid rgba(212,175,55,0.24)`,
  background: colors.goldSoft,
  color: "#f3dfa1",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 700,
  fontSize: 18,
}

const easePremium = Easing.bezier(0.16, 1, 0.3, 1)

const sceneProgress = (frame: number, start: number, duration: number) =>
  interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easePremium,
  })

const springIn = (frame: number, fps: number, delay: number, duration = 40) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: duration,
    config: {
      damping: 200,
      stiffness: 120,
      mass: 1.08,
    },
  })

const riseIn = (frame: number, fps: number, delay: number, distance = 28) => {
  const progress = springIn(frame, fps, delay)
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  }
}

const scaleIn = (frame: number, fps: number, delay: number, from = 0.95) => {
  const progress = springIn(frame, fps, delay, 46)
  return {
    opacity: progress,
    transform: `scale(${interpolate(progress, [0, 1], [from, 1])})`,
  }
}

const pulseAt = (frame: number, cueFrame: number, spread = 16) =>
  interpolate(frame, [cueFrame - spread, cueFrame, cueFrame + spread], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

const AxiomMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const size = compact ? 56 : 78
  const glyph = compact ? 24 : 36

  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 18 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: compact ? 18 : 24,
          background: "linear-gradient(180deg, #fffdf7 0%, #efe7cf 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 32px rgba(0,0,0,0.26)",
        }}
      >
        <svg width={glyph} height={glyph} viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M3 13L8 3L13 13"
            stroke="#090b10"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M5.5 9.4H10.5"
            stroke="#090b10"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: compact ? 36 : 56, color: colors.text, fontWeight: 820 }}>Axiom</span>
        <span style={{ ...pillStyle, fontSize: compact ? 12 : 16, padding: compact ? "7px 10px" : "8px 14px" }}>AI</span>
      </div>
    </div>
  )
}

const ScreenChrome: React.FC<{
  title: string
  eyebrow: string
  children: React.ReactNode
  style?: React.CSSProperties
}> = ({ title, eyebrow, children, style }) => {
  return (
    <div style={{ ...panelStyle, overflow: "hidden", ...style }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "22px 24px",
          borderBottom: `1px solid ${colors.borderSoft}`,
        }}
      >
        <div>
          <div style={{ ...metricLabelStyle, fontSize: 14 }}>{eyebrow}</div>
          <div style={{ marginTop: 8, fontSize: 30, fontWeight: 680, color: colors.text }}>{title}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        </div>
      </div>
      {children}
    </div>
  )
}

const Background: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const driftX = interpolate(frame, [0, durationInFrames], [0, -50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  })
  const driftY = interpolate(frame, [0, durationInFrames], [0, 32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 16% 10%, rgba(212,175,55,0.12), transparent 23%), radial-gradient(circle at 84% 18%, rgba(255,255,255,0.05), transparent 16%), linear-gradient(180deg,#040507 0%,#090c11 42%,#050608 100%)",
        overflow: "hidden",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)",
          backgroundSize: "120px 120px",
          opacity: 0.15,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: width * 0.04 + driftX,
          top: height * 0.03 + driftY,
          width: width * 0.84,
          height: height * 0.46,
          background: "radial-gradient(circle, rgba(212,175,55,0.18), rgba(212,175,55,0) 72%)",
          filter: "blur(82px)",
        }}
      />

      <div
        style={{
          position: "absolute",
          right: width * -0.04 - driftX * 0.55,
          bottom: height * 0.08 - driftY,
          width: width * 0.52,
          height: height * 0.34,
          background: "radial-gradient(circle, rgba(255,255,255,0.06), rgba(255,255,255,0) 70%)",
          filter: "blur(92px)",
        }}
      />
    </AbsoluteFill>
  )
}

const DynamicParticles: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const particles = Array.from({ length: 16 }, (_, index) => ({
    x: (index * 97) % width,
    y: (index * 157) % height,
    size: 2 + (index % 3),
    speed: 0.4 + (index % 5) * 0.06,
    opacity: 0.06 + (index % 4) * 0.02,
  }))

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {particles.map((particle, index) => {
        const travelY = (frame * particle.speed + particle.y) % (height + 180) - 90
        const travelX = particle.x + Math.sin((frame + index * 14) / 55) * 10
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: travelX,
              top: travelY,
              width: particle.size,
              height: particle.size,
              borderRadius: "50%",
              background: index % 3 === 0 ? colors.gold : "rgba(255,255,255,0.9)",
              opacity: particle.opacity,
              boxShadow: index % 3 === 0 ? `0 0 10px ${colors.goldGlow}` : "none",
            }}
          />
        )
      })}
    </div>
  )
}

const LightSweep: React.FC = () => {
  const frame = useCurrentFrame()
  const pulse = beatFrames.reduce((acc, cue) => acc + pulseAt(frame, cue, 14), 0)
  const x = interpolate(frame, [0, 1350], [-360, 1320], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -240,
          left: x,
          width: 300,
          height: 2600,
          transform: "rotate(18deg)",
          background: `linear-gradient(180deg, rgba(255,255,255,0), rgba(255,255,255,${0.04 + pulse * 0.035}), rgba(255,255,255,0))`,
          filter: "blur(18px)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  )
}

const CaptionOverlay: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const current = captions.find((caption) => frame >= caption.start && frame < caption.end)

  if (!current) return null

  const local = frame - current.start
  const progress = spring({
    frame: local,
    fps,
    durationInFrames: 24,
    config: {
      damping: 200,
      stiffness: 130,
      mass: 1,
    },
  })

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: 78,
        width: 830,
        transform: `translateX(-50%) translateY(${interpolate(progress, [0, 1], [22, 0])}px)`,
        opacity: progress,
      }}
    >
      <div
        style={{
          ...panelStyle,
          background: "rgba(10,12,18,0.78)",
          borderRadius: 28,
          padding: "18px 24px 22px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.36)",
        }}
      >
        <div style={{ ...metricLabelStyle, color: "#ecd79a" }}>{current.title}</div>
        <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.42, fontWeight: 560, color: colors.text }}>
          {current.text}
        </div>
      </div>
    </div>
  )
}

const HookChart: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const reveal = springIn(frame, fps, start + 6, 30)
  const local = Math.max(0, frame - start)
  const glow = pulseAt(frame, start + 18, 10)

  return (
    <div style={{ position: "relative", width: "100%", height: 700 }}>
      <svg viewBox="0 0 1000 700" style={{ width: "100%", height: "100%" }}>
        {[120, 260, 400, 540].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="1000"
            y2={y}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="5 14"
          />
        ))}

        {candleData.map((candle, index) => {
          const appear = springIn(frame, fps, start + index * 3, 26)
          const bodyTop = Math.min(candle.open, candle.close)
          const bodyHeight = Math.max(22, Math.abs(candle.close - candle.open))
          const isRed = candle.close < candle.open
          const color = isRed ? colors.red : colors.green
          return (
            <g key={index} opacity={appear}>
              <line
                x1={candle.x}
                y1={candle.high}
                x2={candle.x}
                y2={candle.low}
                stroke={color}
                strokeWidth="4"
                strokeLinecap="round"
              />
              <rect
                x={candle.x - 16}
                y={bodyTop}
                width="32"
                height={bodyHeight}
                rx="8"
                fill={isRed ? colors.redSoft : colors.greenSoft}
                stroke={color}
                strokeWidth="3"
              />
            </g>
          )
        })}

        <path
          d="M0 640 C 80 620, 160 570, 250 510 C 340 446, 420 420, 520 470 C 620 520, 720 470, 860 344 C 930 285, 975 224, 1000 180"
          fill="none"
          stroke={colors.red}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1600"
          strokeDashoffset={interpolate(reveal, [0, 1], [1600, 0])}
          filter={`drop-shadow(0 0 ${18 + glow * 16}px rgba(255,100,107,0.42))`}
        />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 38,
          top: 28,
          ...pillStyle,
          background: colors.redSoft,
          border: "1px solid rgba(255,100,107,0.34)",
          color: "#ffb7bc",
          boxShadow: `0 0 ${16 + glow * 10}px rgba(255,100,107,0.22)`,
        }}
      >
        Market stress
      </div>

      <div
        style={{
          position: "absolute",
          right: 34,
          bottom: 26,
          ...cardStyle,
          padding: "18px 20px",
          background: "rgba(18,20,26,0.72)",
          opacity: interpolate(local, [18, 40], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={metricLabelStyle}>Last move</div>
        <div style={{ marginTop: 10, fontSize: 28, color: colors.text, fontWeight: 700 }}>-8.4%</div>
      </div>
    </div>
  )
}

const HookScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 0, 105)

  return (
    <AbsoluteFill
      style={{
        padding: "64px 60px 170px",
        transform: `scale(${interpolate(camera, [0, 1], [1.12, 1])}) translate3d(${interpolate(camera, [0, 1], [0, -24])}px, ${interpolate(camera, [0, 1], [0, 16])}px, 0)`,
      }}
    >
      <div style={{ ...riseIn(frame, fps, 0, 14), display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <AxiomMark compact />
        <div style={{ ...metricLabelStyle, color: "#e8cf7f" }}>Hook / 00:00 - 00:03.5</div>
      </div>

      <div style={{ ...riseIn(frame, fps, 8, 22), marginTop: 34 }}>
        <div style={{ ...titleStyle, fontSize: 116, maxWidth: 900 }}>Tu investis encore au feeling ?</div>
      </div>

      <div style={{ marginTop: 36, ...scaleIn(frame, fps, 16, 0.94) }}>
        <HookChart start={0} />
      </div>

      <div
        style={{
          position: "absolute",
          left: 74,
          right: 74,
          bottom: 180,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 18,
        }}
      >
        {[
          ["Crypto trop emotionnel", "Le marche bouge plus vite que vos routines."],
          ["Le produit doit ramener du calme", "Advisor, allocation, snapshots, decisions claires."],
        ].map(([label, text], index) => (
          <div key={label} style={{ ...cardStyle, padding: 20, ...scaleIn(frame, fps, 28 + index * 5, 0.94) }}>
            <div style={metricLabelStyle}>{label}</div>
            <div style={{ marginTop: 10, fontSize: 24, color: colors.text, lineHeight: 1.4 }}>{text}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  )
}

const AdvisorScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 105, 210)
  const cadenceSelected = frame >= 170
  const dcaSelected = frame >= 194
  const riskSelected = frame >= 214
  const ready = frame >= 242

  return (
    <AbsoluteFill
      style={{
        padding: "84px 58px 160px",
        transform: `scale(${interpolate(camera, [0, 1], [1.08, 1])}) translate3d(${interpolate(camera, [0, 1], [16, -18])}px, ${interpolate(camera, [0, 1], [12, -10])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 105, 20)}>
        <div style={overlineStyle}>Advisor</div>
        <div style={{ ...titleStyle, fontSize: 86, marginTop: 20, maxWidth: 900 }}>
          Le questionnaire devient un vrai objet produit.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.08fr 0.92fr", gap: 24, marginTop: 40 }}>
        <ScreenChrome eyebrow="Questionnaire" title="Question 7 / 8" style={{ ...scaleIn(frame, fps, 118, 0.94) }}>
          <div style={{ padding: "26px 24px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 30, color: colors.text, fontWeight: 660 }}>Rythme d&apos;investissement et strategie d&apos;entree</div>
              <div style={{ width: 200, height: 10, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${interpolate(frame, [130, 258], [46, 89], {
                      extrapolateLeft: "clamp",
                      extrapolateRight: "clamp",
                    })}%`,
                    height: "100%",
                    background: colors.gold,
                    boxShadow: `0 0 18px ${colors.goldGlow}`,
                  }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 26 }}>
              <div style={{ ...cardStyle, padding: 20, background: colors.panelStrong }}>
                <div style={{ ...metricLabelStyle, color: "#ecd79a" }}>Frequence</div>
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {[
                    { label: "Une fois", active: false },
                    { label: "Chaque semaine", active: false },
                    { label: "Chaque mois", active: cadenceSelected },
                    { label: "Opportuniste", active: false },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: 20,
                        padding: "18px 20px",
                        border: item.active ? `1.5px solid rgba(212,175,55,0.58)` : `1px solid ${colors.border}`,
                        background: item.active ? colors.goldSoft : "rgba(255,255,255,0.03)",
                        boxShadow: item.active ? `0 0 18px ${colors.goldSoft}` : "none",
                        color: item.active ? colors.text : colors.muted,
                        fontSize: 24,
                        fontWeight: item.active ? 650 : 500,
                        ...riseIn(frame, fps, 136 + index * 5, 16),
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: 20, background: colors.panelStrong }}>
                <div style={{ ...metricLabelStyle, color: "#ecd79a" }}>Strategie</div>
                <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
                  {[
                    { label: "Lump sum", active: false },
                    { label: "DCA mensuel", active: dcaSelected },
                    { label: "DCA hebdomadaire", active: false },
                  ].map((item, index) => (
                    <div
                      key={item.label}
                      style={{
                        borderRadius: 20,
                        padding: "18px 20px",
                        border: item.active ? `1.5px solid rgba(212,175,55,0.58)` : `1px solid ${colors.border}`,
                        background: item.active ? colors.goldSoft : "rgba(255,255,255,0.03)",
                        boxShadow: item.active ? `0 0 18px ${colors.goldSoft}` : "none",
                        color: item.active ? colors.text : colors.muted,
                        fontSize: 24,
                        fontWeight: item.active ? 650 : 500,
                        ...riseIn(frame, fps, 150 + index * 5, 16),
                      }}
                    >
                      {item.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 20 }}>
              {[
                ["Profil", "Modere"],
                ["Capital", "5 000 EUR"],
                ["DCA", "400 EUR"],
                ["Horizon", "3 a 5 ans"],
              ].map(([label, value], index) => (
                <div key={label} style={{ ...cardStyle, padding: 16, ...scaleIn(frame, fps, 170 + index * 4, 0.95) }}>
                  <div style={metricLabelStyle}>{label}</div>
                  <div style={{ marginTop: 8, fontSize: 22, color: colors.text, fontWeight: 650 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </ScreenChrome>

        <div style={{ display: "grid", gap: 18 }}>
          <ScreenChrome eyebrow="Risk" title="Tolerance" style={{ ...scaleIn(frame, fps, 154, 0.95) }}>
            <div style={{ padding: 22, display: "grid", gap: 12 }}>
              {[
                { label: "Defensif", active: false },
                { label: "Modere", active: riskSelected },
                { label: "Agressif", active: false },
              ].map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    borderRadius: 22,
                    padding: "18px 20px",
                    border: item.active ? `1.5px solid rgba(49,196,141,0.42)` : `1px solid ${colors.border}`,
                    background: item.active ? colors.greenSoft : "rgba(255,255,255,0.03)",
                    color: item.active ? colors.text : colors.muted,
                    fontSize: 24,
                    fontWeight: item.active ? 650 : 500,
                    ...riseIn(frame, fps, 174 + index * 6, 16),
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </ScreenChrome>

          <ScreenChrome eyebrow="Objective" title="Long-term plan" style={{ ...scaleIn(frame, fps, 182, 0.95) }}>
            <div style={{ padding: 22 }}>
              <div style={{ fontSize: 28, lineHeight: 1.42, color: colors.text }}>
                Construire un portefeuille long terme, lisser les points d&apos;entree et reduire les erreurs emotionnelles.
              </div>
              <div
                style={{
                  ...pillStyle,
                  marginTop: 20,
                  opacity: ready ? 1 : 0.48,
                  transform: `scale(${ready ? 1 : 0.97})`,
                }}
              >
                Pret a analyser
              </div>
            </div>
          </ScreenChrome>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const AnimatedDonut: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const reveal = springIn(frame, fps, start, 42)

  return (
    <div
      style={{
        width: 300,
        height: 300,
        borderRadius: "50%",
        background:
          "conic-gradient(#d4af37 0 42%, #7b88ff 42% 70%, #ae7dff 70% 84%, #eed173 84% 93%, #ff646b 93% 100%)",
        position: "relative",
        boxShadow: `0 24px 60px rgba(0,0,0,0.34), 0 0 34px rgba(212,175,55,${0.08 + reveal * 0.18})`,
        transform: `scale(${interpolate(reveal, [0, 1], [0.9, 1])})`,
        opacity: reveal,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 56,
          borderRadius: "50%",
          background: "#0b0d12",
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          boxShadow: "inset 0 0 42px rgba(255,255,255,0.03)",
        }}
      >
        <div style={metricLabelStyle}>BTC</div>
        <div style={{ marginTop: 8, fontSize: 42, color: colors.text, fontWeight: 760 }}>42%</div>
      </div>
    </div>
  )
}

const TypingPanel: React.FC<{ start: number; text: string }> = ({ start, text }) => {
  const frame = useCurrentFrame()
  const visible = Math.max(0, Math.floor((frame - start) * 1.35))
  const shown = text.slice(0, visible)
  const caretVisible = Math.floor(frame / 12) % 2 === 0

  return (
    <div style={{ position: "relative", minHeight: 182 }}>
      <div style={{ fontSize: 25, lineHeight: 1.56, color: colors.text, fontWeight: 500 }}>
        {shown}
        {caretVisible ? <span style={{ color: colors.gold }}>|</span> : null}
      </div>
    </div>
  )
}

const AnalysisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 315, 270)

  return (
    <AbsoluteFill
      style={{
        padding: "84px 58px 160px",
        transform: `scale(${interpolate(camera, [0, 1], [1.07, 1])}) translate3d(${interpolate(camera, [0, 1], [12, -20])}px, ${interpolate(camera, [0, 1], [22, -8])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 315, 20)}>
        <div style={overlineStyle}>AI analysis</div>
        <div style={{ ...titleStyle, fontSize: 84, marginTop: 20, maxWidth: 930 }}>
          Score, allocation, plan d&apos;action. Tout se revele comme un produit premium.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: 24, marginTop: 40 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <ScreenChrome eyebrow="AI score" title="Resultat d'analyse" style={{ ...scaleIn(frame, fps, 330, 0.94) }}>
            <div style={{ padding: 24 }}>
              <div
                style={{
                  ...cardStyle,
                  background: "linear-gradient(180deg, rgba(18,43,36,0.94) 0%, rgba(18,43,36,0.74) 100%)",
                  border: "1px solid rgba(49,196,141,0.26)",
                  padding: 24,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ ...metricLabelStyle, color: "rgba(214,255,240,0.72)" }}>Score IA</div>
                    <div style={{ marginTop: 12, fontSize: 82, color: colors.text, fontWeight: 760 }}>84</div>
                  </div>
                  <div style={{ ...pillStyle, color: "#d6ffea", border: "1px solid rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.05)" }}>
                    Risque modere
                  </div>
                </div>
                <div style={{ marginTop: 16, fontSize: 24, lineHeight: 1.5, color: colors.muted }}>
                  Le coeur BTC / ETH reste dominant, avec une poche satellite strictement limitee.
                </div>
              </div>
            </div>
          </ScreenChrome>

          <ScreenChrome eyebrow="Recommendation" title="Lecture IA" style={{ ...scaleIn(frame, fps, 350, 0.94) }}>
            <div style={{ padding: 24 }}>
              <TypingPanel
                start={366}
                text="Entrer progressivement sur BTC et ETH, conserver SOL et AVAX comme satellites sous controle, puis revoir l'exposition apres le prochain snapshot quotidien."
              />
            </div>
          </ScreenChrome>
        </div>

        <ScreenChrome eyebrow="Crypto allocation" title="Portefeuille modele" style={{ ...scaleIn(frame, fps, 344, 0.94) }}>
          <div style={{ padding: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 26, alignItems: "center" }}>
              <AnimatedDonut start={360} />
              <div style={{ display: "grid", gap: 14 }}>
                {donutData.map((item, index) => (
                  <div
                    key={item.asset}
                    style={{
                      ...cardStyle,
                      background: colors.panelStrong,
                      padding: "18px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      ...riseIn(frame, fps, 372 + index * 6, 16),
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          background: item.color,
                          boxShadow: `0 0 16px ${item.color}`,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 26, color: colors.text, fontWeight: 660 }}>{item.asset}</div>
                        <div style={{ fontSize: 18, color: colors.subtle }}>{item.amount}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 30, color: "#f5e3a9", fontWeight: 720 }}>{item.pct}%</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 20 }}>
              {[
                "Executer un premier bloc de 2 500 EUR sur les actifs coeur.",
                "Programmer 400 EUR de DCA mensuel sur 90 jours.",
                "Verifier le dashboard apres le prochain snapshot.",
              ].map((step, index) => (
                <div key={step} style={{ ...cardStyle, padding: 18, ...scaleIn(frame, fps, 408 + index * 6, 0.95) }}>
                  <div style={metricLabelStyle}>Action {index + 1}</div>
                  <div style={{ marginTop: 10, fontSize: 22, lineHeight: 1.42, color: colors.text }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </ScreenChrome>
      </div>
    </AbsoluteFill>
  )
}

const PortfolioChartPremium: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const reveal = springIn(frame, fps, start, 52)
  const path = linePoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  const dashOffset = interpolate(reveal, [0, 1], [1500, 0])

  return (
    <svg viewBox="0 0 1000 650" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="v3-line-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(212,175,55,0.30)" />
          <stop offset="82%" stopColor="rgba(212,175,55,0.02)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)" />
        </linearGradient>
      </defs>

      {[450, 540, 630].map((y) => (
        <line
          key={y}
          x1="0"
          y1={y}
          x2="1000"
          y2={y}
          stroke="rgba(255,255,255,0.07)"
          strokeDasharray="6 14"
        />
      ))}

      {candleData.map((candle, index) => {
        const appear = springIn(frame, fps, start + index * 2, 28)
        const isRed = candle.close < candle.open
        const color = isRed ? colors.red : colors.green
        const bodyTop = Math.min(candle.open, candle.close)
        const bodyHeight = Math.max(16, Math.abs(candle.close - candle.open))
        return (
          <g key={index} opacity={appear * 0.9}>
            <line
              x1={candle.x}
              y1={candle.high}
              x2={candle.x}
              y2={candle.low}
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
            />
            <rect
              x={candle.x - 12}
              y={bodyTop}
              width="24"
              height={bodyHeight}
              rx="6"
              fill={isRed ? colors.redSoft : colors.greenSoft}
              stroke={color}
              strokeWidth="2.4"
            />
          </g>
        )
      })}

      <path d={`${path} L 980 650 L 0 650 Z`} fill="url(#v3-line-fill)" opacity={reveal} />
      <path
        d={path}
        fill="none"
        stroke={colors.gold}
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray="1500"
        strokeDashoffset={dashOffset}
        filter={`drop-shadow(0 0 12px ${colors.goldGlow})`}
      />

      {linePoints.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={5}
          fill={colors.gold}
          opacity={interpolate(reveal, [0.5, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      ))}
    </svg>
  )
}

const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 585, 330)

  return (
    <AbsoluteFill
      style={{
        padding: "82px 56px 164px",
        transform: `scale(${interpolate(camera, [0, 1], [1.06, 1])}) translate3d(${interpolate(camera, [0, 1], [-16, 12])}px, ${interpolate(camera, [0, 1], [14, -12])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 585, 20)}>
        <div style={overlineStyle}>Dashboard</div>
        <div style={{ ...titleStyle, fontSize: 84, marginTop: 20, maxWidth: 960 }}>
          Le produit devient le personnage principal.
        </div>
      </div>

      <ScreenChrome eyebrow="Portfolio" title="Portefeuille, snapshots et courbe" style={{ marginTop: 38, ...scaleIn(frame, fps, 600, 0.94) }}>
        <div style={{ padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
            {[
              ["Capital investi", "15 000 EUR", "2 analyses + DCA en cours"],
              ["Valeur portefeuille", "18 420 EUR", "+620 EUR sur la periode"],
              ["Source", "portfolio_history", "Dernier snapshot 09:12"],
              ["Lecture IA", "Variation recente", "Pas de performance inventee"],
            ].map(([label, value, hint], index) => (
              <div key={label} style={{ ...cardStyle, padding: 18, ...scaleIn(frame, fps, 612 + index * 4, 0.95) }}>
                <div style={metricLabelStyle}>{label}</div>
                <div style={{ marginTop: 10, fontSize: 32, color: colors.text, fontWeight: 700 }}>{value}</div>
                <div style={{ marginTop: 8, fontSize: 16, color: colors.subtle }}>{hint}</div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.06fr 0.94fr", gap: 18, marginTop: 18 }}>
            <div style={{ ...cardStyle, padding: 18, background: colors.panelStrong }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={metricLabelStyle}>Courbe portefeuille</div>
                  <div style={{ marginTop: 8, fontSize: 22, color: colors.muted }}>
                    Snapshots agreges, animation premium, pas de faux pics.
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {["1H", "Recent", "7D", "1M", "ALL"].map((label, index) => (
                    <div
                      key={label}
                      style={{
                        borderRadius: 999,
                        padding: "10px 14px",
                        fontSize: 16,
                        fontWeight: 650,
                        color:
                          index === 3
                            ? "#f4e1a0"
                            : index === 0
                              ? "rgba(255,255,255,0.28)"
                              : colors.muted,
                        border:
                          index === 3
                            ? `1px solid rgba(212,175,55,0.38)`
                            : `1px solid rgba(255,255,255,${index === 0 ? "0.08" : "0.12"})`,
                        background: index === 3 ? colors.goldSoft : "rgba(255,255,255,0.03)",
                      }}
                    >
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ height: 410, marginTop: 16 }}>
                <PortfolioChartPremium start={632} />
              </div>
            </div>

            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ ...cardStyle, padding: 18, background: colors.panelStrong, ...scaleIn(frame, fps, 648, 0.95) }}>
                <div style={metricLabelStyle}>Allocation crypto</div>
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {donutData.map((item, index) => (
                    <div
                      key={item.asset}
                      style={{
                        ...cardStyle,
                        background: "rgba(255,255,255,0.03)",
                        padding: "14px 16px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        ...riseIn(frame, fps, 662 + index * 5, 14),
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: item.color,
                            boxShadow: `0 0 12px ${item.color}`,
                          }}
                        />
                        <div>
                          <div style={{ fontSize: 22, fontWeight: 650, color: colors.text }}>{item.asset}</div>
                          <div style={{ fontSize: 16, color: colors.subtle }}>{item.amount}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#f4e1a0" }}>{item.pct}%</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: 18, background: colors.panelStrong, ...scaleIn(frame, fps, 688, 0.95) }}>
                <div style={metricLabelStyle}>Plan d&apos;action</div>
                <div style={{ display: "grid", gap: 12, marginTop: 14 }}>
                  {[
                    "Executer le premier bloc coeur BTC / ETH.",
                    "Maintenir le DCA sans augmenter sur euphorie.",
                    "Verifier le prochain snapshot quotidien.",
                  ].map((step, index) => (
                    <div
                      key={step}
                      style={{
                        ...cardStyle,
                        background: "rgba(255,255,255,0.03)",
                        padding: "14px 16px",
                        display: "flex",
                        gap: 14,
                        ...riseIn(frame, fps, 702 + index * 7, 14),
                      }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: "50%",
                          background: "#fffdf7",
                          color: "#0b0d12",
                          fontWeight: 700,
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        {index + 1}
                      </div>
                      <div style={{ fontSize: 21, color: colors.text, lineHeight: 1.4 }}>{step}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScreenChrome>
    </AbsoluteFill>
  )
}

const ChatPricingScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 915, 225)

  return (
    <AbsoluteFill
      style={{
        padding: "84px 56px 168px",
        transform: `scale(${interpolate(camera, [0, 1], [1.05, 1])}) translate3d(${interpolate(camera, [0, 1], [14, -10])}px, ${interpolate(camera, [0, 1], [18, -10])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 915, 20)}>
        <div style={overlineStyle}>Chat and pricing</div>
        <div style={{ ...titleStyle, fontSize: 82, marginTop: 20, maxWidth: 920 }}>
          Comprendre le plan, puis montrer la montee en gamme.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.94fr 1.06fr", gap: 22, marginTop: 38 }}>
        <ScreenChrome eyebrow="AI chat" title="Conversation contextuelle" style={{ ...scaleIn(frame, fps, 930, 0.94) }}>
          <div style={{ padding: 22 }}>
            <div style={{ display: "grid", gap: 14 }}>
              {chatMessages.map((message, index) => {
                const isAi = message.role === "ai"
                return (
                  <div
                    key={`${message.role}-${index}`}
                    style={{
                      display: "flex",
                      justifyContent: isAi ? "flex-start" : "flex-end",
                      ...riseIn(frame, fps, 944 + index * 10, 14),
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "82%",
                        borderRadius: 26,
                        padding: "18px 20px",
                        border: `1px solid ${isAi ? "rgba(212,175,55,0.18)" : colors.border}`,
                        background: isAi ? "rgba(212,175,55,0.10)" : colors.panelStrong,
                        color: colors.text,
                        fontSize: 22,
                        lineHeight: 1.46,
                      }}
                    >
                      {message.text}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </ScreenChrome>

        <ScreenChrome eyebrow="Pricing" title="Plans clairs, upgrade propre" style={{ ...scaleIn(frame, fps, 950, 0.94) }}>
          <div style={{ padding: 22, display: "grid", gap: 14 }}>
            {pricingCards.map((plan, index) => (
              <div
                key={plan.name}
                style={{
                  borderRadius: 30,
                  padding: "20px 22px",
                  border: plan.accent ? "1px solid rgba(212,175,55,0.38)" : `1px solid ${colors.border}`,
                  background: plan.accent ? colors.goldSoft : colors.panelStrong,
                  boxShadow: plan.accent ? `0 0 24px ${colors.goldSoft}` : "none",
                  ...riseIn(frame, fps, 962 + index * 8, 16),
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 28, color: colors.text, fontWeight: 700 }}>{plan.name}</div>
                    <div style={{ marginTop: 6, fontSize: 18, color: colors.subtle }}>{plan.subtitle}</div>
                  </div>
                  {plan.accent ? <div style={{ ...pillStyle, fontSize: 14 }}>Popular</div> : null}
                </div>
                <div style={{ marginTop: 14, fontSize: 40, color: colors.text, fontWeight: 760 }}>{plan.price}</div>
                <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                  {plan.features.map((feature) => (
                    <div key={feature} style={{ fontSize: 18, color: colors.muted }}>
                      {feature}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScreenChrome>
      </div>
    </AbsoluteFill>
  )
}

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 1140, 210)
  const settle = springIn(frame, fps, 1148, 46)

  return (
    <AbsoluteFill
      style={{
        padding: "118px 70px 118px",
        transform: `scale(${interpolate(camera, [0, 1], [1.03, 1])}) translate3d(0, ${interpolate(camera, [0, 1], [10, -8])}px, 0)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", ...riseIn(frame, fps, 1140, 18) }}>
        <AxiomMark />
      </div>

      <div style={{ textAlign: "center", marginTop: 46, ...riseIn(frame, fps, 1152, 24) }}>
        <div style={{ ...pillStyle, display: "inline-flex" }}>Axiom AI</div>
        <div style={{ ...titleStyle, fontSize: 100, marginTop: 28 }}>
          Passe de l&apos;intuition a la methode.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 18,
          marginTop: 52,
          opacity: settle,
          transform: `scale(${interpolate(settle, [0, 1], [0.95, 1])})`,
        }}
      >
        {[
          ["Advisor", "Questionnaire guide"],
          ["Dashboard", "Snapshots, courbe, capital"],
          ["Chat + Pricing", "Comprendre puis monter en gamme"],
        ].map(([label, text], index) => (
          <div key={label} style={{ ...cardStyle, padding: 20, ...scaleIn(frame, fps, 1176 + index * 6, 0.95) }}>
            <div style={metricLabelStyle}>{label}</div>
            <div style={{ marginTop: 12, fontSize: 24, color: colors.text, lineHeight: 1.36 }}>{text}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          ...panelStyle,
          marginTop: "auto",
          width: 760,
          alignSelf: "center",
          padding: "28px 34px",
          textAlign: "center",
          opacity: settle,
          transform: `scale(${interpolate(settle, [0, 1], [0.94, 1])})`,
        }}
      >
        <div style={metricLabelStyle}>Call to action</div>
        <div style={{ marginTop: 14, fontSize: 44, color: colors.text, fontWeight: 760 }}>
          Lance ta premiere analyse sur axiom-trade.dev
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 30, fontSize: 18, color: colors.subtle }}>
        Demo data. Educational showcase only. Crypto assets involve risk and this is not financial advice.
      </div>
    </AbsoluteFill>
  )
}

export const AxiomCinematicAdV3: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <DynamicParticles />
      <LightSweep />
      <Sequence from={0} durationInFrames={105}>
        <HookScene />
      </Sequence>
      <Sequence from={105} durationInFrames={210}>
        <AdvisorScene />
      </Sequence>
      <Sequence from={315} durationInFrames={270}>
        <AnalysisScene />
      </Sequence>
      <Sequence from={585} durationInFrames={330}>
        <DashboardScene />
      </Sequence>
      <Sequence from={915} durationInFrames={225}>
        <ChatPricingScene />
      </Sequence>
      <Sequence from={1140} durationInFrames={210}>
        <FinalScene />
      </Sequence>
      <CaptionOverlay />
    </AbsoluteFill>
  )
}

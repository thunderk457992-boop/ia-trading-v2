import React from "react"
import {
  AbsoluteFill,
  Sequence,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"

const colors = {
  bg: "#050608",
  bgSoft: "#0d1015",
  bgPanel: "rgba(16, 18, 24, 0.80)",
  bgPanelStrong: "rgba(20, 23, 31, 0.92)",
  border: "rgba(255,255,255,0.10)",
  borderSoft: "rgba(255,255,255,0.06)",
  text: "#f8f7f2",
  muted: "rgba(248,247,242,0.62)",
  subtle: "rgba(248,247,242,0.36)",
  gold: "#d4af37",
  goldSoft: "rgba(212,175,55,0.15)",
  goldGlow: "rgba(212,175,55,0.32)",
  green: "#30c48d",
  red: "#ff6b6b",
  blue: "#7a86ff",
  purple: "#b07dff",
} as const

const cueFrames = [0, 132, 378, 690, 948, 1170]

const captions = [
  {
    start: 0,
    end: 132,
    title: "Axiom AI",
    text: "Turn crypto decisions into a calmer, more structured investing workflow.",
  },
  {
    start: 132,
    end: 378,
    title: "Advisor",
    text: "Shape the profile, investment rhythm, and risk tolerance with a guided questionnaire.",
  },
  {
    start: 378,
    end: 690,
    title: "Analysis",
    text: "Reveal the AI score, allocation logic, and the next three moves in one clean result.",
  },
  {
    start: 690,
    end: 948,
    title: "Dashboard",
    text: "Track invested capital, portfolio snapshots, and the portfolio curve without fake performance.",
  },
  {
    start: 948,
    end: 1170,
    title: "Chat and pricing",
    text: "Ask follow-up questions, understand the plan, and upgrade only when the product earns it.",
  },
  {
    start: 1170,
    end: 1350,
    title: "CTA",
    text: "Axiom AI. Premium crypto strategy, presented with more clarity and less noise.",
  },
]

const allocations = [
  { asset: "BTC", pct: 42, amount: "6 300 EUR", color: colors.gold },
  { asset: "ETH", pct: 28, amount: "4 200 EUR", color: colors.blue },
  { asset: "SOL", pct: 14, amount: "2 100 EUR", color: colors.purple },
  { asset: "BNB", pct: 9, amount: "1 350 EUR", color: "#f0d06c" },
  { asset: "AVAX", pct: 7, amount: "1 050 EUR", color: colors.red },
]

const chartPoints = [
  { x: 0, y: 616 },
  { x: 120, y: 598 },
  { x: 260, y: 574 },
  { x: 380, y: 534 },
  { x: 520, y: 505 },
  { x: 660, y: 470 },
  { x: 810, y: 442 },
  { x: 960, y: 408 },
]

const performanceBars = [
  { label: "1M", value: 0.34 },
  { label: "3M", value: 0.58 },
  { label: "6M", value: 0.72 },
  { label: "1Y", value: 0.86 },
]

const chatMessages = [
  {
    role: "user",
    text: "Should I keep adding monthly if BTC stays above the previous snapshot range?",
  },
  {
    role: "ai",
    text: "Yes, but keep the DCA size stable. The current allocation already assumes measured upside, not aggressive chase entries.",
  },
  {
    role: "user",
    text: "What is the next risk checkpoint?",
  },
  {
    role: "ai",
    text: "Review after the next daily snapshot. Watch the BTC core weight and keep satellite assets capped below 25%.",
  },
]

const productNotes = [
  "Apple-keynote pacing",
  "Glass layers and macro UI framing",
  "Voice-over ready captions",
]

const safeCaptionWidth = 820

const cardStyle: React.CSSProperties = {
  borderRadius: 34,
  border: `1px solid ${colors.border}`,
  background: colors.bgPanel,
  backdropFilter: "blur(24px)",
  boxShadow: "0 24px 80px rgba(0,0,0,0.34)",
}

const panelStyle: React.CSSProperties = {
  borderRadius: 38,
  border: `1px solid ${colors.border}`,
  background:
    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 18%, rgba(0,0,0,0.02) 100%)",
  backdropFilter: "blur(28px)",
  boxShadow: "0 34px 120px rgba(0,0,0,0.45)",
}

const overlineStyle: React.CSSProperties = {
  fontSize: 18,
  textTransform: "uppercase",
  letterSpacing: "0.24em",
  fontWeight: 700,
  color: colors.subtle,
}

const heroTitleStyle: React.CSSProperties = {
  fontSize: 96,
  lineHeight: 0.98,
  fontWeight: 760,
  letterSpacing: 0,
  color: colors.text,
}

const bodyStyle: React.CSSProperties = {
  fontSize: 30,
  lineHeight: 1.48,
  color: colors.muted,
}

const metricLabelStyle: React.CSSProperties = {
  fontSize: 16,
  color: colors.subtle,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700,
}

const metricValueStyle: React.CSSProperties = {
  fontSize: 38,
  fontWeight: 720,
  color: colors.text,
}

const pillStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  padding: "10px 18px",
  border: `1px solid rgba(212,175,55,0.25)`,
  background: colors.goldSoft,
  color: "#f3dfa1",
  textTransform: "uppercase",
  letterSpacing: "0.16em",
  fontWeight: 700,
  fontSize: 18,
}

const cinematicEase = Easing.bezier(0.16, 1, 0.3, 1)

const sceneProgress = (frame: number, start: number, duration: number) => {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: cinematicEase,
  })
}

const springIn = (frame: number, fps: number, delay: number, duration = 36) =>
  spring({
    frame: frame - delay,
    fps,
    durationInFrames: duration,
    config: {
      damping: 200,
      stiffness: 120,
      mass: 1.1,
    },
  })

const riseIn = (frame: number, fps: number, delay: number, distance = 36) => {
  const progress = springIn(frame, fps, delay)
  return {
    opacity: progress,
    transform: `translateY(${interpolate(progress, [0, 1], [distance, 0])}px)`,
  }
}

const scaleIn = (frame: number, fps: number, delay: number, from = 0.96) => {
  const progress = springIn(frame, fps, delay, 40)
  return {
    opacity: progress,
    transform: `scale(${interpolate(progress, [0, 1], [from, 1])})`,
  }
}

const pulseAt = (frame: number, cueFrame: number, spread = 18) =>
  interpolate(frame, [cueFrame - spread, cueFrame, cueFrame + spread], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  })

const AxiomMark: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const size = compact ? 54 : 76
  const glyph = compact ? 24 : 34

  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 14 : 18 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: compact ? 18 : 24,
          background: "linear-gradient(180deg, #fffdf8 0%, #f1ebd9 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 30px rgba(0,0,0,0.26)",
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
        <span style={{ fontSize: compact ? 36 : 54, fontWeight: 800, color: colors.text }}>Axiom</span>
        <span style={{ ...pillStyle, fontSize: compact ? 12 : 16, padding: compact ? "7px 10px" : "8px 14px" }}>AI</span>
      </div>
    </div>
  )
}

const Background: React.FC = () => {
  const frame = useCurrentFrame()
  const { width, height, durationInFrames } = useVideoConfig()
  const driftX = interpolate(frame, [0, durationInFrames], [0, -40], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  })
  const driftY = interpolate(frame, [0, durationInFrames], [0, 28], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.ease),
  })

  return (
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(circle at 18% 12%, rgba(212,175,55,0.13), transparent 24%), radial-gradient(circle at 86% 18%, rgba(255,255,255,0.06), transparent 16%), linear-gradient(180deg,#040507 0%,#090c10 42%,#050608 100%)",
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
          opacity: 0.18,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: width * 0.06 + driftX,
          top: height * 0.02 + driftY,
          width: width * 0.8,
          height: height * 0.44,
          background: "radial-gradient(circle, rgba(212,175,55,0.16), rgba(212,175,55,0) 70%)",
          filter: "blur(80px)",
          opacity: 0.95,
        }}
      />
      <div
        style={{
          position: "absolute",
          right: width * -0.08 - driftX * 0.6,
          bottom: height * 0.12 - driftY,
          width: width * 0.48,
          height: height * 0.3,
          background: "radial-gradient(circle, rgba(255,255,255,0.07), rgba(255,255,255,0) 72%)",
          filter: "blur(88px)",
        }}
      />
    </AbsoluteFill>
  )
}

const LightSweep: React.FC = () => {
  const frame = useCurrentFrame()
  const totalPulse = cueFrames.reduce((acc, cue) => acc + pulseAt(frame, cue, 16), 0)

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(120deg, rgba(255,255,255,0) 20%, rgba(255,255,255,${0.04 + totalPulse * 0.03}) 50%, rgba(255,255,255,0) 80%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  )
}

const CaptionOverlay: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const currentCaption = captions.find((caption) => frame >= caption.start && frame < caption.end)

  if (!currentCaption) return null

  const localDelay = frame - currentCaption.start
  const progress = spring({
    frame: localDelay,
    fps,
    durationInFrames: 26,
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
        width: safeCaptionWidth,
        transform: `translateX(-50%) translateY(${interpolate(progress, [0, 1], [26, 0])}px)`,
        opacity: progress,
      }}
    >
      <div
        style={{
          ...panelStyle,
          borderRadius: 28,
          padding: "20px 26px 22px",
          background: "rgba(10, 12, 17, 0.78)",
          boxShadow: "0 18px 48px rgba(0,0,0,0.34)",
        }}
      >
        <div style={{ ...metricLabelStyle, color: "#e8cf7f" }}>{currentCaption.title}</div>
        <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.42, color: colors.text, fontWeight: 560 }}>
          {currentCaption.text}
        </div>
      </div>
    </div>
  )
}

const FloatingNotes: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  return (
    <div style={{ position: "absolute", top: 120, right: 72, display: "grid", gap: 14 }}>
      {productNotes.map((note, index) => (
        <div
          key={note}
          style={{
            ...cardStyle,
            background: "rgba(14,16,22,0.54)",
            padding: "14px 18px",
            color: colors.muted,
            fontSize: 18,
            ...scaleIn(frame, fps, start + index * 6, 0.94),
          }}
        >
          {note}
        </div>
      ))}
    </div>
  )
}

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 0, 132)
  const floatingCardProgress = springIn(frame, fps, 36, 40)

  return (
    <AbsoluteFill
      style={{
        padding: "112px 72px 100px",
        transform: `scale(${interpolate(camera, [0, 1], [1.05, 1])}) translate3d(${interpolate(camera, [0, 1], [0, -8])}px, ${interpolate(camera, [0, 1], [0, 12])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 0, 20)}>
        <AxiomMark />
      </div>

      <div style={{ ...riseIn(frame, fps, 10, 36), marginTop: 68 }}>
        <div style={pillStyle}>Apple keynote x fintech x crypto premium</div>
      </div>

      <div style={{ ...riseIn(frame, fps, 18, 48), marginTop: 34 }}>
        <div style={heroTitleStyle}>A calmer way to present crypto strategy.</div>
        <div style={{ ...bodyStyle, marginTop: 24, maxWidth: 850 }}>
          Product-level cinematography for advisor flows, allocation logic, and portfolio tracking.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 22,
          marginTop: 74,
          maxWidth: 936,
        }}
      >
        {[
          ["Analysis cadence", "About 1 minute"],
          ["Tracked capital", "15 000 EUR"],
          ["Market reading", "Daily snapshots"],
        ].map(([label, value], index) => (
          <div key={label} style={{ ...cardStyle, padding: 26, ...scaleIn(frame, fps, 28 + index * 6, 0.94) }}>
            <div style={metricLabelStyle}>{label}</div>
            <div style={{ ...metricValueStyle, marginTop: 16 }}>{value}</div>
          </div>
        ))}
      </div>

      <div
        style={{
          ...panelStyle,
          position: "absolute",
          right: 70,
          bottom: 220,
          width: 360,
          padding: 24,
          opacity: floatingCardProgress,
          transform: `translateY(${interpolate(camera, [0, 1], [20, -10])}px) rotate(-2deg) scale(${interpolate(
            floatingCardProgress,
            [0, 1],
            [0.92, 1]
          )})`,
        }}
      >
        <div style={{ ...metricLabelStyle, color: "#ecd79a" }}>Cinematic structure</div>
        <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
          {[
            "Profile capture",
            "AI recommendation",
            "Allocation reveal",
            "Dashboard narrative",
          ].map((item) => (
            <div key={item} style={{ fontSize: 24, color: colors.text, lineHeight: 1.35 }}>
              {item}
            </div>
          ))}
        </div>
      </div>

      <FloatingNotes start={44} />
    </AbsoluteFill>
  )
}

const QuestionnaireScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 132, 246)
  const selectedCadence = frame >= 208
  const selectedStrategy = frame >= 234
  const selectedRisk = frame >= 258

  return (
    <AbsoluteFill
      style={{
        padding: "84px 64px 146px",
        transform: `scale(${interpolate(camera, [0, 1], [1.08, 1])}) translate3d(${interpolate(camera, [0, 1], [18, -14])}px, ${interpolate(camera, [0, 1], [22, -12])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 132, 20)}>
        <div style={overlineStyle}>Advisor questionnaire</div>
        <div style={{ ...heroTitleStyle, fontSize: 76, marginTop: 22 }}>
          Guide the profile with a tactile, premium flow.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: 28, marginTop: 40 }}>
        <div style={{ ...panelStyle, padding: 30, ...scaleIn(frame, fps, 144, 0.94) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={metricLabelStyle}>Question 7 / 8</div>
              <div style={{ fontSize: 36, color: colors.text, marginTop: 12, fontWeight: 650 }}>
                Investment cadence and entry logic
              </div>
            </div>
            <div style={{ width: 220, height: 12, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <div
                style={{
                  width: `${interpolate(frame, [152, 320], [40, 88], {
                    extrapolateLeft: "clamp",
                    extrapolateRight: "clamp",
                  })}%`,
                  height: "100%",
                  borderRadius: 999,
                  background: colors.gold,
                  boxShadow: `0 0 18px ${colors.goldGlow}`,
                }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginTop: 30 }}>
            <div style={{ ...cardStyle, padding: 22, background: colors.bgPanelStrong }}>
              <div style={{ ...metricLabelStyle, color: "#ecd79a" }}>Cadence</div>
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {[
                  { label: "One-time entry", active: false },
                  { label: "Weekly", active: false },
                  { label: "Monthly", active: selectedCadence },
                  { label: "Opportunistic", active: false },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    style={{
                      borderRadius: 22,
                      padding: "20px 22px",
                      border: item.active ? `1.5px solid rgba(212,175,55,0.58)` : `1px solid ${colors.border}`,
                      background: item.active ? colors.goldSoft : "rgba(255,255,255,0.03)",
                      color: item.active ? colors.text : colors.muted,
                      boxShadow: item.active ? `0 0 22px ${colors.goldSoft}` : "none",
                      fontSize: 28,
                      fontWeight: item.active ? 650 : 500,
                      ...riseIn(frame, fps, 160 + index * 6, 20),
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: 22, background: colors.bgPanelStrong }}>
              <div style={{ ...metricLabelStyle, color: "#ecd79a" }}>Entry style</div>
              <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
                {[
                  { label: "Lump sum", active: false },
                  { label: "Monthly DCA", active: selectedStrategy },
                  { label: "Weekly DCA", active: false },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    style={{
                      borderRadius: 22,
                      padding: "20px 22px",
                      border: item.active ? `1.5px solid rgba(212,175,55,0.58)` : `1px solid ${colors.border}`,
                      background: item.active ? colors.goldSoft : "rgba(255,255,255,0.03)",
                      color: item.active ? colors.text : colors.muted,
                      boxShadow: item.active ? `0 0 22px ${colors.goldSoft}` : "none",
                      fontSize: 28,
                      fontWeight: item.active ? 650 : 500,
                      ...riseIn(frame, fps, 176 + index * 6, 20),
                    }}
                  >
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginTop: 22 }}>
            {[
              ["Profile", "Moderate"],
              ["Capital", "5 000 EUR"],
              ["DCA", "400 EUR"],
              ["Horizon", "3 to 5 years"],
            ].map(([label, value], index) => (
              <div key={label} style={{ ...cardStyle, padding: 18, ...scaleIn(frame, fps, 206 + index * 5, 0.95) }}>
                <div style={metricLabelStyle}>{label}</div>
                <div style={{ marginTop: 10, color: colors.text, fontWeight: 650, fontSize: 26 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ ...panelStyle, padding: 24, minHeight: 228, ...scaleIn(frame, fps, 196, 0.94) }}>
            <div style={metricLabelStyle}>Risk preference</div>
            <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
              {[
                { label: "Defensive", active: false },
                { label: "Moderate", active: selectedRisk },
                { label: "Aggressive", active: false },
              ].map((item, index) => (
                <div
                  key={item.label}
                  style={{
                    padding: "18px 20px",
                    borderRadius: 22,
                    border: item.active ? `1.5px solid rgba(48,196,141,0.42)` : `1px solid ${colors.border}`,
                    background: item.active ? "rgba(48,196,141,0.12)" : "rgba(255,255,255,0.03)",
                    color: item.active ? colors.text : colors.muted,
                    fontSize: 26,
                    fontWeight: item.active ? 650 : 500,
                    ...riseIn(frame, fps, 214 + index * 7, 18),
                  }}
                >
                  {item.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 24, ...scaleIn(frame, fps, 236, 0.94) }}>
            <div style={metricLabelStyle}>Objective</div>
            <div style={{ marginTop: 12, fontSize: 30, lineHeight: 1.42, color: colors.text }}>
              Build a long-term portfolio and reduce emotional mistakes with a more measured entry plan.
            </div>
            <div style={{ marginTop: 22, ...pillStyle, fontSize: 16 }}>Ready to analyze</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const TypingParagraph: React.FC<{ text: string; start: number; y: number }> = ({ text, start, y }) => {
  const frame = useCurrentFrame()
  const visibleChars = Math.max(0, Math.floor((frame - start) * 1.35))
  const shown = text.slice(0, visibleChars)
  const caret = Math.floor(frame / 12) % 2 === 0 ? "|" : ""

  return (
    <div
      style={{
        position: "absolute",
        left: 28,
        right: 28,
        top: y,
        fontSize: 26,
        lineHeight: 1.55,
        color: colors.text,
        fontWeight: 500,
      }}
    >
      {shown}
      <span style={{ color: colors.gold }}>{caret}</span>
    </div>
  )
}

const AllocationDonut: React.FC<{ frameOffset: number }> = ({ frameOffset }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const reveal = springIn(frame, fps, frameOffset, 46)

  return (
    <div
      style={{
        width: 298,
        height: 298,
        borderRadius: "50%",
        background:
          "conic-gradient(#d4af37 0 42%, #7a86ff 42% 70%, #b07dff 70% 84%, #f0d06c 84% 93%, #ff6b6b 93% 100%)",
        position: "relative",
        boxShadow: `0 24px 60px rgba(0,0,0,0.32), 0 0 30px rgba(212,175,55,${0.08 + reveal * 0.12})`,
        transform: `scale(${interpolate(reveal, [0, 1], [0.9, 1])})`,
        opacity: reveal,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 54,
          borderRadius: "50%",
          background: "#0b0d12",
          border: `1px solid ${colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          boxShadow: "inset 0 0 40px rgba(255,255,255,0.03)",
        }}
      >
        <div style={metricLabelStyle}>BTC</div>
        <div style={{ marginTop: 8, fontSize: 42, fontWeight: 760, color: colors.text }}>42%</div>
      </div>
    </div>
  )
}

const AnalysisScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 378, 312)

  return (
    <AbsoluteFill
      style={{
        padding: "88px 64px 150px",
        transform: `scale(${interpolate(camera, [0, 1], [1.07, 1])}) translate3d(${interpolate(camera, [0, 1], [12, -18])}px, ${interpolate(camera, [0, 1], [24, -10])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 378, 20)}>
        <div style={overlineStyle}>AI analysis output</div>
        <div style={{ ...heroTitleStyle, fontSize: 76, marginTop: 22 }}>
          Reveal the score, allocation, and next actions like a product film.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.92fr 1.08fr", gap: 26, marginTop: 42 }}>
        <div style={{ display: "grid", gap: 20 }}>
          <div
            style={{
              ...panelStyle,
              padding: 28,
              background: "linear-gradient(180deg, rgba(18,43,36,0.92) 0%, rgba(18,43,36,0.74) 100%)",
              border: "1px solid rgba(48,196,141,0.22)",
              ...scaleIn(frame, fps, 392, 0.94),
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ ...metricLabelStyle, color: "rgba(214,255,240,0.72)" }}>AI score</div>
                <div style={{ fontSize: 86, fontWeight: 760, color: colors.text, marginTop: 12 }}>84</div>
              </div>
              <div
                style={{
                  ...pillStyle,
                  color: "#d8ffed",
                  border: "1px solid rgba(255,255,255,0.16)",
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                Moderate risk
              </div>
            </div>
            <div style={{ ...bodyStyle, fontSize: 24, marginTop: 16 }}>
              The model keeps BTC and ETH as the liquid core while limiting satellite risk.
            </div>
          </div>

          <div style={{ ...panelStyle, minHeight: 210, padding: 28, ...scaleIn(frame, fps, 410, 0.94) }}>
            <div style={metricLabelStyle}>Main recommendation</div>
            <TypingParagraph
              start={436}
              y={70}
              text="Enter progressively on BTC and ETH, keep SOL and AVAX capped as a measured satellite sleeve, and review again after the next daily snapshot."
            />
          </div>

          <div style={{ ...panelStyle, padding: 24, ...scaleIn(frame, fps, 430, 0.94) }}>
            <div style={metricLabelStyle}>Action plan</div>
            <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
              {[
                "Deploy the first 2 500 EUR on the core assets.",
                "Schedule 400 EUR of monthly DCA for the next 90 days.",
                "Review the dashboard after the next snapshot.",
              ].map((step, index) => (
                <div
                  key={step}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "center",
                    padding: "14px 0",
                    opacity: springIn(frame, fps, 452 + index * 8, 36),
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#fffdf7",
                      color: "#0b0d12",
                      fontSize: 18,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ fontSize: 24, lineHeight: 1.42, color: colors.text }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ ...panelStyle, padding: 28, ...scaleIn(frame, fps, 404, 0.94) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={metricLabelStyle}>Crypto allocation</div>
              <div style={{ ...bodyStyle, fontSize: 22, marginTop: 10 }}>Model portfolio with fictional demo data.</div>
            </div>
            <div style={pillStyle}>Demo</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", gap: 28, alignItems: "center", marginTop: 26 }}>
            <AllocationDonut frameOffset={428} />
            <div style={{ display: "grid", gap: 14 }}>
              {allocations.map((item, index) => (
                <div
                  key={item.asset}
                  style={{
                    ...cardStyle,
                    background: colors.bgPanelStrong,
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    ...riseIn(frame, fps, 440 + index * 7, 20),
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: item.color,
                        boxShadow: `0 0 18px ${item.color}`,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 26, fontWeight: 660, color: colors.text }}>{item.asset}</div>
                      <div style={{ fontSize: 18, color: colors.subtle }}>{item.amount}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 720, color: "#f5e3a9" }}>{item.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginTop: 24 }}>
            {performanceBars.map((bar, index) => {
              const reveal = springIn(frame, fps, 488 + index * 5, 36)
              return (
                <div key={bar.label} style={{ ...cardStyle, padding: 18, ...scaleIn(frame, fps, 488 + index * 5, 0.94) }}>
                  <div style={metricLabelStyle}>{bar.label}</div>
                  <div
                    style={{
                      marginTop: 18,
                      height: 110,
                      borderRadius: 18,
                      background: "rgba(255,255,255,0.04)",
                      display: "flex",
                      alignItems: "flex-end",
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        borderRadius: 14,
                        height: `${Math.round(bar.value * 100 * reveal)}%`,
                        background: "linear-gradient(180deg, rgba(212,175,55,0.95) 0%, rgba(212,175,55,0.35) 100%)",
                        boxShadow: `0 0 18px ${colors.goldSoft}`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const DashboardChart: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const progress = springIn(frame, fps, start, 56)
  const path = chartPoints.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ")
  const length = 1400
  const dashOffset = interpolate(progress, [0, 1], [length, 0])

  return (
    <svg viewBox="0 0 1000 760" style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="axiom-cinematic-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(212,175,55,0.28)" />
          <stop offset="82%" stopColor="rgba(212,175,55,0.02)" />
          <stop offset="100%" stopColor="rgba(212,175,55,0)" />
        </linearGradient>
      </defs>
      {[520, 630, 740].map((y) => (
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
      <path d={`${path} L 980 760 L 0 760 Z`} fill="url(#axiom-cinematic-fill)" opacity={progress} />
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
  )
}

const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 690, 258)

  return (
    <AbsoluteFill
      style={{
        padding: "86px 62px 150px",
        transform: `scale(${interpolate(camera, [0, 1], [1.06, 1])}) translate3d(${interpolate(camera, [0, 1], [-18, 10])}px, ${interpolate(camera, [0, 1], [12, -14])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 690, 20)}>
        <div style={overlineStyle}>Portfolio dashboard</div>
        <div style={{ ...heroTitleStyle, fontSize: 74, marginTop: 22 }}>
          Show the data like a premium finance product.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 42 }}>
        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            {[
              ["Invested capital", "15 000 EUR", "2 analyses + DCA in motion"],
              ["Portfolio value", "18 420 EUR", "+620 EUR over the period"],
              ["Source", "portfolio_history", "Last snapshot 09:12"],
              ["Narrative", "Recent variation", "No invented performance"],
            ].map(([label, value, hint], index) => (
              <div key={label} style={{ ...cardStyle, padding: 22, ...scaleIn(frame, fps, 706 + index * 5, 0.94) }}>
                <div style={metricLabelStyle}>{label}</div>
                <div style={{ marginTop: 14, color: colors.text, fontSize: 34, fontWeight: 700 }}>{value}</div>
                <div style={{ marginTop: 10, color: colors.subtle, fontSize: 17 }}>{hint}</div>
              </div>
            ))}
          </div>

          <div style={{ ...panelStyle, padding: 24, ...scaleIn(frame, fps, 728, 0.94) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={metricLabelStyle}>Timeframes</div>
                <div style={{ ...bodyStyle, fontSize: 22, marginTop: 8 }}>Contextual states, not fake activity.</div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {["1H", "Recent", "7D", "1M", "ALL"].map((label, index) => (
                  <div
                    key={label}
                    style={{
                      borderRadius: 999,
                      padding: "10px 15px",
                      fontSize: 18,
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

            <div style={{ height: 430, marginTop: 18 }}>
              <DashboardChart start={752} />
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ ...panelStyle, padding: 24, minHeight: 330, ...scaleIn(frame, fps, 734, 0.94) }}>
            <div style={metricLabelStyle}>Allocation by asset</div>
            <div style={{ display: "grid", gap: 14, marginTop: 18 }}>
              {allocations.map((item, index) => (
                <div
                  key={item.asset}
                  style={{
                    ...cardStyle,
                    background: colors.bgPanelStrong,
                    padding: "18px 20px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    ...riseIn(frame, fps, 754 + index * 6, 18),
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
                      <div style={{ fontSize: 26, fontWeight: 650, color: colors.text }}>{item.asset}</div>
                      <div style={{ fontSize: 18, color: colors.subtle }}>{item.amount}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: "#f5e3a9" }}>{item.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 24, ...scaleIn(frame, fps, 778, 0.94) }}>
            <div style={metricLabelStyle}>Action plan</div>
            <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
              {[
                "Keep the BTC and ETH core intact while volatility stays constructive.",
                "Maintain DCA size rather than increasing on strong candles.",
                "Re-check the dashboard after the next daily snapshot.",
              ].map((step, index) => (
                <div
                  key={step}
                  style={{
                    ...cardStyle,
                    background: colors.bgPanelStrong,
                    padding: "18px 18px 18px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    ...riseIn(frame, fps, 790 + index * 8, 18),
                  }}
                >
                  <div
                    style={{
                      marginTop: 2,
                      width: 34,
                      height: 34,
                      borderRadius: "50%",
                      background: "#fffdf7",
                      color: "#0b0d12",
                      fontWeight: 700,
                      fontSize: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ fontSize: 24, color: colors.text, lineHeight: 1.42 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const ChatPricingScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const camera = sceneProgress(frame, 948, 222)

  return (
    <AbsoluteFill
      style={{
        padding: "88px 62px 150px",
        transform: `scale(${interpolate(camera, [0, 1], [1.05, 1])}) translate3d(${interpolate(camera, [0, 1], [14, -10])}px, ${interpolate(camera, [0, 1], [18, -8])}px, 0)`,
      }}
    >
      <div style={riseIn(frame, fps, 948, 20)}>
        <div style={overlineStyle}>Chat and pricing</div>
        <div style={{ ...heroTitleStyle, fontSize: 74, marginTop: 22 }}>
          Explain the plan, then show the path to upgrade.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "0.95fr 1.05fr", gap: 26, marginTop: 42 }}>
        <div style={{ ...panelStyle, padding: 24, minHeight: 920, ...scaleIn(frame, fps, 962, 0.94) }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={metricLabelStyle}>AI chat</div>
              <div style={{ ...bodyStyle, fontSize: 22, marginTop: 8 }}>Keep the narrative useful after the first analysis.</div>
            </div>
            <div style={pillStyle}>12 messages left</div>
          </div>

          <div style={{ display: "grid", gap: 16, marginTop: 24 }}>
            {chatMessages.map((message, index) => {
              const isAi = message.role === "ai"
              return (
                <div
                  key={`${message.role}-${index}`}
                  style={{
                    display: "flex",
                    justifyContent: isAi ? "flex-start" : "flex-end",
                    ...riseIn(frame, fps, 980 + index * 10, 18),
                  }}
                >
                  <div
                    style={{
                      maxWidth: "84%",
                      borderRadius: 28,
                      padding: "18px 20px",
                      border: `1px solid ${isAi ? "rgba(212,175,55,0.18)" : colors.border}`,
                      background: isAi ? "rgba(212,175,55,0.10)" : colors.bgPanelStrong,
                      color: colors.text,
                      fontSize: 23,
                      lineHeight: 1.48,
                    }}
                  >
                    {message.text}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div style={{ display: "grid", gap: 18 }}>
          <div style={{ ...panelStyle, padding: 24, ...scaleIn(frame, fps, 980, 0.94) }}>
            <div style={metricLabelStyle}>Pricing</div>
            <div style={{ display: "grid", gap: 14, marginTop: 20 }}>
              {[
                {
                  name: "Free",
                  price: "0 EUR",
                  subtitle: "Starter workflow",
                  accent: false,
                },
                {
                  name: "Pro",
                  price: "24.99 EUR",
                  subtitle: "Most popular",
                  accent: true,
                },
                {
                  name: "Premium",
                  price: "59.99 EUR",
                  subtitle: "Deep research mode",
                  accent: false,
                },
              ].map((plan, index) => (
                <div
                  key={plan.name}
                  style={{
                    borderRadius: 30,
                    padding: "22px 24px",
                    border: plan.accent
                      ? "1px solid rgba(212,175,55,0.38)"
                      : `1px solid ${colors.border}`,
                    background: plan.accent ? "rgba(212,175,55,0.08)" : colors.bgPanelStrong,
                    boxShadow: plan.accent ? `0 0 24px ${colors.goldSoft}` : "none",
                    ...riseIn(frame, fps, 998 + index * 8, 18),
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 30, fontWeight: 700, color: colors.text }}>{plan.name}</div>
                      <div style={{ marginTop: 6, fontSize: 20, color: colors.subtle }}>{plan.subtitle}</div>
                    </div>
                    {plan.accent ? <div style={pillStyle}>Popular</div> : null}
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 760, color: colors.text, marginTop: 14 }}>{plan.price}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ ...panelStyle, padding: 24, ...scaleIn(frame, fps, 1038, 0.94) }}>
            <div style={metricLabelStyle}>Upgrade prompt</div>
            <div style={{ fontSize: 34, color: colors.text, marginTop: 14, lineHeight: 1.2, fontWeight: 680 }}>
              Unlock more analyses and a deeper market read when the product has earned the next step.
            </div>
            <div style={{ marginTop: 22, ...pillStyle, fontSize: 18 }}>Choose Pro</div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  )
}

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const settle = springIn(frame, fps, 1170, 48)
  const camera = sceneProgress(frame, 1170, 180)

  return (
    <AbsoluteFill
      style={{
        padding: "132px 72px 118px",
        justifyContent: "space-between",
        transform: `scale(${interpolate(camera, [0, 1], [1.03, 1])}) translate3d(0, ${interpolate(camera, [0, 1], [10, -8])}px, 0)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", ...riseIn(frame, fps, 1170, 22) }}>
        <AxiomMark />
      </div>

      <div style={{ textAlign: "center", ...riseIn(frame, fps, 1182, 34) }}>
        <div style={{ ...pillStyle, display: "inline-flex" }}>Axiom AI</div>
        <div style={{ ...heroTitleStyle, fontSize: 100, marginTop: 30 }}>
          Structured crypto strategy, without the noise.
        </div>
        <div style={{ ...bodyStyle, fontSize: 34, marginTop: 26 }}>
          Advisor, allocation, portfolio snapshots, chat, and a premium dashboard experience.
        </div>
      </div>

      <div
        style={{
          ...panelStyle,
          width: 760,
          alignSelf: "center",
          padding: "28px 34px",
          textAlign: "center",
          transform: `scale(${interpolate(settle, [0, 1], [0.95, 1])})`,
          opacity: settle,
        }}
      >
        <div style={metricLabelStyle}>Call to action</div>
        <div style={{ marginTop: 14, fontSize: 44, fontWeight: 760, color: colors.text }}>
          Launch your first analysis on axiom-trade.dev
        </div>
      </div>

      <div style={{ textAlign: "center", fontSize: 18, color: colors.subtle }}>
        Demo data. Educational showcase only. Crypto assets involve risk and this is not financial advice.
      </div>
    </AbsoluteFill>
  )
}

export const AxiomCinematicAd: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <LightSweep />
      <Sequence from={0} durationInFrames={132}>
        <IntroScene />
      </Sequence>
      <Sequence from={132} durationInFrames={246}>
        <QuestionnaireScene />
      </Sequence>
      <Sequence from={378} durationInFrames={312}>
        <AnalysisScene />
      </Sequence>
      <Sequence from={690} durationInFrames={258}>
        <DashboardScene />
      </Sequence>
      <Sequence from={948} durationInFrames={222}>
        <ChatPricingScene />
      </Sequence>
      <Sequence from={1170} durationInFrames={180}>
        <FinalScene />
      </Sequence>
      <CaptionOverlay />
    </AbsoluteFill>
  )
}

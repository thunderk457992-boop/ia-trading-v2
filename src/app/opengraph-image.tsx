import { ImageResponse } from "next/og"
import { SITE_NAME, DEFAULT_SEO_DESCRIPTION } from "@/lib/seo"

export const runtime = "edge"
export const alt = SITE_NAME
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111111 50%, #0d0d0d 100%)",
          padding: "72px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Subtle grid lines */}
        <div style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

        {/* Top glow */}
        <div style={{
          position: "absolute",
          top: -120,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 300,
          background: "radial-gradient(ellipse, rgba(201,168,76,0.15) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />

        {/* Logo mark */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 48,
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: "#C9A84C",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <div style={{
              color: "#000",
              fontSize: 24,
              fontWeight: 900,
              letterSpacing: "-0.05em",
            }}>A</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ color: "#ffffff", fontSize: 28, fontWeight: 700, letterSpacing: "-0.03em" }}>
              Axiom
            </span>
            <span style={{
              color: "#C9A84C",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
            }}>AI</span>
          </div>
        </div>

        {/* Main headline */}
        <div style={{
          color: "#ffffff",
          fontSize: 62,
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.08,
          maxWidth: 820,
          marginBottom: 28,
        }}>
          Conseiller crypto IA
        </div>

        {/* Subtitle */}
        <div style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: 26,
          fontWeight: 400,
          letterSpacing: "-0.01em",
          lineHeight: 1.4,
          maxWidth: 680,
          marginBottom: 52,
        }}>
          {DEFAULT_SEO_DESCRIPTION}
        </div>

        {/* Pills row */}
        <div style={{ display: "flex", gap: 12 }}>
          {["Propulsé par Claude AI", "Gratuit pour commencer", "Données live"].map((label) => (
            <div key={label} style={{
              display: "flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: 999,
              border: "1px solid rgba(201,168,76,0.35)",
              background: "rgba(201,168,76,0.08)",
              color: "#C9A84C",
              fontSize: 16,
              fontWeight: 600,
            }}>{label}</div>
          ))}
        </div>

        {/* Domain */}
        <div style={{
          position: "absolute",
          bottom: 48,
          right: 80,
          color: "rgba(255,255,255,0.25)",
          fontSize: 18,
          letterSpacing: "0.04em",
        }}>
          axiom-trade.dev
        </div>
      </div>
    ),
    { ...size }
  )
}

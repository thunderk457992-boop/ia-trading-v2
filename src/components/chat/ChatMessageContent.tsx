import { ChatPortfolioCard, type PortfolioPlan } from "./ChatPortfolioCard"
import { ChatDcaCard, type DcaPlan } from "./ChatDcaCard"

type Segment =
  | { kind: "text"; content: string }
  | { kind: "portfolio"; plan: PortfolioPlan }
  | { kind: "dca"; plan: DcaPlan }

const TAGS = [
  { open: "[PORTFOLIO]", close: "[/PORTFOLIO]", kind: "portfolio" as const },
  { open: "[DCA]",       close: "[/DCA]",       kind: "dca"       as const },
]

// Validate parsed JSON is a usable PortfolioPlan — silently drop if malformed
function isValidPortfolio(data: unknown): data is PortfolioPlan {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    Array.isArray(d.assets) &&
    d.assets.length > 0 &&
    typeof (d.assets[0] as Record<string, unknown>)?.symbol === "string"
  )
}

// Validate parsed JSON is a usable DcaPlan — silently drop if malformed
function isValidDca(data: unknown): data is DcaPlan {
  if (!data || typeof data !== "object") return false
  const d = data as Record<string, unknown>
  return (
    typeof d.total === "number" &&
    typeof d.frequency === "string" &&
    Array.isArray(d.breakdown) &&
    d.breakdown.length > 0
  )
}

function parse(raw: string): Segment[] {
  const out: Segment[] = []
  let rest = raw

  while (rest.length > 0) {
    let best: { idx: number; tag: typeof TAGS[number]; json: string } | null = null

    for (const tag of TAGS) {
      const start = rest.indexOf(tag.open)
      if (start === -1) continue
      const end = rest.indexOf(tag.close, start)
      if (end === -1) continue
      const json = rest.slice(start + tag.open.length, end).trim()
      if (!best || start < best.idx) best = { idx: start, tag, json }
    }

    if (!best) {
      const t = rest.trim()
      if (t) out.push({ kind: "text", content: t })
      break
    }

    // Text before the block
    const before = rest.slice(0, best.idx).trim()
    if (before) out.push({ kind: "text", content: before })

    // Parse and validate — silently drop malformed blocks (never show raw JSON)
    try {
      const parsed: unknown = JSON.parse(best.json)
      if (best.tag.kind === "portfolio" && isValidPortfolio(parsed)) {
        out.push({ kind: "portfolio", plan: parsed })
      } else if (best.tag.kind === "dca" && isValidDca(parsed)) {
        out.push({ kind: "dca", plan: parsed })
      }
      // If validation fails, block is silently dropped (no raw JSON shown)
    } catch {
      // JSON parse error — block silently dropped
    }

    // Advance past closing tag
    const closeEnd = rest.indexOf(best.tag.close, best.idx) + best.tag.close.length
    rest = rest.slice(closeEnd)
  }

  return out
}

export function ChatMessageContent({ content }: { content: string }) {
  const segments = parse(content)

  return (
    <div className="space-y-2">
      {segments.map((seg, i) => {
        if (seg.kind === "text") {
          const text = seg.content.trim()
          if (!text) return null
          return (
            <p key={i} className="whitespace-pre-wrap text-sm leading-6">
              {text}
            </p>
          )
        }
        if (seg.kind === "portfolio") {
          return <ChatPortfolioCard key={i} plan={seg.plan} />
        }
        if (seg.kind === "dca") {
          return <ChatDcaCard key={i} plan={seg.plan} />
        }
        return null
      })}
    </div>
  )
}

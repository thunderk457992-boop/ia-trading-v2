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

function parse(raw: string): Segment[] {
  const out: Segment[] = []
  let rest = raw

  while (rest.length > 0) {
    // Find the earliest opening tag
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
      // No more structured blocks — rest is plain text
      const t = rest.trim()
      if (t) out.push({ kind: "text", content: t })
      break
    }

    // Text before the block
    const before = rest.slice(0, best.idx).trim()
    if (before) out.push({ kind: "text", content: before })

    // Parse JSON block
    try {
      const parsed = JSON.parse(best.json)
      out.push({ kind: best.tag.kind, plan: parsed } as Segment)
    } catch {
      // Unparseable — show raw text
      if (best.json.trim()) out.push({ kind: "text", content: best.json })
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

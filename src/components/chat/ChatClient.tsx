"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowUp, Bot, Loader2, Lock, MessageSquare, ShieldAlert, Sparkles, Zap } from "lucide-react"
import { CHAT_PLAN_CONFIG, type ChatPlan, type ChatUsage } from "@/lib/chat"
import { type MarketDecision } from "@/lib/market-agent"
import { cn } from "@/lib/utils"

interface ChatClientProps {
  plan: ChatPlan
  initialUsage: ChatUsage
  latestAnalysisAt: string | null
  initialMarketDecision: MarketDecision | null
}

interface ChatMessage {
  id: string
  role: "assistant" | "user"
  content: string
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  }
}

function formatDate(date: string | null): string {
  if (!date) return "Pas encore d’analyse"

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

const QUICK_ACTIONS = [
  { label: "Je veux investir 50€", message: "Je veux commencer à investir 50€ en crypto. Par où commencer ?" },
  { label: "Limiter le risque", message: "Comment limiter mes risques en crypto ? Je débute." },
  { label: "BTC / ETH — c'est quoi ?", message: "Explique-moi simplement la différence entre Bitcoin et Ethereum." },
  { label: "Plan DCA", message: "Fais-moi un plan DCA simple pour débuter avec un petit budget." },
  { label: "Explique plus simplement", message: "Explique ta dernière réponse plus simplement, comme si j'avais zéro expérience." },
]

export function ChatClient({ plan, initialUsage, latestAnalysisAt, initialMarketDecision }: ChatClientProps) {
  const planConfig = CHAT_PLAN_CONFIG[plan]
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      latestAnalysisAt
        ? "Bonjour ! Je peux reprendre ta dernière analyse, t'expliquer un terme crypto ou t'aider à décider de la prochaine étape. Pose ta question."
        : "Bonjour ! Je peux t'expliquer les bases crypto, t'aider à structurer une première stratégie ou répondre à tes questions. Pose ta question."
    ),
  ])
  const [input, setInput] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [usage, setUsage] = useState<ChatUsage>(initialUsage)
  const [isLoading, setIsLoading] = useState(false)
  const [marketDecision, setMarketDecision] = useState<MarketDecision | null>(initialMarketDecision)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const isNearQuota = useMemo(() => {
    return usage.limit !== null && usage.remaining !== null && usage.remaining <= 3
  }, [usage.limit, usage.remaining])

  useEffect(() => {
    const viewport = scrollRef.current
    if (!viewport) return
    viewport.scrollTop = viewport.scrollHeight
  }, [messages, isLoading, error])

  const handleTextareaFocus = () => {
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }, 150)
  }

  const submitMessage = async (rawMessage?: string) => {
    const nextMessage = (rawMessage ?? input).trim()
    if (!nextMessage || isLoading) return

    const nextUserMessage = createMessage("user", nextMessage)
    const requestHistory = messages.map(({ role, content }) => ({ role, content }))

    setMessages((current) => [...current, nextUserMessage])
    setInput("")
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextMessage,
          history: requestHistory,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || "Le chat est temporairement indisponible.")
      }

      setMessages((current) => [...current, createMessage("assistant", data.reply)])
      if (data.usage) setUsage(data.usage)
      if (data.marketDecision) setMarketDecision(data.marketDecision)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le chat a rencontré une erreur.")
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }

  return (
    <div className="mx-auto max-w-6xl animate-slide-up pb-2">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-card-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat IA
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl md:text-4xl">
            Pose ta question. Obtiens une réponse claire.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
            Répond simplement, sur ta stratégie, tes analyses ou les bases crypto. Sans jargon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Plan {planConfig.label} · {usage.limit === null ? "illimité" : `${usage.remaining ?? 0} messages restants`}
          </span>
          {latestAnalysisAt && (
            <span className="hidden rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground sm:inline-flex">
              Analyse du {formatDate(latestAnalysisAt)} disponible
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-6">
        <section className="overflow-hidden rounded-[28px] border border-border bg-card shadow-card sm:rounded-3xl">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="text-sm font-medium text-foreground">Conversation</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-1",
                isNearQuota ? "border-amber-200 bg-amber-50 text-amber-700" : "border-border bg-secondary text-muted-foreground"
              )}>
                <Sparkles className="h-3 w-3" />
                {usage.limit === null ? `${usage.used} message(s) envoyés` : `${usage.used}/${usage.limit} utilisés`}
              </span>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="min-h-[160px] max-h-[38svh] space-y-4 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#fafafa_100%)] px-3 py-4 sm:min-h-[440px] sm:max-h-[68vh] sm:px-6 sm:py-5"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[94%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 shadow-card-xs sm:max-w-[80%] sm:px-4 sm:py-3 sm:text-sm",
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-foreground"
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] opacity-70">
                    {message.role === "user" ? "Vous" : (
                      <>
                        <Bot className="h-3.5 w-3.5" />
                        Axiom IA
                      </>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-card px-3.5 py-2.5 text-[13px] text-muted-foreground shadow-card-xs sm:px-4 sm:py-3 sm:text-sm">
                  <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    <Bot className="h-3.5 w-3.5" />
                    Axiom IA
                  </div>
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Réponse en cours...
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm sm:px-6 safe-area-bottom">
            {error && (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">Message non envoyé</p>
                    <p className="mt-1">{error}</p>
                    {planConfig.upgradeMessage && (
                      <Link href="/pricing" className="mt-2 inline-flex items-center gap-1 font-medium underline underline-offset-4">
                        Débloquer plus d’accès
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick action chips */}
            <div className="mb-3 flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void submitMessage(action.message)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-40"
                >
                  <Zap className="h-3 w-3 text-muted-foreground" />
                  {action.label}
                </button>
              ))}
            </div>

            <div className="rounded-3xl border border-border bg-background p-1.5 shadow-card-xs sm:p-2">
              <div className="flex flex-col gap-3">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      void submitMessage()
                    }
                  }}
                  placeholder="Pose ta question... ex : comment investir 100€ en crypto sans trop risquer ?"
                  className="min-h-[72px] w-full resize-none rounded-2xl border-0 bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground sm:min-h-[88px]"
                  disabled={isLoading}
                  onFocus={handleTextareaFocus}
                />
                <div className="flex flex-col gap-3 px-2 pb-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => void submitMessage()}
                    disabled={isLoading || !input.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-foreground px-4 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:py-2.5"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                    Envoyer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Inclus sur votre plan</p>
            <ul className="mt-4 space-y-3">
              {planConfig.features.map((feature) => (
                <li key={feature} className="text-sm leading-6 text-foreground">
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {planConfig.locked.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Non inclus sur ce plan</p>
              </div>
              <ul className="mt-4 space-y-3">
                {planConfig.locked.map((feature) => (
                  <li key={feature} className="text-sm leading-6 text-muted-foreground">
                    {feature}
                  </li>
                ))}
              </ul>
              {planConfig.upgradeMessage && (
                <Link
                  href="/pricing"
                  className="mt-4 inline-flex items-center text-sm font-medium text-foreground underline underline-offset-4"
                >
                  {planConfig.upgradeMessage}
                </Link>
              )}
            </div>
          )}

          <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Suggestions</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {planConfig.suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void submitMessage(suggestion)}
                  disabled={isLoading}
                  className="rounded-2xl border border-border bg-secondary px-3 py-2 text-left text-xs leading-5 text-foreground transition-colors hover:bg-secondary/70 disabled:opacity-50 sm:rounded-full"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Mon contexte</p>
            <div className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
              {latestAnalysisAt ? (
                <p>Dernière analyse du {formatDate(latestAnalysisAt)} disponible.</p>
              ) : (
                <p>Pas encore d’analyse personnelle.</p>
              )}
              <p className="text-xs">Le chat ne devine pas — il dit clairement si une info manque.</p>
            </div>
            {!latestAnalysisAt && (
              <Link href="/advisor" className="mt-4 inline-flex items-center text-sm font-medium text-foreground underline underline-offset-4">
                Faire ma première analyse →
              </Link>
            )}
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Signal marché</p>
            {marketDecision ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{marketDecision.label}</p>
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
                    marketDecision.riskLevel === "prudent"
                      ? "bg-amber-50 text-amber-700"
                      : marketDecision.riskLevel === "opportuniste"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-secondary text-foreground"
                  )}>
                    {marketDecision.riskLevel}
                  </span>
                </div>
                <p className="text-sm leading-6 text-muted-foreground">{marketDecision.strategy}</p>
                <div className="rounded-2xl border border-border bg-secondary px-3 py-2 text-xs text-foreground">
                  BTC {marketDecision.allocation.BTC}% · ETH {marketDecision.allocation.ETH}% · Autres {marketDecision.allocation.ALT}%
                </div>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Signal marché indisponible pour l’instant.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}

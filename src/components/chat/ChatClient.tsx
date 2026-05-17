"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowUp, Bot, Lock, MessageSquare, ShieldAlert, Sparkles, Zap,
  SlidersHorizontal, Brain,
} from "lucide-react"
import { CHAT_PLAN_CONFIG, type ChatPlan, type ChatUsage } from "@/lib/chat"
import { type MarketDecision } from "@/lib/market-agent"
import { cn } from "@/lib/utils"
import { ChatMessageContent } from "./ChatMessageContent"

// ── Types ──────────────────────────────────────────────────────────────────

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

// User context learned from the conversation (session-only)
interface UserMemory {
  budget?: string
  risk?: string
  horizon?: string
  dca?: boolean
  firstProfile?: boolean // has given us enough to personalise
}

// ── Constants ──────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Explique mon allocation", message: "Peux-tu m'expliquer simplement pourquoi cette allocation a été choisie pour mon profil ?" },
  { label: "Pourquoi autant de BTC ?", message: "Pourquoi BTC a une aussi grande part dans mon allocation ? C'est vraiment nécessaire ?" },
  { label: "Si le marché baisse", message: "Que faire si le marché crypto baisse de 20% dans les prochaines semaines ?" },
  { label: "Premier investissement", message: "Je veux commencer à investir en crypto. Par où commencer avec un budget limité ?" },
  { label: "DCA vs lump-sum", message: "Vaut-il mieux investir tout d'un coup ou progressivement en DCA ?" },
  { label: "Risque altcoins", message: "Pourquoi les altcoins sont-ils plus risqués que Bitcoin ou Ethereum ?" },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
  }
}

function formatDate(date: string | null): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }).format(new Date(date))
}

// Extract lightweight user context from the conversation
function extractMemory(messages: ChatMessage[]): UserMemory {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content.toLowerCase())
    .join(" ")

  const allText = messages.map((m) => m.content.toLowerCase()).join(" ")

  const mem: UserMemory = {}

  // Budget: detect "X€" or "X euros"
  const budgetMatch = userText.match(/(\d{2,6})\s*(?:€|euros?)/)
  if (budgetMatch) mem.budget = `${budgetMatch[1]}€`

  // Risk
  if (/(prudent|limiter.{0,10}risque|pas trop risqu|securis|safe)/.test(userText)) mem.risk = "prudent"
  else if (/(agress|maxim|tout risqu|maximal)/.test(userText)) mem.risk = "agressif"
  else if (/(equilibr|modér|moyen)/.test(userText)) mem.risk = "équilibré"

  // Horizon
  if (/(long term|5 ans|10 ans|retraite|patrimoine)/.test(userText)) mem.horizon = "long terme"
  else if (/(court term|quelques mois|1 an|rapidement)/.test(userText)) mem.horizon = "court terme"

  // DCA preference
  if (/(dca|progressiv|chaque sem|chaque mois|hebdo|mensuel|régulier)/.test(allText)) mem.dca = true

  mem.firstProfile = Boolean(mem.budget || mem.risk || mem.horizon)

  return mem
}

// Format memory for the system prompt
function memoryToString(mem: UserMemory): string {
  const lines: string[] = []
  if (mem.budget)  lines.push(`Budget mentionné : ${mem.budget}`)
  if (mem.risk)    lines.push(`Profil risque : ${mem.risk}`)
  if (mem.horizon) lines.push(`Horizon : ${mem.horizon}`)
  if (mem.dca)     lines.push("Préfère investir progressivement (DCA)")
  return lines.join("\n")
}

// ── Typing indicator ───────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

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

  const [input, setInput]             = useState("")
  const [error, setError]             = useState<string | null>(null)
  const [usage, setUsage]             = useState<ChatUsage>(initialUsage)
  const [isLoading, setIsLoading]     = useState(false)
  const [advanced, setAdvanced]       = useState(false)
  const [marketDecision, setMarketDecision] = useState<MarketDecision | null>(initialMarketDecision)

  const scrollRef   = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  // Session memory — derived from conversation, never persisted
  const userMemory = useMemo(() => extractMemory(messages), [messages])
  const memoryString = useMemo(() => memoryToString(userMemory), [userMemory])

  const isNearQuota = usage.limit !== null && usage.remaining !== null && usage.remaining <= 3

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, isLoading, error])

  const handleTextareaFocus = () => {
    setTimeout(() => textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 150)
  }

  const submitMessage = useCallback(async (rawMessage?: string) => {
    const nextMessage = (rawMessage ?? input).trim()
    if (!nextMessage || isLoading) return

    const requestHistory = messages.map(({ role, content }) => ({ role, content }))

    setMessages((prev) => [...prev, createMessage("user", nextMessage)])
    setInput("")
    setError(null)
    setIsLoading(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextMessage,
          history: requestHistory,
          advanced,
          userMemory: memoryString,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Le chat est temporairement indisponible.")

      setMessages((prev) => [...prev, createMessage("assistant", data.reply)])
      if (data.usage) setUsage(data.usage)
      if (data.marketDecision) setMarketDecision(data.marketDecision)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Le chat a rencontré une erreur.")
    } finally {
      setIsLoading(false)
      textareaRef.current?.focus()
    }
  }, [input, isLoading, messages, advanced, memoryString])

  return (
    <div className="mx-auto max-w-6xl animate-slide-up pb-4">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="mb-6 flex flex-col gap-3 sm:mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground shadow-card-xs">
            <MessageSquare className="h-3.5 w-3.5" />
            Chat IA
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Pose ta question. Obtiens une réponse claire.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Répond simplement sur ta stratégie, tes analyses ou les bases crypto.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-3 py-1.5 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            {planConfig.label} · {usage.limit === null ? "illimité" : `${usage.remaining ?? 0} restants`}
          </span>

          {/* Simple / Advanced toggle */}
          <button
            type="button"
            onClick={() => setAdvanced((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
              advanced
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-secondary text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="h-3 w-3" />
            {advanced ? "Mode avancé" : "Mode simple"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_288px] xl:grid-cols-[minmax(0,1fr)_308px] xl:gap-5">

        {/* ── Chat window ──────────────────────────────────── */}
        <section className="surface-card overflow-hidden sm:rounded-3xl">

          {/* Conversation header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
            <p className="text-sm font-medium text-foreground">Conversation</p>
            <span className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              isNearQuota ? "border-amber-200 bg-amber-50 text-amber-700" : "border-border bg-secondary text-muted-foreground"
            )}>
              <Sparkles className="h-3 w-3" />
              {usage.limit === null ? `${usage.used} envoyés` : `${usage.used}/${usage.limit}`}
            </span>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="min-h-[200px] max-h-[42svh] overflow-y-auto overscroll-contain bg-[linear-gradient(180deg,#fff_0%,#fafafa_100%)] px-3 py-4 sm:min-h-[420px] sm:max-h-[62vh] sm:px-5 sm:py-5"
          >
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[92%] rounded-2xl px-4 py-3 shadow-card-xs sm:max-w-[82%]",
                    message.role === "user"
                      ? "bg-foreground text-background"
                      : "border border-border bg-card text-foreground"
                  )}>
                    {/* Role label */}
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] opacity-50">
                      {message.role === "user" ? "Toi" : <><Bot className="h-3 w-3" />Axiom IA</>}
                    </div>

                    {/* Content — plain text for user, parsed for assistant */}
                    {message.role === "user" ? (
                      <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                    ) : (
                      <ChatMessageContent content={message.content} />
                    )}
                  </div>
                </div>
              ))}

              {/* Loading — typing dots */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-card-xs">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/50">
                      <Bot className="h-3 w-3" />Axiom IA
                    </div>
                    <TypingDots />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-border bg-card/95 px-4 py-4 backdrop-blur-sm sm:px-5 safe-area-bottom">
            {/* Error */}
            {error && (
              <div className="mb-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <div className="flex items-start gap-2">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-semibold">Message non envoyé</p>
                    <p className="mt-0.5 text-xs">{error}</p>
                    {planConfig.upgradeMessage && (
                      <Link href="/pricing" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold underline underline-offset-4">
                        Débloquer plus d&apos;accès →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Quick action chips */}
            <div className="mb-3 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={() => void submitMessage(action.message)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary px-2.5 py-1.5 text-[11px] font-semibold text-foreground transition-colors hover:bg-secondary/70 active:scale-95 disabled:opacity-40"
                >
                  <Zap className="h-2.5 w-2.5 text-muted-foreground" />
                  {action.label}
                </button>
              ))}
            </div>

            {/* Textarea + send */}
            <div className="rounded-3xl border border-border bg-background p-1.5 shadow-card-xs">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submitMessage() }
                }}
                placeholder="Pose ta question… ex : comment investir 100€ sans trop risquer ?"
                rows={3}
                className="w-full resize-none rounded-2xl border-0 bg-transparent px-3 py-3 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                disabled={isLoading}
                onFocus={handleTextareaFocus}
              />
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-[11px] text-muted-foreground/60">Shift+Entrée pour aller à la ligne</span>
                <button
                  type="button"
                  onClick={() => void submitMessage()}
                  disabled={isLoading || !input.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition-colors hover:bg-foreground/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowUp className="h-4 w-4" />
                  Envoyer
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sidebar ───────────────────────────────────────── */}
        <aside className="space-y-3">

          {/* User memory — shown only when we have learned something */}
          {userMemory.firstProfile && (
            <div className="surface-card p-4">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Ce que je retiens</p>
              </div>
              <div className="space-y-1.5">
                {userMemory.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                    <span className="text-foreground font-medium">Budget :</span>
                    <span className="text-muted-foreground">{userMemory.budget}</span>
                  </div>
                )}
                {userMemory.risk && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                    <span className="text-foreground font-medium">Profil :</span>
                    <span className="text-muted-foreground">{userMemory.risk}</span>
                  </div>
                )}
                {userMemory.horizon && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-foreground/40 shrink-0" />
                    <span className="text-foreground font-medium">Horizon :</span>
                    <span className="text-muted-foreground">{userMemory.horizon}</span>
                  </div>
                )}
                {userMemory.dca && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500 shrink-0" />
                    <span className="text-muted-foreground">Investissement progressif (DCA)</span>
                  </div>
                )}
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground/60">Session uniquement · non stocké</p>
            </div>
          )}

          {/* Plan features */}
          <div className="surface-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Ton plan</p>
            <ul className="mt-3 space-y-2">
              {planConfig.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Locked features */}
          {planConfig.locked.length > 0 && (
            <div className="surface-card p-4">
              <div className="flex items-center gap-1.5 mb-3">
                <Lock className="h-3 w-3 text-muted-foreground" />
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Non inclus</p>
              </div>
              <ul className="space-y-2">
                {planConfig.locked.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border" />
                    {f}
                  </li>
                ))}
              </ul>
              {planConfig.upgradeMessage && (
                <Link href="/pricing" className="mt-3 inline-flex items-center text-xs font-semibold text-foreground underline underline-offset-4">
                  {planConfig.upgradeMessage}
                </Link>
              )}
            </div>
          )}

          {/* Context */}
          <div className="surface-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Mon contexte</p>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <p>{latestAnalysisAt ? `Dernière analyse : ${formatDate(latestAnalysisAt)}` : "Pas encore d'analyse."}</p>
              <p className="text-xs text-muted-foreground/60">Données réelles · aucune invention</p>
            </div>
            {!latestAnalysisAt && (
              <Link href="/advisor" className="mt-3 inline-flex items-center text-xs font-semibold text-foreground underline underline-offset-4">
                Faire ma première analyse →
              </Link>
            )}
          </div>

          {/* Market signal */}
          <div className="surface-card p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Signal marché</p>
            {marketDecision ? (
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{marketDecision.label}</p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    marketDecision.riskLevel === "prudent"     ? "bg-amber-50 text-amber-700"
                    : marketDecision.riskLevel === "opportuniste" ? "bg-emerald-50 text-emerald-700"
                    : "bg-secondary text-foreground"
                  )}>
                    {marketDecision.riskLevel}
                  </span>
                </div>
                <p className="text-xs leading-5 text-muted-foreground">{marketDecision.strategy}</p>
                <div className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-medium text-foreground">
                  BTC {marketDecision.allocation.BTC}% · ETH {marketDecision.allocation.ETH}% · Autres {marketDecision.allocation.ALT}%
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">Signal indisponible.</p>
            )}
          </div>

          {/* Plan suggestions */}
          <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Questions fréquentes</p>
            <div className="mt-3 flex flex-col gap-1.5">
              {planConfig.suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void submitMessage(s)}
                  disabled={isLoading}
                  className="rounded-xl border border-border bg-secondary px-3 py-2.5 text-left text-xs font-medium leading-5 text-foreground transition-colors hover:bg-secondary/70 active:scale-[0.98] disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  )
}

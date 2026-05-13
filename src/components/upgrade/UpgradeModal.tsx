"use client"

import * as Dialog from "@radix-ui/react-dialog"
import Link from "next/link"
import { ArrowRight, CheckCircle2, CreditCard, Lock, Shield, X, Zap, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { UpgradeFeature } from "@/lib/upgrade-features"

interface UpgradeModalProps {
  feature: UpgradeFeature
  open: boolean
  onClose: () => void
}

const TARGET_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pro: {
    label: "Pro",
    color: "border-border bg-foreground text-background",
    icon: <Zap className="h-3.5 w-3.5" />,
  },
  premium: {
    label: "Premium",
    color: "border-amber-300 bg-amber-50 text-amber-800",
    icon: <Crown className="h-3.5 w-3.5" />,
  },
}

const PRICING: Record<string, { monthly: string; yearly: string }> = {
  pro: { monthly: "24,99€/mois", yearly: "219,99€/an" },
  premium: { monthly: "59,99€/mois", yearly: "499,99€/an" },
}

export function UpgradeModal({ feature, open, onClose }: UpgradeModalProps) {
  const targetInfo = TARGET_LABELS[feature.target] ?? TARGET_LABELS.pro
  const pricing = PRICING[feature.target]

  return (
    <Dialog.Root open={open} onOpenChange={(v) => { if (!v) onClose() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-fade-in" />
        <Dialog.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 w-full max-w-md rounded-t-3xl border border-border bg-card shadow-2xl",
            "sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:top-1/2 sm:-translate-y-1/2 sm:bottom-auto sm:rounded-3xl",
            "focus:outline-none data-[state=open]:animate-slide-up"
          )}
          aria-describedby="upgrade-modal-desc"
        >
          {/* Close */}
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-border bg-secondary">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
              <div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]",
                  targetInfo.color
                )}>
                  {targetInfo.icon}
                  {targetInfo.label}
                </span>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-5 py-5">
            <Dialog.Title className="text-xl font-semibold tracking-tight text-foreground">
              {feature.title}
            </Dialog.Title>
            <Dialog.Description id="upgrade-modal-desc" className="mt-2 text-sm leading-6 text-muted-foreground">
              {feature.description}
            </Dialog.Description>

            <ul className="mt-4 space-y-2.5">
              {feature.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-foreground" />
                  <span className="text-sm leading-6 text-muted-foreground">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Pricing hint */}
            {pricing && (
              <div className="mt-5 rounded-2xl border border-border bg-secondary/60 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tarif {targetInfo.label}</p>
                <p className="mt-1 text-sm font-semibold text-foreground">{pricing.monthly}</p>
                <p className="text-[11px] text-muted-foreground">ou {pricing.yearly} · sans engagement</p>
              </div>
            )}

            {/* CTAs */}
            <div className="mt-5 flex flex-col gap-3">
              <Link
                href="/pricing"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-2xl bg-foreground px-5 py-3 text-sm font-semibold text-background transition-opacity hover:opacity-85"
              >
                {feature.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Voir toutes les offres
              </button>
            </div>

            {/* Trust signals */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <CreditCard className="h-3.5 w-3.5" />
                <span>Paiement Stripe sécurisé</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <Shield className="h-3.5 w-3.5" />
                <span>Annulable à tout moment</span>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ── Hook utilitaire pour gérer l'état modal ──────────────────────────────────

import { useState } from "react"
import { getUpgradeFeature } from "@/lib/upgrade-features"

export function useUpgradeModal() {
  const [activeFeatureId, setActiveFeatureId] = useState<string | null>(null)
  const feature = activeFeatureId ? getUpgradeFeature(activeFeatureId) : null

  return {
    open: (featureId: string) => setActiveFeatureId(featureId),
    close: () => setActiveFeatureId(null),
    feature,
    isOpen: activeFeatureId !== null,
    activeFeatureId,
  }
}

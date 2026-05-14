import { Brain, Database, Lock, RefreshCw, Shield, TrendingUp } from "lucide-react"

interface SocialProofStripProps {
  btcPrice?: number | null
  btcChange24h?: number | null
  marketCapT?: number | null
  btcDominance?: number | null
}

export function SocialProofStrip({ btcPrice, btcChange24h, marketCapT, btcDominance }: SocialProofStripProps) {
  const haslive = btcPrice && btcPrice > 0

  const signals = [
    {
      icon: Database,
      label: haslive
        ? `BTC ${btcPrice! >= 1000 ? `$${Math.round(btcPrice!).toLocaleString("en-US")}` : `$${btcPrice!.toFixed(2)}`}`
        : "Prix live CoinGecko + Kraken",
      sub: haslive && btcChange24h !== null && btcChange24h !== undefined
        ? `${btcChange24h >= 0 ? "+" : ""}${btcChange24h.toFixed(1)}% 24h`
        : "Données actualisées automatiquement",
    },
    {
      icon: TrendingUp,
      label: haslive && btcDominance
        ? `Dominance BTC ${btcDominance.toFixed(1)}%`
        : "Dominance BTC en temps réel",
      sub: "Lecture du régime de marché",
    },
    {
      icon: Brain,
      label: "Claude AI Anthropic",
      sub: "Haiku → Sonnet → Opus selon le plan",
    },
    {
      icon: Shield,
      label: "Paiement Stripe sécurisé",
      sub: "Annulable à tout moment",
    },
    {
      icon: Lock,
      label: "Aucune donnée vendue",
      sub: "Auth Supabase · données chiffrées",
    },
    {
      icon: RefreshCw,
      label: haslive && marketCapT
        ? `$${marketCapT.toFixed(2)}T de capitalisation`
        : "Capitalisation totale du marché",
      sub: "Mise à jour toutes les 5 minutes",
    },
  ]

  return (
    <div className="overflow-hidden border-y border-border bg-secondary/50">
      <div className="flex animate-none">
        <div className="flex shrink-0 items-center gap-0 divide-x divide-border overflow-x-auto scrollbar-hide">
          {signals.map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex shrink-0 items-center gap-3 px-6 py-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border bg-card">
                <Icon className="h-3.5 w-3.5 text-foreground" />
              </div>
              <div>
                <p className="text-[12px] font-semibold text-foreground whitespace-nowrap">{label}</p>
                <p className="text-[10px] text-muted-foreground whitespace-nowrap">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

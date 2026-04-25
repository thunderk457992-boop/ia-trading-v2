import Stripe from "stripe"

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-03-25.dahlia",
    })
  }
  return _stripe
}

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

export const PLANS = {
  free: {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    priceId: { monthly: null, yearly: null },
    features: [
      "1 analyse IA par mois",
      "Allocation et plan d'action de base",
      "Tableau de bord marché",
      "Historique limité à 3 analyses",
    ],
    limits: { aiAnalysis: 1, portfolios: 1 },
  },
  pro: {
    name: "Pro",
    price: { monthly: 24.99, yearly: 219.99 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    features: [
      "20 analyses IA par mois",
      "Historique étendu à 10 analyses",
      "Signal marché et verdict Pro",
      "Plan dans le temps",
      "Rapports PDF",
    ],
    limits: { aiAnalysis: 20, portfolios: 3 },
  },
  premium: {
    name: "Premium",
    price: { monthly: 59.99, yearly: 499.99 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
    features: [
      "Analyses IA illimitées",
      "Historique complet à 20 analyses",
      "Lecture de marché approfondie",
      "Stratégie d'entrée avancée",
      "Projections et alertes de risque",
    ],
    limits: { aiAnalysis: -1, portfolios: -1 },
  },
} as const

export type PlanType = keyof typeof PLANS

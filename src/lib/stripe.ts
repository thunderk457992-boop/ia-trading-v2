import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
})

export const PLANS = {
  free: {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    priceId: { monthly: null, yearly: null },
    features: [
      "1 analyse IA par mois",
      "Portfolio basique",
      "Données en temps réel (délai 15min)",
      "Support email",
    ],
    limits: { aiAnalysis: 1, portfolios: 1 },
  },
  pro: {
    name: "Pro",
    price: { monthly: 29, yearly: 290 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PRO_YEARLY,
    },
    features: [
      "20 analyses IA par mois",
      "3 portfolios illimités",
      "Données temps réel",
      "Alertes de prix",
      "Rapports PDF",
      "Support prioritaire",
    ],
    limits: { aiAnalysis: 20, portfolios: 3 },
  },
  premium: {
    name: "Premium",
    price: { monthly: 79, yearly: 790 },
    priceId: {
      monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
      yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
    },
    features: [
      "Analyses IA illimitées",
      "Portfolios illimités",
      "Données temps réel + historique",
      "Signaux de trading avancés",
      "API access",
      "Gestionnaire de compte dédié",
      "Accès bêta aux nouvelles fonctionnalités",
    ],
    limits: { aiAnalysis: -1, portfolios: -1 },
  },
} as const

export type PlanType = keyof typeof PLANS

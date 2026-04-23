export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: "free" | "pro" | "premium"
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

export interface InvestorProfile {
  id: string
  user_id: string
  risk_tolerance: "conservative" | "moderate" | "aggressive"
  investment_horizon: "short" | "medium" | "long"
  initial_capital: number
  monthly_contribution: number
  investment_goals: string[]
  excluded_cryptos: string[]
  preferred_sectors: string[]
  created_at: string
  updated_at: string
}

export interface PortfolioAllocation {
  symbol: string
  name: string
  percentage: number
  rationale: string
  risk_level: "low" | "medium" | "high"
  expected_return: string
  category: string
}

export interface AIAnalysis {
  id: string
  user_id: string
  investor_profile: InvestorProfile
  allocations: PortfolioAllocation[]
  total_score: number
  market_context: string
  recommendations: string[]
  warnings: string[]
  created_at: string
}

export type { CryptoPrice } from "@/lib/coingecko"

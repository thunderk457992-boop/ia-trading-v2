export interface CryptoUniverseAsset {
  symbol: string
  name: string
  coingeckoId: string
  aliases?: string[]
  categories: string[]
  krakenBaseCandidates: string[]
}

export const TRACKED_CRYPTO_UNIVERSE: CryptoUniverseAsset[] = [
  { symbol: "BTC", name: "Bitcoin", coingeckoId: "bitcoin", aliases: ["XBT"], categories: ["Large cap", "Reserve"], krakenBaseCandidates: ["BTC", "XBT"] },
  { symbol: "ETH", name: "Ethereum", coingeckoId: "ethereum", categories: ["Large cap", "Layer 1", "DeFi", "Infrastructure"], krakenBaseCandidates: ["ETH", "XETH"] },
  { symbol: "SOL", name: "Solana", coingeckoId: "solana", categories: ["Large cap", "Layer 1"], krakenBaseCandidates: ["SOL"] },
  { symbol: "XRP", name: "XRP", coingeckoId: "ripple", categories: ["Large cap", "Payments"], krakenBaseCandidates: ["XRP"] },
  { symbol: "BNB", name: "BNB", coingeckoId: "binancecoin", categories: ["Large cap", "Exchange", "Infrastructure"], krakenBaseCandidates: ["BNB"] },
  { symbol: "ADA", name: "Cardano", coingeckoId: "cardano", categories: ["Layer 1"], krakenBaseCandidates: ["ADA"] },
  { symbol: "DOGE", name: "Dogecoin", coingeckoId: "dogecoin", aliases: ["XDG"], categories: ["Memecoin"], krakenBaseCandidates: ["DOGE", "XDG"] },
  { symbol: "AVAX", name: "Avalanche", coingeckoId: "avalanche-2", categories: ["Layer 1"], krakenBaseCandidates: ["AVAX"] },
  { symbol: "LINK", name: "Chainlink", coingeckoId: "chainlink", categories: ["Infrastructure", "Oracle"], krakenBaseCandidates: ["LINK"] },
  { symbol: "DOT", name: "Polkadot", coingeckoId: "polkadot", categories: ["Infrastructure", "Layer 1"], krakenBaseCandidates: ["DOT"] },
  { symbol: "ATOM", name: "Cosmos", coingeckoId: "cosmos", categories: ["Infrastructure", "Layer 1"], krakenBaseCandidates: ["ATOM"] },
  { symbol: "AAVE", name: "Aave", coingeckoId: "aave", categories: ["DeFi"], krakenBaseCandidates: ["AAVE"] },
  { symbol: "UNI", name: "Uniswap", coingeckoId: "uniswap", categories: ["DeFi"], krakenBaseCandidates: ["UNI"] },
  { symbol: "LTC", name: "Litecoin", coingeckoId: "litecoin", categories: ["Payments", "Large cap"], krakenBaseCandidates: ["LTC"] },
  { symbol: "BCH", name: "Bitcoin Cash", coingeckoId: "bitcoin-cash", categories: ["Payments"], krakenBaseCandidates: ["BCH"] },
  { symbol: "ETC", name: "Ethereum Classic", coingeckoId: "ethereum-classic", categories: ["Layer 1"], krakenBaseCandidates: ["ETC"] },
  { symbol: "XLM", name: "Stellar", coingeckoId: "stellar", categories: ["Payments"], krakenBaseCandidates: ["XLM"] },
  { symbol: "TRX", name: "Tron", coingeckoId: "tron", categories: ["Infrastructure"], krakenBaseCandidates: ["TRX"] },
  { symbol: "FIL", name: "Filecoin", coingeckoId: "filecoin", categories: ["Infrastructure"], krakenBaseCandidates: ["FIL"] },
  { symbol: "NEAR", name: "Near", coingeckoId: "near", categories: ["Layer 1", "AI"], krakenBaseCandidates: ["NEAR"] },
  { symbol: "ALGO", name: "Algorand", coingeckoId: "algorand", categories: ["Layer 1", "Infrastructure"], krakenBaseCandidates: ["ALGO"] },
  { symbol: "POL", name: "POL", coingeckoId: "polygon-ecosystem-token", aliases: ["MATIC"], categories: ["Layer 2", "Infrastructure"], krakenBaseCandidates: ["POL", "MATIC"] },
  { symbol: "ARB", name: "Arbitrum", coingeckoId: "arbitrum", categories: ["Layer 2", "DeFi"], krakenBaseCandidates: ["ARB"] },
  { symbol: "OP", name: "Optimism", coingeckoId: "optimism", categories: ["Layer 2", "Infrastructure"], krakenBaseCandidates: ["OP"] },
  { symbol: "INJ", name: "Injective", coingeckoId: "injective-protocol", categories: ["DeFi", "Infrastructure"], krakenBaseCandidates: ["INJ"] },
  { symbol: "RENDER", name: "Render", coingeckoId: "render-token", aliases: ["RNDR"], categories: ["AI", "Infrastructure"], krakenBaseCandidates: ["RENDER", "RNDR"] },
  { symbol: "FET", name: "Artificial Superintelligence Alliance", coingeckoId: "fetch-ai", aliases: ["ASI"], categories: ["AI"], krakenBaseCandidates: ["FET", "ASI"] },
  { symbol: "PEPE", name: "Pepe", coingeckoId: "pepe", categories: ["Memecoin"], krakenBaseCandidates: ["PEPE"] },
  { symbol: "SUI", name: "Sui", coingeckoId: "sui", categories: ["Layer 1"], krakenBaseCandidates: ["SUI"] },
  { symbol: "SEI", name: "Sei", coingeckoId: "sei-network", categories: ["Layer 1", "Trading"], krakenBaseCandidates: ["SEI"] },
  { symbol: "ONDO", name: "Ondo", coingeckoId: "ondo-finance", categories: ["RWA", "DeFi"], krakenBaseCandidates: ["ONDO"] },
  { symbol: "TAO", name: "Bittensor", coingeckoId: "bittensor", categories: ["AI"], krakenBaseCandidates: ["TAO"] },
  { symbol: "IMX", name: "Immutable", coingeckoId: "immutable-x", categories: ["Gaming", "Layer 2"], krakenBaseCandidates: ["IMX"] },
  { symbol: "GALA", name: "Gala", coingeckoId: "gala", categories: ["Gaming"], krakenBaseCandidates: ["GALA"] },
  { symbol: "HBAR", name: "Hedera", coingeckoId: "hedera-hashgraph", categories: ["Infrastructure"], krakenBaseCandidates: ["HBAR"] },
  { symbol: "KAS", name: "Kaspa", coingeckoId: "kaspa", categories: ["Infrastructure"], krakenBaseCandidates: ["KAS"] },
]

const CATEGORY_MAP = new Map(
  TRACKED_CRYPTO_UNIVERSE.map((asset) => [asset.symbol, asset.categories])
)

const SYMBOL_ALIAS_MAP = new Map<string, string>(
  TRACKED_CRYPTO_UNIVERSE.flatMap((asset) => [
    [asset.symbol, asset.symbol] as const,
    ...(asset.aliases ?? []).map((alias) => [alias, asset.symbol] as const),
  ])
)

export function getTrackedCryptoUniverse() {
  return TRACKED_CRYPTO_UNIVERSE
}

export function getCryptoCategories(symbol: string): string[] {
  const normalized = normalizeTrackedSymbol(symbol)
  return CATEGORY_MAP.get(normalized) ?? ["Large cap"]
}

export function normalizeTrackedSymbol(symbol: string): string {
  const upper = symbol.trim().toUpperCase()
  return SYMBOL_ALIAS_MAP.get(upper) ?? upper
}

export function getUniverseAsset(symbol: string) {
  const normalized = normalizeTrackedSymbol(symbol)
  return TRACKED_CRYPTO_UNIVERSE.find((asset) => asset.symbol === normalized) ?? null
}

export function getTrackedCoingeckoIds() {
  return TRACKED_CRYPTO_UNIVERSE.map((asset) => asset.coingeckoId)
}

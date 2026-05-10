import type { Metadata } from "next"
import { SeoArticlePage } from "@/components/seo/SeoArticlePage"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Crypto Risk Management Guide | Axiom AI",
  description:
    "Explore practical crypto risk management methods: position sizing, diversification, contribution pacing, and portfolio review habits for volatile markets.",
  path: "/crypto-risk-management",
  type: "article",
  keywords: [
    "crypto risk management",
    "bitcoin risk management",
    "crypto portfolio sizing",
    "crypto diversification strategy",
  ],
})

const intro = [
  "Crypto risk management is not a side topic. It is the topic that determines whether the rest of your strategy matters. You can have a strong view on Bitcoin, a detailed thesis on Ethereum, and a well-timed DCA plan, but if position sizing is wrong or the portfolio is too fragile for your own emotions, the strategy will still break under pressure.",
  "This is especially true for investors who want long-term exposure without living inside the market every day. The goal of risk management is not to remove volatility. Crypto will remain volatile. The goal is to make that volatility survivable, understandable, and proportional to your actual capacity. A good product helps by keeping the rules visible. A good investor helps by respecting them when markets get loud.",
]

const sections = [
  {
    title: "Start with position sizing, not asset stories",
    paragraphs: [
      "Most portfolio damage begins with oversizing. Investors usually do not fail because they chose an asset that never moved. They fail because one position became too large relative to their account or their emotional capacity. In crypto, even strong assets can fall sharply. That means the first risk decision is not whether a token is interesting but how much of the portfolio it is allowed to occupy before a drawdown becomes destabilizing.",
      "Position sizing is what connects conviction to reality. Larger, more liquid assets may justify larger weights because they usually have deeper markets and broader adoption. Smaller, narrative-driven assets may deserve a place, but often as controlled satellites rather than portfolio anchors. When your allocation reflects that logic, you are less likely to panic during corrections because the downside was sized into the plan from the beginning.",
    ],
    bullets: [
      "Size the downside before you size the upside.",
      "Let core assets carry more weight than speculative ones.",
      "Keep every position small enough to survive a sharp drawdown.",
    ],
  },
  {
    title: "Diversification should reduce concentration, not just increase the ticker count",
    paragraphs: [
      "Owning five or six crypto assets does not automatically mean you are diversified. Many coins still move with the same market regime, the same liquidity conditions, and the same risk appetite. If they all rely on the same narrative wave, you can end up with a portfolio that looks varied but behaves like a single aggressive bet. That is why diversification should be judged by function and correlation, not by the number of logos in the dashboard.",
      "A more useful approach is to decide what each position is doing for you. A core asset may provide stability relative to the rest of the market. A smaller smart contract asset may give you higher beta. A limited satellite may express a thematic thesis. Once every position has a role, duplication becomes easier to spot. Diversification becomes less about collecting coins and more about preventing a single market shock from dominating the whole portfolio.",
    ],
  },
  {
    title: "Liquidity, time horizon, and contribution pacing matter together",
    paragraphs: [
      "Risk is not just price volatility. It also includes how quickly you may need cash, how long you can wait through a downturn, and how much new capital you can keep contributing if the market stays weak. Someone with a short time horizon should not hold the same mix as someone building over years. Someone without a cash buffer may need a more conservative structure even if their return ambition is high.",
      "Contribution pacing helps here. When you spread entries through time, you reduce the pressure of single-date timing and keep room to adapt. But pacing only works when it is aligned with liquidity. If monthly contributions are too ambitious, the plan breaks. If they are realistic, they become a stabilizer. Good risk management is often a matter of connecting these pieces: the size you can tolerate, the cash you can keep free, and the horizon that gives the portfolio time to recover.",
    ],
  },
  {
    title: "Measure performance honestly to avoid false confidence",
    paragraphs: [
      "A surprising amount of risk comes from bad measurement. If your dashboard mixes market movement with fresh capital, the portfolio can look stronger than it really is. If a chart is derived from generic market data instead of actual portfolio snapshots, it can create false drama or false reassurance. That hurts decision quality because you stop reacting to the real portfolio and start reacting to a distorted picture of it.",
      "The clean approach is to track invested capital separately from portfolio value and to base the curve on real snapshots over time. That way, you can distinguish three things: how much money has gone in, what the portfolio is worth now, and what the market did between one snapshot and the next. Once those numbers are separated, risk conversations become more honest. You can tell whether the pain is coming from volatility, from concentration, or simply from recent contributions changing the base.",
    ],
  },
  {
    title: "How Axiom AI supports crypto risk management",
    paragraphs: [
      "Axiom AI can be useful when it helps investors slow down and make sizing choices explicit. It can turn a rough profile into a structured allocation, make the risk level legible, and keep a historical trail of portfolio snapshots instead of pretending that every timeframe deserves a perfect chart. That kind of transparency matters because risk management works best when the product resists the urge to be theatrical.",
      "For a soft launch or real-world usage, that is the bar worth keeping. If the product says a period has too little history, it should say so. If portfolio history is the source, it should not quietly substitute a generic market curve. If a new contribution changes invested capital, the dashboard should keep the older snapshots in view rather than treating the new money as a performance jump. Those are technical details, but they are also user-trust details, and in a finance product the two are inseparable.",
    ],
  },
]

export default function CryptoRiskManagementPage() {
  return (
    <SeoArticlePage
      eyebrow="Crypto Risk Management"
      title="Crypto risk management for investors who want a durable process"
      intro={intro}
      sections={sections}
    />
  )
}

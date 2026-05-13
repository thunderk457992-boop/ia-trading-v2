export type UpgradeTarget = "pro" | "premium"

export interface UpgradeFeature {
  id: string
  title: string
  description: string
  bullets: string[]
  target: UpgradeTarget
  ctaLabel: string
}

export const UPGRADE_FEATURES: Record<string, UpgradeFeature> = {
  market_signal: {
    id: "market_signal",
    title: "Signal marché Pro",
    description: "Lecture structurée du régime de marché actuel, intégrée dans chaque analyse.",
    bullets: [
      "Dominance BTC et lecture risk-on / risk-off",
      "Sentiment du marché calculé sur données live",
      "Implication pour votre allocation spécifique",
      "Verdict marché : favorable / neutre / risqué",
    ],
    target: "pro",
    ctaLabel: "Débloquer le signal marché",
  },
  pdf_export: {
    id: "pdf_export",
    title: "Export PDF Pro",
    description: "Téléchargez un rapport complet de chaque analyse pour l'archiver ou le partager.",
    bullets: [
      "Rapport PDF complet avec allocation et plan",
      "Date, modèle IA utilisé et score de stratégie",
      "Signal marché du moment et actions recommandées",
      "Disclaimer légal inclus automatiquement",
    ],
    target: "pro",
    ctaLabel: "Débloquer l'export PDF",
  },
  rebalancing: {
    id: "rebalancing",
    title: "Rééquilibrage guidé Pro",
    description: "Des seuils précis pour savoir quand ajuster votre portefeuille, sans avoir à tout surveiller.",
    bullets: [
      "Seuils de drift définis selon votre profil",
      "Conditions de rééquilibrage liées au contexte marché",
      "Intégré dans chaque analyse Pro",
    ],
    target: "pro",
    ctaLabel: "Débloquer le rééquilibrage",
  },
  scenarios: {
    id: "scenarios",
    title: "Scénarios alternatifs Premium",
    description: "Trois scénarios calculés pour votre portefeuille : stable, haussier, baissier.",
    bullets: [
      "Scénario stable : comportement attendu de l'allocation",
      "Scénario haussier : performance probable avec estimation",
      "Scénario baissier : protection offerte et résistance",
      "Produit par Claude Opus 4.7 avec raisonnement étendu",
    ],
    target: "premium",
    ctaLabel: "Débloquer les scénarios",
  },
  risk_alerts: {
    id: "risk_alerts",
    title: "Alertes de risque Premium",
    description: "Identification des risques spécifiques à votre profil et au contexte marché actuel.",
    bullets: [
      "Risques liés à votre exposition altcoin",
      "Risques de corrélation en phase de correction",
      "Alertes sur les seuils de votre tolérance à la perte",
      "Contextualisation par rapport au cycle de marché",
    ],
    target: "premium",
    ctaLabel: "Débloquer les alertes de risque",
  },
  advanced_strategy: {
    id: "advanced_strategy",
    title: "Stratégie avancée Premium",
    description: "Plan d'entrée échelonné avec raisonnement adaptatif et recommandations de timing.",
    bullets: [
      "Stratégie d'entrée lump-sum ou DCA selon la volatilité",
      "Seuils de prix et conditions de déclenchement",
      "Analyse par Claude Opus 4.7 avec thinking étendu",
      "Recommandations de position sizing précises",
    ],
    target: "premium",
    ctaLabel: "Débloquer la stratégie avancée",
  },
  history: {
    id: "history",
    title: "Historique complet Pro",
    description: "Accédez à toutes vos analyses passées pour suivre l'évolution de votre stratégie.",
    bullets: [
      "10 analyses visibles en Pro (3 en gratuit)",
      "20 analyses en Premium",
      "Suivi de l'évolution des allocations dans le temps",
      "Comparaison entre les analyses pour ajuster le cap",
    ],
    target: "pro",
    ctaLabel: "Débloquer l'historique complet",
  },
  unlimited_analyses: {
    id: "unlimited_analyses",
    title: "Analyses illimitées Premium",
    description: "Lancez autant d'analyses que nécessaire, sans quota mensuel.",
    bullets: [
      "Quota illimité au lieu de 20/mois en Pro",
      "Utile pour tester plusieurs profils ou scénarios",
      "Historique complet sur 20 analyses",
    ],
    target: "premium",
    ctaLabel: "Débloquer les analyses illimitées",
  },
}

export function getUpgradeFeature(id: string): UpgradeFeature | undefined {
  return UPGRADE_FEATURES[id]
}

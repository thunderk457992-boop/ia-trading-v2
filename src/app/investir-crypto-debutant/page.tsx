import type { Metadata } from "next"
import { SeoArticlePage } from "@/components/seo/SeoArticlePage"
import { buildPageMetadata } from "@/lib/seo"

export const metadata: Metadata = buildPageMetadata({
  title: "Investir en Crypto Quand On Est Débutant — Guide Honnête",
  description:
    "Comment investir en crypto quand on ne sait pas par où commencer ? Erreurs classiques, méthode DCA, gestion du risque et premier plan d'allocation expliqués simplement.",
  path: "/investir-crypto-debutant",
  type: "article",
  keywords: [
    "investir crypto débutant",
    "comment investir bitcoin débutant",
    "premier investissement crypto",
    "DCA crypto débutant",
    "risque investissement crypto",
    "allocation crypto simple",
    "commencer crypto sans expérience",
  ],
})

const intro = [
  "Vous avez quelques centaines ou quelques milliers d'euros de côté. Vous avez entendu parler de Bitcoin, peut-être d'Ethereum. Vous ne savez pas par où commencer, ce qui est normal, et les ressources disponibles mélangent souvent la vraie pédagogie avec des incitations à acheter rapidement.",
  "Ce guide n'essaie pas de vous convaincre d'investir. Il explique ce que font les débutants qui s'en sortent bien, ce que font ceux qui regrettent, et comment structurer une approche raisonnée si vous décidez d'y aller.",
]

const sections = [
  {
    title: "La première erreur : commencer sans comprendre ce qu'on achète",
    paragraphs: [
      "La plupart des erreurs d'investissement crypto ne viennent pas d'un mauvais timing. Elles viennent d'un mauvais niveau de compréhension. Acheter un actif parce qu'il a monté de 300% la semaine dernière, ou parce qu'un compte Twitter affirme qu'il va encore tripler, c'est spéculer sur la popularité d'une tendance — pas investir.",
      "Les actifs crypto qui ont le mieux traversé les cycles (BTC, ETH) sont aussi ceux pour lesquels on peut expliquer simplement pourquoi ils existent, à quoi ils servent et pourquoi des capitaux y reviennent. Si vous ne pouvez pas répondre à ces questions pour un actif, réduire ou éviter l'exposition est généralement la bonne décision.",
    ],
    bullets: [
      "Comprendre l'actif avant d'y allouer du capital.",
      "Distinguer l'utilité réelle du battage médiatique.",
      "Refuser tout investissement que vous ne sauriez pas expliquer en deux phrases.",
    ],
  },
  {
    title: "Ce que vous devez définir avant d'acheter quoi que ce soit",
    paragraphs: [
      "Combien pouvez-vous réellement perdre sans que cela change votre vie quotidienne ? Pas dans un scénario catastrophe théorique — dans la réalité concrète. Si votre portefeuille chute de 50%, est-ce supportable psychologiquement et financièrement ? C'est la première question à se poser, pas la dernière.",
      "Ensuite, sur quel horizon investissez-vous ? Un horizon de 6 mois et un horizon de 5 ans ne se gèrent pas de la même façon. Un portefeuille court terme devrait être plus défensif, plus concentré sur des actifs liquides, et probablement plus petit en proportion de votre épargne totale.",
    ],
    bullets: [
      "Fixer un plafond de perte acceptable avant d'investir.",
      "Définir un horizon minimum de blocage des fonds.",
      "Ne jamais mettre en crypto des fonds dont vous pourriez avoir besoin à court terme.",
    ],
  },
  {
    title: "La méthode DCA : investir régulièrement plutôt qu'en une fois",
    paragraphs: [
      "Le DCA (Dollar Cost Averaging) consiste à investir un montant fixe à intervalles réguliers — chaque semaine, chaque mois — plutôt que d'essayer d'entrer au meilleur moment. L'idée n'est pas de maximiser le rendement mais de lisser le prix d'entrée dans le temps et de réduire l'exposition au risque de timing.",
      "Pour un débutant, le DCA a un avantage supplémentaire : il crée une habitude d'investissement disciplinée sans nécessiter de suivre le marché en permanence. Vous allouez le même montant chaque mois, que le marché soit en hausse ou en baisse. Sur le long terme, cela fonctionne mieux que la majorité des essais de market timing effectués par des non-professionnels.",
    ],
    bullets: [
      "Choisir un montant mensuel soutenable sur la durée prévue.",
      "Maintenir le rythme même en période de baisse.",
      "Ne pas augmenter le ticket après une hausse par enthousiasme.",
    ],
  },
  {
    title: "Comment construire une première allocation simple",
    paragraphs: [
      "Pour un débutant, une allocation simple est souvent meilleure qu'une allocation complexe. Deux ou trois actifs bien compris valent mieux que dix actifs achetés par diversification instinctive. Bitcoin et Ethereum représentent ensemble une grande part de la capitalisation du marché et bénéficient de la liquidité et de la profondeur les plus importantes. Une allocation simple pourrait ressembler à : 60-70% BTC, 20-30% ETH, 5-10% optionnel sur un altcoin que vous comprenez vraiment.",
      "La partie optionnelle doit rester minoritaire et ne jamais être le moteur de votre décision d'investissement. Si vous perdez la totalité de ces 10%, votre portefeuille doit pouvoir le supporter sans changer votre stratégie.",
    ],
    bullets: [
      "Commencer par deux ou trois actifs maximum.",
      "BTC et ETH comme base avant d'envisager des satellites.",
      "Limiter les actifs très volatils à une petite portion.",
    ],
  },
  {
    title: "Les erreurs classiques qui coûtent cher",
    paragraphs: [
      "Vendre pendant une panique. La majorité des pertes définitives en crypto ne viennent pas du marché : elles viennent de ventes forcées par la peur au mauvais moment. Un actif qui a baissé de 70% n'est pas nécessairement perdu si vous pouvez tenir — mais si vous vendez à ce moment-là, la perte devient réelle.",
      "Sur-diversifier par ignorance. Ajouter dix cryptos différentes parce que vous ne savez pas lesquelles choisir n'est pas de la diversification : c'est du hasard organisé. En phase de correction, les actifs crypto sont très corrélés. La vraie diversification vient d'une logique claire, pas d'un grand nombre d'actifs.",
    ],
    bullets: [
      "Ne pas vendre sous l'effet de la panique à court terme.",
      "Éviter d'acheter des actifs inconnus sur recommandation de réseaux sociaux.",
      "Ne pas augmenter l'exposition après une forte hausse par FOMO.",
      "Ne pas suivre trop fréquemment les prix au quotidien si l'horizon est long.",
    ],
  },
  {
    title: "Comment Axiom AI peut aider un débutant",
    paragraphs: [
      "Axiom AI n'est pas conçu pour vous dire quand acheter ou vendre. Il est conçu pour vous aider à transformer votre profil d'investisseur — budget, horizon, tolérance au risque — en une allocation structurée avec un plan d'entrée concret. Pour un débutant, l'avantage principal est la clarté : plutôt qu'une décision instinctive, vous obtenez une logique documentée basée sur des données de marché réelles.",
      "L'outil reste un complément à votre propre jugement, pas un substitut. Les analyses produites sont des frameworks pédagogiques, pas des signaux d'investissement. Elles ne garantissent aucun rendement et l'investissement en crypto comporte un risque de perte en capital potentiellement important.",
    ],
  },
]

export default function InvestirCryptoDebutantPage() {
  return (
    <SeoArticlePage
      eyebrow="Guide débutant"
      title="Investir en Crypto Quand On Est Débutant"
      intro={intro}
      sections={sections}
    />
  )
}

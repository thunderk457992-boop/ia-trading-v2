import { HomePageClient } from "@/components/home/HomePageClient"
import {
  DEFAULT_SEO_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  buildPageMetadata,
} from "@/lib/seo"

export const metadata = buildPageMetadata({
  title: "Axiom AI - Strategie crypto personnalisee et gestion du risque",
  description:
    "Build a personalized crypto portfolio strategy with AI, live market context, risk guidance, and a clear action plan you can follow.",
  path: "/",
  keywords: [
    "ai crypto advisor",
    "crypto portfolio strategy",
    "personalized crypto strategy",
    "crypto allocation tool",
    "bitcoin portfolio assistant",
    "crypto risk management",
    "crypto dca strategy",
    "crypto portfolio beginner",
  ],
})

const homeStructuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icon.svg`,
      email: "support.axiom.support@gmail.com",
      sameAs: [SITE_URL],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}#website`,
      name: SITE_NAME,
      url: SITE_URL,
      description: DEFAULT_SEO_DESCRIPTION,
      publisher: {
        "@id": `${SITE_URL}#organization`,
      },
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITE_URL}#application`,
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: DEFAULT_SEO_DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        description: "Free plan available",
      },
      publisher: {
        "@id": `${SITE_URL}#organization`,
      },
    },
    {
      "@type": "FinancialService",
      "@id": `${SITE_URL}#service`,
      name: SITE_NAME,
      url: SITE_URL,
      description:
        "Educational AI-guided crypto portfolio planning with risk guidance, diversification logic, and structured follow-up for beginners and active investors.",
      areaServed: "Worldwide",
      serviceType: "Crypto portfolio education and allocation guidance",
      provider: {
        "@id": `${SITE_URL}#organization`,
      },
    },
  ],
}

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeStructuredData) }}
      />
      <HomePageClient />
    </>
  )
}

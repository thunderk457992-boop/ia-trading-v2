import type { Metadata, Viewport } from "next"
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#ffffff",
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_SEO_TITLE,
  applicationName: SITE_NAME,
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: [
    "Axiom AI",
    "AI crypto advisor",
    "crypto portfolio strategy",
    "personalized crypto strategy",
    "bitcoin allocation",
    "crypto DCA strategy",
    "crypto risk management",
    "crypto portfolio dashboard",
    "crypto portfolio beginner",
  ],
  verification: {
    google: "35EwY4FQ5WRpVwp_Cz67d6agOr_LEVbt8sWhkexu_LE",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
        width: 1200,
        height: 630,
        alt: DEFAULT_SEO_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [DEFAULT_SOCIAL_IMAGE],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}

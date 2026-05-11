import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import {
  DEFAULT_SEO_DESCRIPTION,
  DEFAULT_SEO_TITLE,
  DEFAULT_SOCIAL_IMAGE,
  SITE_NAME,
  SITE_URL,
} from "@/lib/seo"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: DEFAULT_SEO_TITLE,
  applicationName: SITE_NAME,
  description: DEFAULT_SEO_DESCRIPTION,
  keywords: [
    "Axiom AI",
    "AI crypto advisor",
    "crypto portfolio strategy",
    "bitcoin allocation",
    "crypto DCA strategy",
    "crypto risk management",
    "crypto portfolio dashboard",
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
    images: [
      {
        url: DEFAULT_SOCIAL_IMAGE,
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
      </body>
    </html>
  )
}

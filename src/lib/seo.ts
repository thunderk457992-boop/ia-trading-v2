import type { Metadata } from "next"

export const SITE_URL = "https://axiom-trade.dev"
export const SITE_NAME = "Axiom AI"
export const DEFAULT_SEO_TITLE = "Axiom AI — AI Crypto Advisor"
export const DEFAULT_SEO_DESCRIPTION =
  "AI-powered crypto portfolio strategy for beginners and active investors."
export const DEFAULT_SOCIAL_IMAGE = "/icon.svg"

type BuildPageMetadataOptions = {
  title: string
  description: string
  path?: string
  keywords?: string[]
  type?: "website" | "article"
  noIndex?: boolean
  image?: string
}

export function buildPageMetadata({
  title,
  description,
  path = "/",
  keywords = [],
  type = "website",
  noIndex = false,
  image = DEFAULT_SOCIAL_IMAGE,
}: BuildPageMetadataOptions): Metadata {
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: path,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
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
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type,
      images: [
        {
          url: image,
          alt: DEFAULT_SEO_TITLE,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}

import type { MetadataRoute } from "next"

const BASE_URL = "https://axiom-trade.dev"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api", "/dashboard", "/settings", "/chat", "/advisor"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}

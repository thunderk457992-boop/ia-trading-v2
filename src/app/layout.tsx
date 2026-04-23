import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "IA Trading Sens — Conseiller Crypto Intelligent",
  description:
    "Obtenez une allocation crypto personnalisée basée sur votre profil, vos objectifs et les conditions du marché. Propulsé par l'IA.",
  keywords: "crypto, trading, IA, intelligence artificielle, bitcoin, portfolio, allocation",
  openGraph: {
    title: "IA Trading Sens",
    description: "Votre conseiller crypto IA — allocations personnalisées en quelques secondes",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  )
}

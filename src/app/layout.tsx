import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Axiom - Conseiller Crypto Intelligent",
  description:
    "Obtenez une allocation crypto personnalisee basee sur votre profil, vos objectifs et les conditions du marche.",
  keywords: "axiom, crypto, trading, IA, intelligence artificielle, bitcoin, portfolio, allocation",
  openGraph: {
    title: "Axiom",
    description: "Votre conseiller crypto IA avec allocation personnalisee en quelques secondes",
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

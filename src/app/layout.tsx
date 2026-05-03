import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Axiom AI",
  description:
    "Axiom AI vous aide à construire une allocation crypto cohérente selon votre profil, vos objectifs et les conditions de marché.",
  keywords: "axiom ai, axiom, crypto, trading, IA, intelligence artificielle, bitcoin, portfolio, allocation",
  openGraph: {
    title: "Axiom AI",
    description: "Votre copilote crypto IA pour analyser, suivre et ajuster votre portefeuille avec méthode.",
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

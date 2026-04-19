import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "IA Trading Sens — Intelligence Artificielle pour le Trading Crypto",
  description:
    "Optimisez votre portfolio crypto grâce à notre conseiller IA avancé. Analyses personnalisées, signaux de trading, et allocation intelligente.",
  keywords: "crypto, trading, IA, intelligence artificielle, bitcoin, portfolio",
  openGraph: {
    title: "IA Trading Sens",
    description: "Le conseiller crypto IA le plus avancé",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-black text-white antialiased">
        {children}
      </body>
    </html>
  )
}

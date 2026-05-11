import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/DashboardNav"

export const metadata: Metadata = {
  title: "Conseiller IA — Axiom AI",
  description: "Répondez à 8 questions sur votre profil d'investisseur et recevez une répartition crypto personnalisée avec un plan d'action structuré.",
  robots: { index: false, follow: false },
}

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-background flex">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 p-5 md:p-8 pb-24 md:pb-8 overflow-auto">{children}</main>
    </div>
  )
}

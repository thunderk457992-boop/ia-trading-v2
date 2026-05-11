import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/DashboardNav"

export const metadata: Metadata = {
  title: "Dashboard — Axiom AI",
  description: "Votre portefeuille crypto, vos analyses IA et les données de marché en temps réel.",
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
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
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 p-5 md:p-7 pb-24 md:pb-7 overflow-auto min-h-screen bg-background">
        {children}
      </main>
    </div>
  )
}

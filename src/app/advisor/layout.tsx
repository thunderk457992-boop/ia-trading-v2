import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/DashboardNav"

export default async function AdvisorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-black flex">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 ml-64 p-8 overflow-auto">{children}</main>
    </div>
  )
}

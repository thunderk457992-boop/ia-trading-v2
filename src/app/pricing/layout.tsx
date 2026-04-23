import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/DashboardNav"

export default async function PricingLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <DashboardNav user={user} profile={profile} />
      <main className="flex-1 md:ml-64 mt-14 md:mt-0 p-5 md:p-8 pb-24 md:pb-8 overflow-auto">{children}</main>
    </div>
  )
}

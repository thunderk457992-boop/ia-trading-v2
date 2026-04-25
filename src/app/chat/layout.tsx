import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardNav } from "@/components/dashboard/DashboardNav"

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
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
      <main className="flex-1 overflow-auto bg-background pb-24 md:ml-64 md:pb-8">
        <div className="mt-14 px-5 py-5 md:mt-0 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}

import { Sidebar, MobileNav } from "@/components/dashboard/sidebar"
import { PricingCards } from "@/components/pricing/pricing-cards"

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="lg:pl-60 pb-16 lg:pb-0">
        <div className="px-4 py-5 lg:px-6 lg:py-6">
          <div className="mx-auto max-w-3xl text-center mb-8">
            <h1 className="text-xl font-semibold tracking-tight text-foreground lg:text-2xl">
              Choose Your Plan
            </h1>
            <p className="mt-1.5 text-[13px] text-muted-foreground max-w-md mx-auto">
              Unlock AI-powered crypto intelligence with a plan that fits your needs.
            </p>
          </div>
          
          <PricingCards />
        </div>
      </main>
    </div>
  )
}

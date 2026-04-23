import { Sidebar, MobileNav } from "@/components/dashboard/sidebar"
import { SummaryCards } from "@/components/dashboard/summary-cards"
import { PortfolioChart } from "@/components/dashboard/portfolio-chart"
import { AllocationChart } from "@/components/dashboard/allocation-chart"
import { MarketTable } from "@/components/dashboard/market-table"
import { RecentAnalyses } from "@/components/dashboard/recent-analyses"
import { RecommendationCard } from "@/components/dashboard/recommendation-card"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="lg:pl-60 pb-16 lg:pb-0">
        <div className="px-4 py-5 lg:px-6 lg:py-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Dashboard
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Welcome back, John. Here&apos;s your portfolio overview.
            </p>
          </div>
          
          <SummaryCards />
          
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <PortfolioChart />
            </div>
            <div>
              <AllocationChart />
            </div>
          </div>
          
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MarketTable />
            </div>
            <div>
              <RecommendationCard />
            </div>
          </div>
          
          <div className="mt-4">
            <RecentAnalyses />
          </div>
        </div>
      </main>
    </div>
  )
}

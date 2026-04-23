"use client"

import { useState } from "react"
import { Sidebar, MobileNav } from "@/components/dashboard/sidebar"
import { cn } from "@/lib/utils"
import { User, CreditCard, Shield, Bell } from "lucide-react"
import { ProfileSettings } from "@/components/settings/profile-settings"
import { BillingSettings } from "@/components/settings/billing-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "security", label: "Security", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <MobileNav />
      
      <main className="lg:pl-60 pb-16 lg:pb-0">
        <div className="px-4 py-5 lg:px-6 lg:py-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Settings
            </h1>
            <p className="text-[13px] text-muted-foreground">
              Manage your account and preferences
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            <nav className="lg:w-48 shrink-0">
              <div className="flex lg:flex-col gap-0.5 overflow-x-auto pb-2 lg:pb-0">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-medium transition-colors",
                        activeTab === tab.id
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </nav>
            
            <div className="flex-1 max-w-2xl">
              {activeTab === "profile" && <ProfileSettings />}
              {activeTab === "billing" && <BillingSettings />}
              {activeTab === "security" && <SecuritySettings />}
              {activeTab === "notifications" && <NotificationSettings />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

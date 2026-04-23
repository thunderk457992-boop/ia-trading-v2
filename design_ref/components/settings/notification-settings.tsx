"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface NotificationSetting {
  id: string
  title: string
  description: string
  enabled: boolean
}

const initialSettings: NotificationSetting[] = [
  {
    id: "price-alerts",
    title: "Price Alerts",
    description: "Get notified when assets hit your target prices",
    enabled: true,
  },
  {
    id: "analysis-complete",
    title: "Analysis Complete",
    description: "Receive updates when AI analyses are ready",
    enabled: true,
  },
  {
    id: "market-updates",
    title: "Market Updates",
    description: "Daily summary of market conditions",
    enabled: false,
  },
  {
    id: "portfolio-changes",
    title: "Portfolio Changes",
    description: "Alerts for significant portfolio value changes",
    enabled: true,
  },
  {
    id: "security-alerts",
    title: "Security Alerts",
    description: "Notifications about account security events",
    enabled: true,
  },
  {
    id: "product-updates",
    title: "Product Updates",
    description: "News about new features and improvements",
    enabled: false,
  },
]

function Toggle({ 
  enabled, 
  onChange 
}: { 
  enabled: boolean
  onChange: () => void 
}) {
  return (
    <button
      onClick={onChange}
      className={cn(
        "relative h-5 w-9 rounded-full transition-colors",
        enabled ? "bg-foreground" : "bg-secondary"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all shadow-sm",
          enabled ? "left-[18px]" : "left-0.5"
        )}
      />
    </button>
  )
}

export function NotificationSettings() {
  const [settings, setSettings] = useState(initialSettings)

  const toggleSetting = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-1">Email Notifications</h3>
        <p className="text-[12px] text-muted-foreground mb-4">
          Choose what notifications you receive via email
        </p>
        
        <div className="divide-y divide-border">
          {settings.map((setting) => (
            <div
              key={setting.id}
              className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-[13px] font-medium text-foreground">{setting.title}</p>
                <p className="text-[11px] text-muted-foreground">{setting.description}</p>
              </div>
              <Toggle
                enabled={setting.enabled}
                onChange={() => toggleSetting(setting.id)}
              />
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button className="rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background hover:bg-foreground/90 transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  )
}

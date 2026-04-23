"use client"

import { useState } from "react"
import { Smartphone, Monitor, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

const sessions = [
  { id: "1", device: "MacBook Pro", location: "San Francisco, CA", current: true, icon: Monitor },
  { id: "2", device: "iPhone 15 Pro", location: "San Francisco, CA", current: false, icon: Smartphone },
  { id: "3", device: "Chrome on Windows", location: "New York, NY", current: false, icon: Globe },
]

export function SecuritySettings() {
  const [twoFaEnabled, setTwoFaEnabled] = useState(false)

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">Change Password</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              Current Password
            </label>
            <input
              type="password"
              placeholder="Enter current password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              New Password
            </label>
            <input
              type="password"
              placeholder="Enter new password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button className="rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background hover:bg-foreground/90 transition-colors">
            Update Password
          </button>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-foreground">Two-Factor Authentication</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Add an extra layer of security to your account
            </p>
          </div>
          <button
            onClick={() => setTwoFaEnabled(!twoFaEnabled)}
            className={cn(
              "relative h-5 w-9 rounded-full transition-colors",
              twoFaEnabled ? "bg-foreground" : "bg-secondary"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 h-4 w-4 rounded-full bg-background transition-all shadow-sm",
                twoFaEnabled ? "left-[18px]" : "left-0.5"
              )}
            />
          </button>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">Active Sessions</h3>
        
        <div className="space-y-3">
          {sessions.map((session) => {
            const Icon = session.icon
            return (
              <div
                key={session.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-foreground">{session.device}</p>
                      {session.current && (
                        <span className="rounded-full bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">
                          Current
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{session.location}</p>
                  </div>
                </div>
                {!session.current && (
                  <button className="text-[11px] font-medium text-destructive hover:text-destructive/80 transition-colors">
                    Revoke
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

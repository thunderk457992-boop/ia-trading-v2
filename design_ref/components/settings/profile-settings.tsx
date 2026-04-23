"use client"

import { Camera } from "lucide-react"

export function ProfileSettings() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">Profile Information</h3>
        
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
              <span className="text-lg font-medium text-foreground">JD</span>
            </div>
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-foreground text-background flex items-center justify-center hover:bg-foreground/90 transition-colors">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium text-foreground">Profile Photo</p>
            <p className="text-[11px] text-muted-foreground">JPG, PNG or GIF. Max 2MB.</p>
          </div>
        </div>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              First Name
            </label>
            <input
              type="text"
              defaultValue="John"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              Last Name
            </label>
            <input
              type="text"
              defaultValue="Doe"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-medium text-muted-foreground mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              defaultValue="john.doe@example.com"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none transition-colors"
            />
          </div>
        </div>
        
        <div className="mt-5 flex justify-end">
          <button className="rounded-lg bg-foreground px-4 py-2 text-[12px] font-medium text-background hover:bg-foreground/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
      
      <div className="rounded-xl border border-destructive/20 bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-1">Delete Account</h3>
        <p className="text-[12px] text-muted-foreground mb-4">
          Permanently delete your account and all associated data.
        </p>
        <button className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-[12px] font-medium text-destructive hover:bg-destructive/10 transition-colors">
          Delete Account
        </button>
      </div>
    </div>
  )
}

"use client"

import { CreditCard, Download } from "lucide-react"

const invoices = [
  { id: "INV-001", date: "Dec 1, 2024", amount: "$29.00", status: "Paid" },
  { id: "INV-002", date: "Nov 1, 2024", amount: "$29.00", status: "Paid" },
  { id: "INV-003", date: "Oct 1, 2024", amount: "$29.00", status: "Paid" },
]

export function BillingSettings() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">Current Plan</h3>
        
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div>
            <p className="text-[14px] font-semibold text-foreground">Pro Plan</p>
            <p className="text-[12px] text-muted-foreground">$29/month - Renews Dec 24, 2024</p>
          </div>
          <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12px] font-medium text-foreground hover:bg-secondary transition-colors">
            Change Plan
          </button>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">Payment Method</h3>
        
        <div className="flex items-center justify-between p-4 rounded-lg border border-border">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-[13px] font-medium text-foreground">Visa ending in 4242</p>
              <p className="text-[11px] text-muted-foreground">Expires 12/2026</p>
            </div>
          </div>
          <button className="text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Update
          </button>
        </div>
      </div>
      
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-[14px] font-semibold text-foreground mb-4">Billing History</h3>
        
        <div className="divide-y divide-border">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-[13px] font-medium text-foreground">{invoice.id}</p>
                <p className="text-[11px] text-muted-foreground">{invoice.date}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-[13px] font-medium text-foreground">{invoice.amount}</span>
                <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
                  {invoice.status}
                </span>
                <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <Download className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

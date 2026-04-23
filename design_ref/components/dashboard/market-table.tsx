"use client"

import { TrendingUp, TrendingDown, RefreshCw, ChevronUp, ChevronDown, Star, StarOff, Search } from "lucide-react"
import { LineChart, Line, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"
import { useState, useMemo } from "react"

interface MarketAsset {
  id: string
  rank: number
  name: string
  symbol: string
  price: number
  change1h: number
  change24h: number
  change7d: number
  volume: string
  marketCap: string
  sparklineData: number[]
  holdings?: number
  holdingsValue?: string
}

const marketData: MarketAsset[] = [
  { id: "btc", rank: 1, name: "Bitcoin", symbol: "BTC", price: 67432.18, change1h: 0.12, change24h: 2.34, change7d: 5.67, volume: "$28.4B", marketCap: "$1.32T", sparklineData: [65, 68, 66, 70, 69, 72, 71, 73, 72, 74], holdings: 1.24, holdingsValue: "$83,615.90" },
  { id: "eth", rank: 2, name: "Ethereum", symbol: "ETH", price: 3521.45, change1h: -0.08, change24h: 1.87, change7d: 3.21, volume: "$12.8B", marketCap: "$423B", sparklineData: [48, 50, 49, 52, 51, 53, 52, 54, 53, 55], holdings: 12.5, holdingsValue: "$44,018.13" },
  { id: "sol", rank: 5, name: "Solana", symbol: "SOL", price: 178.92, change1h: 0.34, change24h: -0.56, change7d: -2.13, volume: "$3.2B", marketCap: "$78B", sparklineData: [42, 40, 41, 38, 39, 37, 38, 36, 37, 35], holdings: 45, holdingsValue: "$8,051.40" },
  { id: "bnb", rank: 4, name: "BNB", symbol: "BNB", price: 612.34, change1h: 0.05, change24h: 0.92, change7d: 1.45, volume: "$1.8B", marketCap: "$94B", sparklineData: [55, 56, 54, 57, 56, 58, 57, 59, 58, 60], holdings: 8.2, holdingsValue: "$5,021.19" },
  { id: "xrp", rank: 6, name: "XRP", symbol: "XRP", price: 0.6234, change1h: -0.22, change24h: -1.23, change7d: -4.56, volume: "$2.1B", marketCap: "$34B", sparklineData: [30, 28, 29, 27, 28, 26, 27, 25, 26, 24] },
  { id: "ada", rank: 8, name: "Cardano", symbol: "ADA", price: 0.4521, change1h: 0.67, change24h: 3.45, change7d: 8.92, volume: "$892M", marketCap: "$16B", sparklineData: [35, 37, 36, 39, 38, 41, 40, 43, 42, 45] },
  { id: "avax", rank: 9, name: "Avalanche", symbol: "AVAX", price: 38.72, change1h: 0.15, change24h: 2.18, change7d: 6.34, volume: "$542M", marketCap: "$15B", sparklineData: [32, 34, 33, 36, 35, 38, 37, 39, 38, 41] },
  { id: "dot", rank: 12, name: "Polkadot", symbol: "DOT", price: 7.89, change1h: -0.31, change24h: -0.78, change7d: -1.23, volume: "$312M", marketCap: "$11B", sparklineData: [28, 27, 28, 26, 27, 25, 26, 24, 25, 23] },
  { id: "link", rank: 14, name: "Chainlink", symbol: "LINK", price: 14.52, change1h: 0.42, change24h: 4.21, change7d: 12.34, volume: "$678M", marketCap: "$8.5B", sparklineData: [38, 40, 39, 42, 41, 45, 44, 48, 47, 51] },
  { id: "matic", rank: 15, name: "Polygon", symbol: "MATIC", price: 0.5834, change1h: 0.08, change24h: 1.56, change7d: 2.89, volume: "$234M", marketCap: "$5.4B", sparklineData: [42, 43, 42, 44, 43, 45, 44, 46, 45, 47] },
]

type SortKey = "rank" | "price" | "change1h" | "change24h" | "change7d" | "volume" | "marketCap"
type SortDir = "asc" | "desc"

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((value, index) => ({ value, index }))
  return (
    <div className="h-8 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line type="monotone" dataKey="value" stroke={positive ? "oklch(0.55 0.16 155)" : "oklch(0.55 0.2 25)"} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function ChangeCell({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <div className={cn("flex items-center gap-0.5 text-[12px] font-medium tabular-nums", positive ? "text-success" : "text-destructive")}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {Math.abs(value).toFixed(2)}%
    </div>
  )
}

function SortHeader({ label, sortKey, currentSort, currentDir, onSort, className }: { 
  label: string; 
  sortKey: SortKey; 
  currentSort: SortKey; 
  currentDir: SortDir; 
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = currentSort === sortKey
  return (
    <button 
      onClick={() => onSort(sortKey)}
      className={cn("flex items-center gap-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors", className)}
    >
      {label}
      <div className="flex flex-col -space-y-1">
        <ChevronUp className={cn("h-2.5 w-2.5", isActive && currentDir === "asc" ? "text-foreground" : "text-muted-foreground/40")} />
        <ChevronDown className={cn("h-2.5 w-2.5", isActive && currentDir === "desc" ? "text-foreground" : "text-muted-foreground/40")} />
      </div>
    </button>
  )
}

export function MarketTable() {
  const [filter, setFilter] = useState<"all" | "gainers" | "losers" | "holdings">("all")
  const [sortKey, setSortKey] = useState<SortKey>("rank")
  const [sortDir, setSortDir] = useState<SortDir>("asc")
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set(["btc", "eth"]))
  const [search, setSearch] = useState("")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const toggleWatchlist = (id: string) => {
    setWatchlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filteredAndSorted = useMemo(() => {
    let data = [...marketData]
    
    if (search) {
      data = data.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.symbol.toLowerCase().includes(search.toLowerCase()))
    }
    
    if (filter === "gainers") data = data.filter(a => a.change24h > 0)
    else if (filter === "losers") data = data.filter(a => a.change24h < 0)
    else if (filter === "holdings") data = data.filter(a => a.holdings)
    
    data.sort((a, b) => {
      let aVal: number, bVal: number
      switch (sortKey) {
        case "rank": aVal = a.rank; bVal = b.rank; break
        case "price": aVal = a.price; bVal = b.price; break
        case "change1h": aVal = a.change1h; bVal = b.change1h; break
        case "change24h": aVal = a.change24h; bVal = b.change24h; break
        case "change7d": aVal = a.change7d; bVal = b.change7d; break
        case "volume": aVal = parseFloat(a.volume.replace(/[$BMT]/g, '')); bVal = parseFloat(b.volume.replace(/[$BMT]/g, '')); break
        case "marketCap": aVal = parseFloat(a.marketCap.replace(/[$BMT]/g, '')); bVal = parseFloat(b.marketCap.replace(/[$BMT]/g, '')); break
        default: aVal = a.rank; bVal = b.rank;
      }
      return sortDir === "asc" ? aVal - bVal : bVal - aVal
    })
    
    return data
  }, [filter, sortKey, sortDir, search])

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Market Overview</h3>
          <p className="text-[11px] text-muted-foreground">Live prices with 24h performance</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-32 rounded-lg border border-border bg-background pl-8 pr-2 text-[11px] placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <div className="flex items-center gap-0.5 rounded-lg border border-border p-0.5">
            {(["all", "gainers", "losers", "holdings"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-md px-2 py-1 text-[10px] font-medium capitalize transition-colors",
                  filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {f}
              </button>
            ))}
          </div>
          <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors" title="Refresh prices">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="w-8 px-2 py-2.5"></th>
              <th className="px-2 py-2.5 text-left">
                <SortHeader label="#" sortKey="rank" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
              </th>
              <th className="px-3 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Asset</th>
              <th className="px-3 py-2.5 text-right">
                <SortHeader label="Price" sortKey="price" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right sm:table-cell">
                <SortHeader label="1h" sortKey="change1h" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="px-3 py-2.5 text-right">
                <SortHeader label="24h" sortKey="change24h" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right md:table-cell">
                <SortHeader label="7d" sortKey="change7d" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right lg:table-cell">
                <SortHeader label="Volume" sortKey="volume" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right xl:table-cell">
                <SortHeader label="Market Cap" sortKey="marketCap" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} className="justify-end" />
              </th>
              <th className="hidden px-3 py-2.5 text-right 2xl:table-cell text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Holdings</th>
              <th className="hidden px-3 py-2.5 text-right sm:table-cell text-[10px] font-medium uppercase tracking-wider text-muted-foreground">7D Chart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredAndSorted.map((asset) => (
              <tr key={asset.id} className="transition-colors hover:bg-secondary/40 cursor-pointer group">
                <td className="px-2 py-2.5">
                  <button onClick={() => toggleWatchlist(asset.id)} className="text-muted-foreground hover:text-warning transition-colors">
                    {watchlist.has(asset.id) ? <Star className="h-3.5 w-3.5 fill-warning text-warning" /> : <StarOff className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100" />}
                  </button>
                </td>
                <td className="px-2 py-2.5">
                  <span className="text-[11px] text-muted-foreground tabular-nums">{asset.rank}</span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[11px] font-semibold text-foreground">
                      {asset.symbol.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-foreground">{asset.name}</p>
                      <p className="text-[10px] text-muted-foreground">{asset.symbol}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="text-[13px] font-medium text-foreground tabular-nums">
                    ${asset.price < 1 ? asset.price.toFixed(4) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </td>
                <td className="hidden px-3 py-2.5 text-right sm:table-cell">
                  <ChangeCell value={asset.change1h} />
                </td>
                <td className="px-3 py-2.5 text-right">
                  <ChangeCell value={asset.change24h} />
                </td>
                <td className="hidden px-3 py-2.5 text-right md:table-cell">
                  <ChangeCell value={asset.change7d} />
                </td>
                <td className="hidden px-3 py-2.5 text-right lg:table-cell">
                  <span className="text-[12px] text-muted-foreground tabular-nums">{asset.volume}</span>
                </td>
                <td className="hidden px-3 py-2.5 text-right xl:table-cell">
                  <span className="text-[12px] text-muted-foreground tabular-nums">{asset.marketCap}</span>
                </td>
                <td className="hidden px-3 py-2.5 text-right 2xl:table-cell">
                  {asset.holdings ? (
                    <div>
                      <p className="text-[12px] font-medium text-foreground tabular-nums">{asset.holdingsValue}</p>
                      <p className="text-[10px] text-muted-foreground tabular-nums">{asset.holdings} {asset.symbol}</p>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">-</span>
                  )}
                </td>
                <td className="hidden px-3 py-2.5 sm:table-cell">
                  <div className="flex justify-end">
                    <Sparkline data={asset.sparklineData} positive={asset.change7d >= 0} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-border px-4 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Showing {filteredAndSorted.length} of {marketData.length} assets</span>
        <button className="text-[11px] font-medium text-accent hover:underline">View All Markets</button>
      </div>
    </div>
  )
}

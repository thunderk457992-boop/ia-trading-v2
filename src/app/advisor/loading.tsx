function Sk({ className }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-slate-100 ${className ?? ""}`}
      style={{
        backgroundImage: "linear-gradient(90deg, #f1f5f9 0%, #ffffff 50%, #f1f5f9 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s ease-in-out infinite",
      }}
    />
  )
}

export default function AdvisorLoading() {
  return (
    <div className="mx-auto max-w-3xl">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      {/* Header */}
      <div className="mb-6">
        <Sk className="h-3 w-24 mb-2 rounded" />
        <Sk className="h-8 w-64 mb-1 rounded-lg" />
        <Sk className="h-4 w-80 rounded" />
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <Sk className="h-4 w-24 rounded" />
          <Sk className="h-3 w-16 rounded" />
        </div>
        <Sk className="h-1.5 w-full rounded-full" />
        <div className="mt-4 space-y-3">
          {[0, 1, 2].map((i) => (
            <Sk key={i} className="h-11 w-full rounded-xl" />
          ))}
        </div>
      </div>

      {/* Form section */}
      <div className="rounded-2xl border border-slate-100 bg-white p-5">
        <Sk className="h-4 w-40 mb-4 rounded" />
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <Sk key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}

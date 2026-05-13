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

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-5xl">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <Sk className="h-7 w-36 mb-2 rounded-lg" />
            <Sk className="h-4 w-52 rounded-lg" />
          </div>
          <Sk className="h-9 w-36 rounded-lg" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Sk className="h-6 w-36 rounded-full" />
          <Sk className="h-6 w-28 rounded-full" />
          <Sk className="h-6 w-24 rounded-full" />
        </div>
        <Sk className="mt-3 h-10 w-full rounded-2xl" />
      </div>

      {/* Summary cards — 4 top */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2 flex-1 mr-2">
                <Sk className="h-3 w-20 rounded" />
                <Sk className="h-7 w-24 rounded-lg" />
                <Sk className="h-3 w-16 rounded" />
              </div>
              <Sk className="h-10 w-10 rounded-xl shrink-0" />
            </div>
            <Sk className="h-9 w-full rounded-xl" />
          </div>
        ))}
      </div>

      {/* Summary cards — 3 bottom */}
      <div className="grid gap-3 lg:grid-cols-3 mb-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
            <Sk className="h-3 w-24 mb-3 rounded" />
            <div className="space-y-2">
              <Sk className="h-4 w-full rounded" />
              <Sk className="h-4 w-3/4 rounded" />
              <Sk className="h-4 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Chart + sidebar */}
      <div className="mb-4 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-xl border border-slate-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <Sk className="h-3 w-28 mb-2 rounded" />
              <Sk className="h-5 w-52 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <Sk className="h-7 w-20 rounded-full" />
              <Sk className="h-7 w-28 rounded-full" />
            </div>
          </div>
          <Sk className="h-56 w-full rounded-xl" />
        </div>

        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="rounded-xl border border-slate-100 bg-white p-4">
              <Sk className="h-3 w-24 mb-3 rounded" />
              {i === 0 ? (
                <Sk className="h-20 w-full rounded-xl" />
              ) : (
                <div className="space-y-2">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Sk className="h-4 w-4 rounded-full shrink-0" />
                      <Sk className="h-3 flex-1 rounded" />
                      <Sk className="h-3 w-8 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recent analyses */}
      <div className="rounded-xl border border-slate-100 bg-white">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <Sk className="h-4 w-32 rounded" />
          <Sk className="h-3 w-14 rounded" />
        </div>
        <div className="divide-y divide-slate-50">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3.5 gap-4">
              <div className="flex items-center gap-3">
                <Sk className="h-8 w-8 rounded-lg shrink-0" />
                <div className="space-y-1.5">
                  <Sk className="h-4 w-32 rounded" />
                  <Sk className="h-3 w-48 rounded" />
                </div>
              </div>
              <Sk className="h-6 w-14 rounded-md shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

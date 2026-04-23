export default function DashboardLoading() {
  return (
    <div className="max-w-5xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-9 w-64 bg-slate-200 rounded-xl mb-2" />
        <div className="h-4 w-48 bg-slate-100 rounded-lg" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <div className="h-3 w-24 bg-slate-100 rounded" />
              <div className="w-8 h-8 bg-slate-100 rounded-lg" />
            </div>
            <div className="h-8 w-16 bg-slate-200 rounded-lg mb-1" />
            <div className="h-3 w-12 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Market skeleton */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="h-5 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-16 bg-slate-100 rounded" />
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className={`px-4 py-3.5 flex items-center justify-between ${i < 5 ? "border-b border-slate-100" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100" />
                  <div>
                    <div className="h-4 w-20 bg-slate-100 rounded mb-1.5" />
                    <div className="h-3 w-10 bg-slate-50 rounded" />
                  </div>
                </div>
                <div className="text-right">
                  <div className="h-4 w-20 bg-slate-100 rounded mb-1.5" />
                  <div className="h-3 w-12 bg-slate-50 rounded ml-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right skeleton */}
        <div className="lg:col-span-2 space-y-5">
          <div className="p-6 rounded-2xl bg-indigo-100">
            <div className="h-5 w-32 bg-indigo-200 rounded mb-3" />
            <div className="h-4 w-full bg-indigo-200 rounded mb-1.5" />
            <div className="h-4 w-3/4 bg-indigo-200 rounded mb-5" />
            <div className="h-9 w-36 bg-indigo-200 rounded-xl" />
          </div>
          <div className="p-5 rounded-xl bg-white border border-slate-200">
            <div className="h-4 w-32 bg-slate-100 rounded mb-4" />
            <div className="h-20 w-full bg-slate-50 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

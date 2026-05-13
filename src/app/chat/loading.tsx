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

export default function ChatLoading() {
  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-3xl flex-col md:h-screen">
      <style>{`@keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>

      {/* Header */}
      <div className="border-b border-slate-100 bg-white px-4 py-4 flex items-center justify-between">
        <div>
          <Sk className="h-5 w-24 mb-1.5 rounded-lg" />
          <Sk className="h-3 w-36 rounded" />
        </div>
        <Sk className="h-8 w-20 rounded-full" />
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-hidden px-4 py-5 space-y-4 bg-background">
        {/* Bot message */}
        <div className="flex items-start gap-3">
          <Sk className="h-8 w-8 rounded-xl shrink-0" />
          <Sk className="h-16 w-64 rounded-2xl rounded-tl-sm" />
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2 pl-11">
          {[0, 1, 2].map((i) => (
            <Sk key={i} className="h-8 w-32 rounded-full" />
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-white px-4 py-3">
        <Sk className="h-12 w-full rounded-2xl" />
        <div className="mt-2 flex justify-center gap-4">
          <Sk className="h-3 w-32 rounded" />
          <Sk className="h-3 w-28 rounded" />
        </div>
      </div>
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="min-h-full animate-pulse">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 py-4">
          <div className="h-8 w-36 rounded-full bg-slate-200/80" />
          <div className="h-8 w-28 rounded-full bg-slate-200/80" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl border border-slate-200/70 bg-white" />
          ))}
        </div>
        <div className="h-16 rounded-2xl border border-slate-200/70 bg-white" />
        <div className="h-72 rounded-3xl border border-slate-200/70 bg-white" />
      </div>
    </div>
  );
}

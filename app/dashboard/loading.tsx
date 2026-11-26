export default function DashboardLoading() {
  return (
    <div className="min-h-full animate-pulse bg-zinc-50/60 dark:bg-zinc-950">
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="h-9 w-48 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-9 w-24 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          ))}
        </div>
        <div className="h-16 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-72 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

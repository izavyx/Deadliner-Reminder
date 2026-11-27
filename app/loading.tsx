export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 animate-pulse px-4 py-10">
      <div className="h-8 w-40 rounded-xl bg-slate-200/80" />
      <div className="mt-3 h-4 w-72 rounded-lg bg-slate-200/70" />
      <div className="mt-8 h-44 rounded-3xl border border-slate-200/60 bg-white/80" />
    </main>
  );
}

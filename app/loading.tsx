export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 animate-pulse px-4 py-10">
      <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-3 h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
      <div className="mt-8 h-40 rounded-xl bg-zinc-100 dark:bg-zinc-900" />
    </main>
  );
}

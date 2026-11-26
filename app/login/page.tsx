import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "./login-form";

// searchParams dibaca di dalam <Suspense> (wajib di Next.js dengan cacheComponents).
async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error, info } = await searchParams;
  return (
    <>
      {error && <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {info && (
        <p className="mt-6 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{info}</p>
      )}
    </>
  );
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-indigo-600">
        ← Kembali ke beranda
      </Link>
      <h1 className="mt-4 text-3xl font-bold tracking-tight">Masuk ke Deadliner</h1>
      <p className="mt-1 text-zinc-500">Masuk untuk melihat tugas kuliahmu.</p>

      <Suspense fallback={null}>
        <Messages searchParams={searchParams} />
      </Suspense>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-zinc-500">
        Belum punya akun?{" "}
        <Link href="/register" className="font-medium text-indigo-600 hover:underline">
          Daftar
        </Link>
      </p>
    </main>
  );
}

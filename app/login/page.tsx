import { Suspense } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/site-header";
import { LoginForm } from "./login-form";

async function Messages({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; info?: string }>;
}) {
  const { error, info } = await searchParams;
  return (
    <>
      {error && (
        <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {info && (
        <p className="mt-5 rounded-xl border border-[#bef264] bg-[#f2fcd4] p-3 text-sm font-medium text-[#365314]">
          {info}
        </p>
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
    <div className="flex min-h-full flex-col">
      <header className="mx-auto w-full max-w-6xl px-4">
        <div className="flex items-center justify-between border-b border-slate-200/80 py-4">
          <BrandLogo />
          <Link
            href="/"
            className="text-xs font-semibold tracking-wide text-slate-600 uppercase transition hover:text-[#2563eb]"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-10">
        <div className="rounded-3xl border border-slate-200/90 bg-white p-7 shadow-xl shadow-blue-950/5 sm:p-8">
          <span className="inline-block rounded-full bg-[#f2fcd4] px-3 py-1 text-xs font-bold text-[#365314]">
            Selamat Datang Kembali
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#181b20] sm:text-3xl">
            Masuk ke Deadliner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Buka daftar tugas dan lampiran materi kuliahmu.
          </p>

          <Suspense fallback={null}>
            <Messages searchParams={searchParams} />
          </Suspense>

          <LoginForm />

          <p className="mt-6 text-center text-sm text-slate-500">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#2563eb] hover:underline"
            >
              Daftar gratis
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

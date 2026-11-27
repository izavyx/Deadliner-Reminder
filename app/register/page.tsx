import Link from "next/link";
import { BrandLogo } from "@/components/site-header";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
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
          <span className="inline-block rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-bold text-[#2563eb]">
            Akun Mahasiswa Baru
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#181b20] sm:text-3xl">
            Buat Akun Deadliner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftar gratis untuk mencatat deadline &amp; menyimpan materi kuliahmu.
          </p>

          <RegisterForm />

          <p className="mt-6 text-center text-sm text-slate-500">
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#2563eb] hover:underline"
            >
              Masuk
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

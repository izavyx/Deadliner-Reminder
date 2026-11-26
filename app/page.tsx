import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function HeaderAuthActions() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return (
      <Link
        href="/dashboard"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
      >
        Buka Dashboard →
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2.5">
      <Link
        href="/login"
        className="rounded-lg px-3.5 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700"
      >
        Daftar Gratis
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col bg-white dark:bg-zinc-950">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/85 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/85">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm">
              D
            </span>
            <span className="text-lg font-bold tracking-tight">Deadliner</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex dark:text-zinc-400">
            <a href="#fitur" className="hover:text-indigo-600">
              Fitur
            </a>
            <a href="#cara-kerja" className="hover:text-indigo-600">
              Cara Kerja
            </a>
            <Link href="/dashboard" className="hover:text-indigo-600">
              Dashboard
            </Link>
          </nav>

          <Suspense
            fallback={
              <div className="h-9 w-36 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900" />
            }
          >
            <HeaderAuthActions />
          </Suspense>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-zinc-100 px-4 py-20 sm:py-24 dark:border-zinc-900">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950/70 dark:text-indigo-300">
                ⚡ Tech for Convenience · Mahasiswa Bebas SKS
              </span>
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Kelola Tugas Kuliah{" "}
                <span className="text-indigo-600">Tanpa Lupa Deadline</span>
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
                Catat tugas dalam hitungan detik dengan pemilih kalender interaktif,
                pantau sisa waktu otomatis lewat tabel yang rapi, dan pastikan kuliahmu
                selalu <em>on-track</em> setiap minggu.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
                >
                  Mulai Sekarang — Gratis
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
                >
                  Buka Dashboard
                </Link>
              </div>
            </div>

            {/* Preview Mockup Tabel Tugas */}
            <div className="mx-auto mt-14 max-w-4xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-400" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-xs font-medium text-zinc-500">
                  Pratinjau Tabel Tugas Deadliner
                </span>
                <span className="text-xs font-semibold text-indigo-600">📅 Kalender Aktif</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs font-semibold uppercase text-zinc-500 dark:border-zinc-800">
                      <th className="px-4 py-3">Selesai</th>
                      <th className="px-4 py-3">Tugas Kuliah</th>
                      <th className="px-4 py-3">Mata Kuliah</th>
                      <th className="px-4 py-3">Deadline</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    <tr>
                      <td className="px-4 py-3">
                        <span className="inline-block h-4 w-4 rounded border-2 border-zinc-400" />
                      </td>
                      <td className="px-4 py-3 font-medium">Kuis Kalkulus Bab 3</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">Kalkulus</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">Besok · 08:00</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-300">
                          18 jam lagi
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">
                        <span className="inline-block h-4 w-4 rounded border-2 border-zinc-400" />
                      </td>
                      <td className="px-4 py-3 font-medium">Makalah Metodologi Penelitian Bab 1</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">Metopen</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">28 Nov · 23:59</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                          2 hari lagi
                        </span>
                      </td>
                    </tr>
                    <tr className="opacity-65">
                      <td className="px-4 py-3">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded bg-emerald-500 text-[10px] font-bold text-white">
                          ✓
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium line-through">
                        Laporan Praktikum Basis Data
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500">Basis Data</td>
                      <td className="px-4 py-3 text-xs text-zinc-500">Kemarin · 17:00</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                          Selesai
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* Fitur Section */}
        <section id="fitur" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Dirancang untuk Kemudahan Mahasiswa
              </h2>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                Semua fitur yang kamu butuhkan agar tugas terkendali tanpa aplikasi rumit.
              </p>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-xl dark:bg-indigo-950">
                  📅
                </div>
                <h3 className="mt-4 text-lg font-semibold">Kalender Interaktif</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Pilih tanggal & jam deadline langsung lewat kalender visual lengkap dengan
                  pintasan cepat (Hari ini, Besok, +1 Minggu) serta tampilan kalender bulanan.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-xl dark:bg-amber-950">
                  📋
                </div>
                <h3 className="mt-4 text-lg font-semibold">Tabel Tugas CRUD Rapi</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Tambah, lihat, edit, centang selesai, dan hapus tugas dari satu tabel bersih
                  lengkap dengan pencarian mata kuliah dan filter tugas mendesak.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-xl dark:bg-emerald-950">
                  🔔
                </div>
                <h3 className="mt-4 text-lg font-semibold">Status & Notifikasi Instan</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Indikator warna otomatis (aman, mendesak, terlambat) serta umpan balik pop-up
                  dan indikator loading jelas di setiap aksi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Cara Kerja Section */}
        <section
          id="cara-kerja"
          className="border-t border-zinc-200 bg-zinc-50/70 px-4 py-20 dark:border-zinc-800 dark:bg-zinc-900/40"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight">
              3 Langkah Tetap On-Track
            </h2>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Buat Akun Pribadi",
                  desc: "Daftar dengan email. Semua tugasmu tersimpan aman dan terpisah untuk akunmu sendiri.",
                },
                {
                  step: "02",
                  title: "Pilih Tanggal di Kalender",
                  desc: "Klik Tambah Tugas, isi mata kuliah, lalu pilih tanggal & jam batas pengumpulan.",
                },
                {
                  step: "03",
                  title: "Pantau & Centang Selesai",
                  desc: "Fokus kerjakan tugas berlabel merah/kuning lebih dulu, lalu centang saat beres!",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                    Langkah {item.step}
                  </span>
                  <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 px-4 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
        <p>© 2026 Deadliner — Proyek Inovasi Tech for Convenience untuk Mahasiswa.</p>
      </footer>
    </div>
  );
}

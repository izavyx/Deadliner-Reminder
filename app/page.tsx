import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { BrandLogo } from "@/components/site-header";
import {
  ArrowRightLongIcon,
  ArrowUpRightIcon,
  BellCheckIcon,
  CalendarIcon,
  CheckIcon,
  GeometricAsterisk,
  PaperclipIcon,
  SparkleStar,
  TableListIcon,
} from "@/components/icons";

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
        className="inline-flex items-center gap-1.5 rounded-full border border-[#84cc16] bg-[#bff227] px-4 py-1.5 text-xs font-bold tracking-wide text-[#181b20] uppercase transition hover:bg-[#b1e519]"
      >
        Dashboard
        <ArrowUpRightIcon className="h-3.5 w-3.5" />
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/login"
        className="text-xs font-semibold tracking-wide text-slate-600 uppercase transition hover:text-[#2563eb]"
      >
        Masuk
      </Link>
      <Link
        href="/register"
        className="inline-flex items-center gap-1.5 rounded-full border border-[#95d625] bg-[#f2fcd4] px-4 py-1.5 text-xs font-bold tracking-wide text-[#181b20] uppercase transition hover:bg-[#bff227]"
      >
        Daftar
        <ArrowUpRightIcon className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Header Simpel & Minimalis */}
      <header className="sticky top-0 z-30 bg-[#f6f8fb]/85 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-center justify-between border-b border-slate-200/85 py-4">
            <div className="flex items-center gap-8">
              <BrandLogo />
              <nav
                aria-label="Navigasi Utama"
                className="hidden items-center gap-6 text-xs font-semibold tracking-wider text-slate-600 uppercase md:flex"
              >
                <a href="#fitur" className="transition hover:text-[#2563eb]">
                  Fitur
                </a>
                <a href="#cara-kerja" className="transition hover:text-[#2563eb]">
                  Cara Kerja
                </a>
                <Link href="/dashboard" className="transition hover:text-[#2563eb]">
                  Ruang Tugas
                </Link>
              </nav>
            </div>

            <Suspense
              fallback={
                <div className="h-8 w-28 animate-pulse rounded-full bg-slate-200/70" />
              }
            >
              <HeaderAuthActions />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative px-4 pt-12 pb-16 sm:pt-16 sm:pb-20">
          <div className="relative mx-auto max-w-6xl">
            {/* Ornamen Geometris seperti Referensi 1 */}
            <GeometricAsterisk className="pointer-events-none absolute -top-2 left-2 hidden h-10 w-10 text-[#2563eb] sm:block md:left-8 md:h-12 md:w-12" />
            <SparkleStar className="pointer-events-none absolute -top-3 right-4 hidden h-9 w-9 text-[#a3e635] sm:block md:right-12 md:h-11 md:w-11" />

            <div className="mx-auto max-w-4xl text-center">
              <h1 className="font-display text-4xl leading-[1.12] font-extrabold tracking-tight text-[#181b20] uppercase sm:text-5xl lg:text-6xl">
                RAPIKAN TUGAS KULIAH
                <span className="mt-1.5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                  <span>TANPA</span>
                  <span
                    aria-hidden="true"
                    className="inline-flex h-10 w-20 items-center justify-center rounded-full bg-[#bff227] text-[#181b20] shadow-xs sm:h-12 sm:w-24"
                  >
                    <ArrowRightLongIcon className="h-4 w-9 sm:w-11" />
                  </span>
                  <span className="text-[#2563eb]">LUPA DEADLINE</span>
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-2xl font-display text-base font-bold tracking-wider text-slate-600 uppercase sm:text-lg">
                DIJAMIN ANTI TELAT
              </p>

              {/* Baris Statistik Ringkas + Dual-Pill CTA ala Referensi */}
              <div className="mx-auto mt-8 flex max-w-2xl flex-col items-center justify-between gap-5 rounded-3xl border border-slate-200/80 bg-white/80 px-6 py-4 backdrop-blur-xs sm:flex-row">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-slate-500">Dirancang praktis untuk mahasiswa</p>
                  <p className="font-display text-sm font-bold tracking-wide text-[#181b20] uppercase">
                    TABEL CRUD · KALENDER · LAMPIRAN PPT &amp; PDF
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <Link
                    href="/dashboard"
                    className="group inline-flex items-center gap-1.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#2563eb]"
                  >
                    <span className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#181b20] transition group-hover:border-[#2563eb] group-hover:text-[#2563eb]">
                      Buka Ruang Tugas
                    </span>
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#bff227] text-[#181b20] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:bg-[#b1e519]">
                      <ArrowUpRightIcon className="h-4 w-4" />
                    </span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Pratinjau Tabel Tugas Interaktif */}
            <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-[28px] border border-slate-200/90 bg-white shadow-xl shadow-blue-950/5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-[#f8fafd] px-5 py-3.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#2563eb]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#bff227]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                  <span className="ml-2 text-xs font-medium text-slate-500">
                    Pratinjau Ruang Tugas Deadliner
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  <PaperclipIcon className="h-3.5 w-3.5" />
                  Klik baris untuk preview materi
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                      <th className="px-5 py-3.5">Selesai</th>
                      <th className="px-5 py-3.5">Tugas &amp; Lampiran</th>
                      <th className="px-5 py-3.5">Mata Kuliah</th>
                      <th className="px-5 py-3.5">Deadline</th>
                      <th className="px-5 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-[#f8faff]/60">
                      <td className="px-5 py-3.5">
                        <span className="inline-block h-4 w-4 rounded-md border-2 border-slate-300" />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#181b20]">
                          Laporan Akhir Fungsi Rekursif
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 ring-1 ring-amber-200">
                            PPT
                          </span>
                          <span className="text-xs text-slate-500">
                            Modul_Rekursif_PAP1.pptx
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-medium text-[#2563eb]">
                          Praktikum AP 1
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">Besok · 23:59</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                          1 hari lagi
                        </span>
                      </td>
                    </tr>

                    <tr>
                      <td className="px-5 py-3.5">
                        <span className="inline-block h-4 w-4 rounded-md border-2 border-slate-300" />
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-[#181b20]">
                          Makalah Metodologi Penelitian Bab 1
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700 ring-1 ring-red-200">
                            PDF
                          </span>
                          <span className="text-xs text-slate-500">
                            Template_Makalah.pdf
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                          Metopen
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">02 Des · 23:59</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-[#eaf1ff] px-2.5 py-1 text-xs font-semibold text-[#2563eb]">
                          4 hari lagi
                        </span>
                      </td>
                    </tr>

                    <tr className="opacity-65">
                      <td className="px-5 py-3.5">
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-md bg-[#bff227] text-[#181b20]">
                          <CheckIcon className="h-3 w-3" />
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-400 line-through">
                        Kuis Basis Data Relasional
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">Basis Data</td>
                      <td className="px-5 py-3.5 text-xs text-slate-500">Kemarin · 17:00</td>
                      <td className="px-5 py-3.5">
                        <span className="rounded-full bg-[#f2fcd4] px-2.5 py-1 text-xs font-semibold text-[#365314]">
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

        {/* BLOK FITUR BIRU CERAH BERKARTU PUTIH (Terinspirasi Referensi 2) */}
        <section id="fitur" className="px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-6xl rounded-[32px] bg-[#2563eb] p-6 text-white shadow-lg shadow-blue-600/15 sm:p-10">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <span className="inline-block rounded-full bg-[#bff227] px-3 py-1 text-xs font-bold tracking-wider text-[#181b20] uppercase">
                  Fitur Unggulan
                </span>
                <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  Semua Kebutuhan Tugas dalam Satu Ruang
                </h2>
              </div>
              <p className="max-w-sm text-sm text-blue-100">
                Tidak ada menu berlapis yang membingungkan. Buka, cek materi, kerjakan, lalu centang selesai.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  title: "Preview Materi ala Classroom",
                  badge: "PPT · PDF · IMG",
                  desc: "Lampirkan screenshot soal, slide PPT, atau PDF di tiap tugas dan buka pratinjaunya kapan saja.",
                  icon: PaperclipIcon,
                },
                {
                  title: "Kalender & Pintasan Cepat",
                  badge: "Visual Picker",
                  desc: "Pilih tanggal dan jam tenggat dengan mudah beserta mode kalender bulanan interaktif.",
                  icon: CalendarIcon,
                },
                {
                  title: "Tabel Tugas CRUD Bersih",
                  badge: "Filter & Cari",
                  desc: "Tambah, cari nama matkul maupun nama file lampiran, edit, dan kelola tugas dengan rapi.",
                  icon: TableListIcon,
                },
                {
                  title: "Indikator Waktu Otomatis",
                  badge: "Anti Terlambat",
                  desc: "Label sisa jam & hari berubah otomatis agar tugas paling mendesak langsung terlihat.",
                  icon: BellCheckIcon,
                },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="relative flex flex-col justify-between rounded-2xl bg-white p-5 text-[#181b20] shadow-sm transition-transform duration-200 hover:-translate-y-1"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf1ff] text-[#2563eb]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="rounded-full bg-[#f2fcd4] px-2.5 py-0.5 text-[11px] font-bold text-[#365314]">
                          {item.badge}
                        </span>
                      </div>
                      <h3 className="mt-4 font-display text-lg font-bold leading-snug">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FRAME CARA KERJA 3 KARTU (Terinspirasi "Our Classes" pada Referensi 1) */}
        <section id="cara-kerja" className="px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-6xl rounded-[32px] border border-slate-200/90 bg-white/80 p-6 backdrop-blur-xs sm:p-10">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <h2 className="font-display text-3xl font-bold tracking-tight text-[#181b20]">
                3 Langkah Tetap Teratur
              </h2>
              <p className="max-w-md text-sm text-slate-600">
                Alur sederhana supaya kamu fokus menyelesaikan tugas tanpa pusing mencari ulang file soal.
              </p>
            </div>

            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {/* Langkah 1 */}
              <div className="flex flex-col justify-between rounded-3xl border-2 border-[#2563eb]/25 bg-white p-6">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold text-[#181b20]">
                      Catat Tugas &amp; Tenggat
                    </h3>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white">
                      01
                    </span>
                  </div>
                  <div className="my-4 h-px bg-slate-200" />
                  <p className="text-sm leading-relaxed text-slate-600">
                    Masukkan judul tugas, nama mata kuliah, lalu pilih tanggal dan jam batas pengumpulan di kalender.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl bg-[#f6f8fb] p-3.5 text-xs font-medium text-slate-600">
                  Pintasan cepat: <span className="font-semibold text-[#2563eb]">Hari ini · Besok · +1 Minggu</span>
                </div>
              </div>

              {/* Langkah 2 (Kartu Tengah Biru Menonjol seperti Referensi 1) */}
              <div className="flex flex-col justify-between rounded-3xl bg-[#2563eb] p-6 text-white shadow-md shadow-blue-600/20">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold">
                      Lampirkan Soal / PPT
                    </h3>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#bff227] text-xs font-bold text-[#181b20]">
                      02
                    </span>
                  </div>
                  <div className="my-4 h-px bg-white/20" />
                  <p className="text-sm leading-relaxed text-blue-100">
                    Unggah modul PDF, slide PPT, atau langsung tekan{" "}
                    <kbd className="rounded bg-white/15 px-1.5 py-0.5 text-xs font-semibold text-white">
                      Ctrl+V
                    </kbd>{" "}
                    untuk menempel screenshot soal dari WhatsApp.
                  </p>
                </div>
                <div className="mt-6 rounded-2xl bg-white/12 p-3.5 text-xs font-medium text-white">
                  Semua file tersimpan rapi per tugas dan langsung bisa di-preview.
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="flex flex-col justify-between rounded-3xl border-2 border-[#2563eb]/25 bg-white p-6">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl font-bold text-[#181b20]">
                      Buka &amp; Selesaikan
                    </h3>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563eb] text-xs font-bold text-white">
                      03
                    </span>
                  </div>
                  <div className="my-4 h-px bg-slate-200" />
                  <p className="text-sm leading-relaxed text-slate-600">
                    Klik tugas di tabel saat ingin mulai mengerjakan, baca instruksi serta lampirannya, lalu centang selesai!
                  </p>
                </div>
                <div className="mt-6 rounded-2xl bg-[#f2fcd4] p-3.5 text-xs font-semibold text-[#365314]">
                  Bebas sistem kebut semalam, progres selalu terpantau.
                </div>
              </div>
            </div>

            {/* Tagline Penutup dengan Ornamen seperti Referensi 1 */}
            <div className="relative mt-12 border-t border-slate-200/80 pt-10 text-center">
              <p className="mx-auto max-w-xl font-display text-xl font-extrabold tracking-tight text-[#181b20] uppercase sm:text-2xl">
                MULAI{" "}
                <span className="inline-block rounded-full border border-[#84cc16] bg-[#f2fcd4] px-3.5 py-0.5">
                  TERATUR
                </span>{" "}
                AGAR SEMUA TUGAS KULIAH TUNTAS{" "}
                <span className="text-[#2563eb]">TEPAT WAKTU.</span>
              </p>
              <div className="mt-6 flex justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 rounded-full bg-[#2563eb] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
                >
                  Mulai Gunakan Deadliner
                  <ArrowUpRightIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer Minimalis */}
      <footer className="px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-slate-200/85 pt-6 text-xs text-slate-500 sm:flex-row">
          <p>© 2026 Deadliner — Tech for Convenience.</p>
          <p className="font-medium text-slate-600">Manajemen Deadline &amp; Ruang Tugas Kuliah</p>
        </div>
      </footer>
    </div>
  );
}

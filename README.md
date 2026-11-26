# Deadliner — Pengingat Deadline & Manajemen Tugas Kuliah

Aplikasi web berbasis **Next.js (App Router)** dan **Supabase** dengan konsep *Tech for Convenience* untuk membantu mahasiswa mencatat tugas kuliah, memilih deadline lewat kalender interaktif, dan memantau sisa waktu secara rapi tanpa lupa deadline.

## Fitur Utama
- **Landing Page Modern (`/`)** — Informasi fitur dan alur penggunaan.
- **Autentikasi Pengguna (`/login` & `/register`)** — Supabase Auth berbasis sesi cookie dengan proteksi Row Level Security (RLS) per akun.
- **Tabel Tugas Full CRUD (`/dashboard`)** — Tambah, lihat, filter, cari, edit, centang selesai, dan hapus tugas.
- **Pemilih Tanggal Kalender & Mode Kalender Bulanan** — Input tanggal/jam interaktif beserta pintasan cepat.
- **Indikator Loading & Notifikasi Pop-up (Toast + Modal)** — Umpan balik instan di setiap aksi pengguna.

## Persiapan & Menjalankan Lokal

1. **Instal dependensi:**
   ```bash
   npm install
   ```

2. **Konfigurasi Environment Variable:**
   Salin `.env.example` menjadi `.env`, lalu isi URL dan Anon Key proyek Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
   ```

3. **Jalankan SQL di Supabase (SQL Editor):**
   Jalankan secara berurutan:
   - `supabase/schema.sql`
   - `supabase/auth.sql`
   - `supabase/profiles.sql`
   - *(Opsional untuk testing)* `supabase/dummy_user.sql`

4. **Jalankan server development:**
   ```bash
   npm run dev
   ```
   Buka [http://localhost:3000](http://localhost:3000).

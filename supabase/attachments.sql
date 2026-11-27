-- =====================================================================
-- Deadliner: Lampiran Materi & Soal Tugas (Gambar, PDF, PPT, Word, dll.)
-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan berulang kali (idempotent).
-- =====================================================================

-- 1. Tambah kolom attachments (JSONB) pada tabel public.tasks -------------
alter table public.tasks
  add column if not exists attachments jsonb not null default '[]'::jsonb;

comment on column public.tasks.attachments is
  'Daftar metadata file lampiran tugas (id, name, path, mime_type, size, uploaded_at).';

-- 2. Buat bucket Storage privat "task-attachments" (batas 50 MB / file) ---
insert into storage.buckets (id, name, public, file_size_limit)
values ('task-attachments', 'task-attachments', false, 52428800)
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit;

-- 3. Row Level Security pada storage.objects ------------------------------
-- Setiap file disimpan di path: "{user_id}/{uuid}-{nama_file}"
-- sehingga hanya pemilik akun yang bisa mengunggah, melihat, & menghapusnya.

drop policy if exists "task_attachments_select_own" on storage.objects;
create policy "task_attachments_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "task_attachments_insert_own" on storage.objects;
create policy "task_attachments_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "task_attachments_update_own" on storage.objects;
create policy "task_attachments_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "task_attachments_delete_own" on storage.objects;
create policy "task_attachments_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'task-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

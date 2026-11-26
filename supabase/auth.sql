-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run
-- Migrasi dari tahap "tanpa login" ke "tiap user hanya lihat tugasnya sendiri".

-- 1. Tambah pemilik tugas
alter table public.tasks
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

alter table public.tasks
  alter column user_id set default auth.uid();

create index if not exists tasks_user_id_idx on public.tasks (user_id);

-- 2. Hapus policy terbuka dari tahap development
drop policy if exists "dev_all_access" on public.tasks;

-- 3. Policy baru: hanya pemilik yang boleh akses
alter table public.tasks enable row level security;

drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using (auth.uid() = user_id);

-- Catatan: tugas lama dari tahap development (user_id = NULL) tidak akan
-- terlihat lagi oleh siapa pun. Itu normal; tidak ada data yang dihapus.

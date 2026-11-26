-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  course      text not null default '',
  deadline    timestamptz not null,
  notes       text not null default '',
  is_done     boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists tasks_deadline_idx on public.tasks (deadline);

alter table public.tasks enable row level security;

-- ⚠️ HANYA UNTUK TAHAP DEVELOPMENT (belum ada login):
-- siapa pun yang punya anon key bisa baca/tulis tabel ini.
-- Setelah menambah Supabase Auth, ganti dengan policy berbasis user_id.
drop policy if exists "dev_all_access" on public.tasks;
create policy "dev_all_access" on public.tasks
  for all
  to anon
  using (true)
  with check (true);

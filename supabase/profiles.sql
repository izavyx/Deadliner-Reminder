-- =====================================================================
-- Deadliner: tabel profil pengguna (pendamping Supabase Auth)
-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan berulang kali (idempotent).
-- =====================================================================

-- 1. Tabel profiles: 1 baris per akun di auth.users ----------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null default '',
  email       text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Data profil publik aplikasi; id sama dengan auth.users.id.';

-- 2. Row Level Security: user hanya boleh lihat & ubah profilnya sendiri --
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Tidak ada policy INSERT/DELETE untuk client:
--   * baris dibuat otomatis oleh trigger di bawah,
--   * baris terhapus otomatis (cascade) saat akun auth.users dihapus.

-- 3. Trigger: buat profil otomatis saat ada yang mendaftar ----------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Trigger: perbarui updated_at otomatis --------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5. Backfill: buatkan profil untuk akun yang sudah terdaftar sebelumnya --
insert into public.profiles (id, full_name, email)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'full_name', ''),
  u.email
from auth.users u
on conflict (id) do nothing;

-- 6. Cek hasil ------------------------------------------------------------
-- select * from public.profiles;

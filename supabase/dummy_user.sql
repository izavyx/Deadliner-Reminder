-- =====================================================================
-- Deadliner: akun DUMMY untuk testing (tanpa email konfirmasi)
-- Jalankan di Supabase Dashboard > SQL Editor > New query > Run
--
--   Email    : dummy@example.com
--   Password : Dummy123!
--
-- Cocok untuk development, karena TIDAK mengirim email sehingga
-- tidak kena "email rate limit exceeded". Aman dijalankan berulang kali.
-- JANGAN dipakai di produksi.
-- Prasyarat: schema.sql dan auth.sql sudah dijalankan.
-- =====================================================================

create extension if not exists pgcrypto;

do $$
declare
  v_email    text := 'dummy@example.com';
  v_password text := 'Dummy123!';
  v_name     text := 'Dummy User';
  v_user_id  uuid;
begin
  select id into v_user_id from auth.users where email = v_email;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at,
      confirmation_token, recovery_token, email_change, email_change_token_new
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      crypt(v_password, gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', v_name),
      now(), now(),
      '', '', '', ''
    );

    insert into auth.identities (
      id, user_id, provider_id, provider, identity_data,
      last_sign_in_at, created_at, updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      'email',
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', v_email,
        'email_verified', true
      ),
      now(), now(), now()
    );

    raise notice 'Akun dummy dibuat: % (id %)', v_email, v_user_id;
  else
    raise notice 'Akun dummy sudah ada: % (id %)', v_email, v_user_id;
  end if;

  -- Contoh tugas milik akun dummy (hanya jika tabel/kolomnya siap & masih kosong)
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'tasks' and column_name = 'user_id'
  ) then
    raise notice 'Tugas contoh DILEWATI: kolom tasks.user_id belum ada. Jalankan schema.sql lalu auth.sql, kemudian jalankan file ini lagi.';
  elsif not exists (select 1 from public.tasks where user_id = v_user_id) then
    insert into public.tasks (user_id, title, course, deadline, notes, is_done) values
      (v_user_id, 'Makalah Metodologi Penelitian Bab 1', 'Metopen',
         now() + interval '2 days',  'Cari minimal 3 jurnal referensi', false),
      (v_user_id, 'Tugas Besar Pemrograman Web', 'Pemrograman Web',
         now() + interval '6 days',  'Kerjakan bareng kelompok', false),
      (v_user_id, 'Kuis Kalkulus Bab 3', 'Kalkulus',
         now() + interval '20 hours', 'Review limit dan turunan', false),
      (v_user_id, 'Laporan Praktikum Basis Data', 'Basis Data',
         now() - interval '1 day',   'Sudah dikumpulkan', true),
      (v_user_id, 'Presentasi Tech for Convenience', 'Inovasi Teknologi',
         now() + interval '10 days', 'Siapkan slide + diagram Excalidraw', false);
  end if;
end
$$;

-- Cek hasil:
-- select id, email, email_confirmed_at from auth.users where email = 'dummy@example.com';
-- select title, deadline, is_done from public.tasks
--   where user_id = (select id from auth.users where email = 'dummy@example.com');

-- ---------------------------------------------------------------------
-- HAPUS akun dummy beserta tugas & profilnya (cascade). Hilangkan komentar
-- hanya jika memang ingin menghapusnya:
-- delete from auth.users where email = 'dummy@example.com';
-- ---------------------------------------------------------------------

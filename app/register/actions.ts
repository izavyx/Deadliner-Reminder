"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { setFlash } from "@/lib/flash";

export type RegisterState = { error?: string; name?: string; email?: string };

export async function register(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const keep = { name, email };

  if (!name || !email || !password) return { ...keep, error: "Semua kolom wajib diisi." };
  if (password.length < 6) return { ...keep, error: "Password minimal 6 karakter." };
  if (password !== confirm) return { ...keep, error: "Konfirmasi password tidak sama." };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    if (error.code === "over_email_send_rate_limit" || /rate limit/i.test(error.message)) {
      return {
        ...keep,
        error:
          "Batas pengiriman email Supabase tercapai. Tunggu sekitar 1 jam, atau matikan 'Confirm email' di Supabase.",
      };
    }
    if (error.code === "user_already_exists") {
      return { ...keep, error: "Email ini sudah terdaftar. Silakan masuk." };
    }
    return { ...keep, error: error.message };
  }

  // Supabase tidak mengembalikan error untuk email yang sudah terdaftar (anti user-enumeration);
  // identities kosong menandakan akun sudah ada.
  if (data.user && data.user.identities?.length === 0) {
    return { ...keep, error: "Email ini sudah terdaftar. Silakan masuk." };
  }

  // "Confirm email" aktif di Supabase => belum ada sesi sampai link email diklik.
  if (!data.session) {
    redirect(
      `/login?info=${encodeURIComponent("Akun dibuat! Cek email Anda dan klik link konfirmasi, lalu masuk.")}`,
    );
  }

  await setFlash("register");
  revalidatePath("/", "layout");
  redirect("/dashboard");
}

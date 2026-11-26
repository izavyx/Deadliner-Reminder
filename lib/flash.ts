import { cookies } from "next/headers";

export type FlashKey = "login" | "register" | "logout";

/**
 * Menyimpan pesan singkat yang dibaca client (ToastProvider) setelah redirect,
 * lalu ditampilkan sebagai toast. Pesan dipetakan dari kunci agar cookie tetap ASCII.
 */
export async function setFlash(key: FlashKey) {
  (await cookies()).set("flash", key, {
    path: "/",
    maxAge: 30,
    httpOnly: false,
    sameSite: "lax",
  });
}

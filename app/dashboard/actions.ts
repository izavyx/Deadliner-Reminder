"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = {
  ok: boolean;
  message: string;
};

async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const title = String(formData.get("title") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();

  if (!title) return { ok: false, message: "Judul tugas wajib diisi." };
  if (!deadlineRaw) return { ok: false, message: "Tanggal deadline wajib dipilih dari kalender." };

  const deadline = new Date(deadlineRaw);
  if (Number.isNaN(deadline.getTime())) {
    return { ok: false, message: "Format tanggal deadline tidak valid." };
  }

  const { error } = await supabase.from("tasks").insert({
    user_id: user.id,
    title,
    course,
    notes,
    deadline: deadline.toISOString(),
  });

  if (error) return { ok: false, message: `Gagal menambah tugas: ${error.message}` };

  revalidatePath("/dashboard");
  return { ok: true, message: `Tugas "${title}" berhasil ditambahkan!` };
}

export async function updateTaskAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const id = String(formData.get("id") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();

  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (!title) return { ok: false, message: "Judul tugas wajib diisi." };
  if (!deadlineRaw) return { ok: false, message: "Tanggal deadline wajib dipilih dari kalender." };

  const deadline = new Date(deadlineRaw);
  if (Number.isNaN(deadline.getTime())) {
    return { ok: false, message: "Format tanggal deadline tidak valid." };
  }

  const { error } = await supabase
    .from("tasks")
    .update({
      title,
      course,
      notes,
      deadline: deadline.toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: `Gagal memperbarui tugas: ${error.message}` };

  revalidatePath("/dashboard");
  return { ok: true, message: `Tugas "${title}" berhasil diperbarui!` };
}

export async function toggleTaskAction(id: string, isDone: boolean): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const nextState = !isDone;
  const { error } = await supabase
    .from("tasks")
    .update({ is_done: nextState })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: `Gagal mengubah status: ${error.message}` };

  revalidatePath("/dashboard");
  return {
    ok: true,
    message: nextState ? "Tugas ditandai selesai! Mantap!" : "Tugas dikembalikan ke status belum selesai.",
  };
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: `Gagal menghapus tugas: ${error.message}` };

  revalidatePath("/dashboard");
  return { ok: true, message: "Tugas berhasil dihapus." };
}

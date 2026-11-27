"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskAttachment } from "@/lib/types";

const ATTACHMENT_BUCKET = "task-attachments";

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

function sanitizeAttachmentsInput(raw: unknown, userId: string): TaskAttachment[] {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    if (!raw.trim()) return [];
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];

  const clean: TaskAttachment[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const rec = item as Record<string, unknown>;
    const id = String(rec.id ?? "").trim();
    const name = String(rec.name ?? "").trim();
    const path = String(rec.path ?? "").trim();
    const mime_type = String(rec.mime_type ?? "application/octet-stream").trim();
    const size = Number(rec.size ?? 0);
    const uploaded_at = String(rec.uploaded_at ?? new Date().toISOString()).trim();

    // Pastikan hanya path milik user sendiri yang boleh disimpan
    if (!id || !name || !path || !path.startsWith(`${userId}/`)) continue;

    clean.push({
      id,
      name,
      path,
      mime_type,
      size: Number.isFinite(size) && size >= 0 ? size : 0,
      uploaded_at,
    });
  }
  return clean;
}

function sanitizePathsInput(raw: unknown, userId: string): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((p) => String(p ?? "").trim())
      .filter((p) => p.startsWith(`${userId}/`));
  } catch {
    return [];
  }
}

function formatDbError(prefix: string, errMessage: string): string {
  if (errMessage.toLowerCase().includes("attachments")) {
    return `${prefix}: Kolom lampiran belum tersedia di database. Jalankan file supabase/attachments.sql di Supabase SQL Editor terlebih dahulu.`;
  }
  return `${prefix}: ${errMessage}`;
}

export async function createTaskAction(formData: FormData): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const title = String(formData.get("title") ?? "").trim();
  const course = String(formData.get("course") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const deadlineRaw = String(formData.get("deadline") ?? "").trim();
  const attachments = sanitizeAttachmentsInput(formData.get("attachments"), user.id);

  if (!title) return { ok: false, message: "Judul tugas wajib diisi." };
  if (!deadlineRaw) return { ok: false, message: "Tanggal deadline wajib dipilih dari kalender." };

  const deadline = new Date(deadlineRaw);
  if (Number.isNaN(deadline.getTime())) {
    return { ok: false, message: "Format tanggal deadline tidak valid." };
  }

  const payload: Record<string, unknown> = {
    user_id: user.id,
    title,
    course,
    notes,
    deadline: deadline.toISOString(),
  };
  if (attachments.length > 0) {
    payload.attachments = attachments;
  }

  const { error } = await supabase.from("tasks").insert(payload);

  if (error) {
    return { ok: false, message: formatDbError("Gagal menambah tugas", error.message) };
  }

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
  const attachmentsDirty = formData.get("attachments_dirty") === "1";
  const attachmentsRaw = formData.get("attachments");
  const removedPaths = sanitizePathsInput(formData.get("removed_paths"), user.id);

  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (!title) return { ok: false, message: "Judul tugas wajib diisi." };
  if (!deadlineRaw) return { ok: false, message: "Tanggal deadline wajib dipilih dari kalender." };

  const deadline = new Date(deadlineRaw);
  if (Number.isNaN(deadline.getTime())) {
    return { ok: false, message: "Format tanggal deadline tidak valid." };
  }

  const payload: Record<string, unknown> = {
    title,
    course,
    notes,
    deadline: deadline.toISOString(),
  };

  if (attachmentsDirty && attachmentsRaw !== null) {
    payload.attachments = sanitizeAttachmentsInput(attachmentsRaw, user.id);
  }

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { ok: false, message: formatDbError("Gagal memperbarui tugas", error.message) };
  }

  if (removedPaths.length > 0) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove(removedPaths);
  }

  revalidatePath("/dashboard");
  return { ok: true, message: `Tugas "${title}" berhasil diperbarui!` };
}

export async function appendTaskAttachmentsAction(
  taskId: string,
  newItems: TaskAttachment[],
): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const cleanNew = sanitizeAttachmentsInput(newItems, user.id);
  if (cleanNew.length === 0) {
    return { ok: false, message: "Tidak ada file lampiran valid untuk disimpan." };
  }

  const { data: existingRow, error: fetchErr } = await supabase
    .from("tasks")
    .select("attachments")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr) {
    return { ok: false, message: formatDbError("Gagal membaca lampiran tugas", fetchErr.message) };
  }

  const current = sanitizeAttachmentsInput(existingRow?.attachments ?? [], user.id);
  const merged = [...current, ...cleanNew];

  const { error: updateErr } = await supabase
    .from("tasks")
    .update({ attachments: merged })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (updateErr) {
    return { ok: false, message: formatDbError("Gagal menyimpan lampiran", updateErr.message) };
  }

  revalidatePath("/dashboard");
  return {
    ok: true,
    message: `${cleanNew.length} file lampiran berhasil ditambahkan ke tugas!`,
  };
}

export async function removeTaskAttachmentAction(
  taskId: string,
  attachmentId: string,
): Promise<ActionResult> {
  const { supabase, user } = await getAuthContext();
  if (!user) return { ok: false, message: "Sesi berakhir. Silakan login kembali." };

  const { data: existingRow, error: fetchErr } = await supabase
    .from("tasks")
    .select("attachments")
    .eq("id", taskId)
    .eq("user_id", user.id)
    .single();

  if (fetchErr) {
    return { ok: false, message: formatDbError("Gagal membaca lampiran", fetchErr.message) };
  }

  const current = sanitizeAttachmentsInput(existingRow?.attachments ?? [], user.id);
  const target = current.find((a) => a.id === attachmentId);
  const nextList = current.filter((a) => a.id !== attachmentId);

  const { error: updateErr } = await supabase
    .from("tasks")
    .update({ attachments: nextList })
    .eq("id", taskId)
    .eq("user_id", user.id);

  if (updateErr) {
    return { ok: false, message: formatDbError("Gagal menghapus lampiran", updateErr.message) };
  }

  if (target?.path && target.path.startsWith(`${user.id}/`)) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove([target.path]);
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Lampiran berhasil dihapus." };
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

  // Ambil daftar lampiran terlebih dahulu agar objek di Storage ikut dibersihkan
  const { data: existingRow } = await supabase
    .from("tasks")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  const pathsToDelete = sanitizeAttachmentsInput(
    (existingRow as Record<string, unknown> | null)?.attachments ?? [],
    user.id,
  ).map((a) => a.path);

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { ok: false, message: `Gagal menghapus tugas: ${error.message}` };

  if (pathsToDelete.length > 0) {
    await supabase.storage.from(ATTACHMENT_BUCKET).remove(pathsToDelete);
  }

  revalidatePath("/dashboard");
  return { ok: true, message: "Tugas berhasil dihapus." };
}

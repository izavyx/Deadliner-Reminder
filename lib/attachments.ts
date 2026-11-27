import { createClient } from "@/lib/supabase/client";
import type { TaskAttachment } from "@/lib/types";

export const ATTACHMENT_BUCKET = "task-attachments";
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

export type FileCategory =
  | "image"
  | "pdf"
  | "ppt"
  | "doc"
  | "sheet"
  | "other";

export function getFileExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx >= 0 ? fileName.slice(idx + 1).toLowerCase() : "";
}

export function getFileCategory(mimeType: string, fileName: string): FileCategory {
  const mime = (mimeType || "").toLowerCase();
  const ext = getFileExtension(fileName);

  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"].includes(ext)
  ) {
    return "image";
  }
  if (mime === "application/pdf" || ext === "pdf") {
    return "pdf";
  }
  if (
    mime.includes("presentation") ||
    mime.includes("powerpoint") ||
    ["ppt", "pptx", "pps", "ppsx"].includes(ext)
  ) {
    return "ppt";
  }
  if (
    mime.includes("wordprocessingml") ||
    mime.includes("msword") ||
    ["doc", "docx", "rtf"].includes(ext)
  ) {
    return "doc";
  }
  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    return "sheet";
  }
  return "other";
}

export function isOfficePreviewable(category: FileCategory, fileName: string): boolean {
  if (category === "ppt" || category === "doc") return true;
  if (category === "sheet") {
    return getFileExtension(fileName) !== "csv";
  }
  return false;
}

export function getFileBadgeMeta(category: FileCategory) {
  switch (category) {
    case "image":
      return {
        label: "Gambar",
        short: "IMG",
        boxClass: "bg-[#eaf1ff] text-[#1d4ed8] border-blue-200",
      };
    case "pdf":
      return {
        label: "Dokumen PDF",
        short: "PDF",
        boxClass: "bg-red-50 text-red-700 border-red-200",
      };
    case "ppt":
      return {
        label: "Presentasi PPT",
        short: "PPT",
        boxClass: "bg-amber-50 text-amber-800 border-amber-200",
      };
    case "doc":
      return {
        label: "Dokumen Word",
        short: "DOC",
        boxClass: "bg-sky-50 text-sky-700 border-sky-200",
      };
    case "sheet":
      return {
        label: "Spreadsheet",
        short: "XLS",
        boxClass: "bg-[#f2fcd4] text-[#365314] border-[#bef264]",
      };
    default:
      return {
        label: "Berkas Lampiran",
        short: "FILE",
        boxClass: "bg-slate-100 text-slate-700 border-slate-200",
      };
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(kb >= 100 ? 0 : 1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(mb >= 100 ? 0 : 1)} MB`;
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  return cleaned.slice(-100) || "lampiran";
}

export async function uploadTaskFiles(
  userId: string,
  files: File[],
): Promise<{ uploaded: TaskAttachment[]; errors: string[] }> {
  const supabase = createClient();
  const uploaded: TaskAttachment[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`"${file.name}" melebihi batas maksimal 50 MB.`);
      continue;
    }

    const id = crypto.randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${userId}/${id}-${safeName}`;
    const contentType = file.type || "application/octet-stream";

    const { error: uploadErr } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .upload(storagePath, file, {
        contentType,
        upsert: false,
      });

    if (uploadErr) {
      const msg = uploadErr.message.toLowerCase();
      if (msg.includes("bucket not found") || msg.includes("does not exist")) {
        errors.push(
          "Bucket 'task-attachments' belum ada di Supabase. Jalankan file supabase/attachments.sql di Supabase SQL Editor terlebih dahulu.",
        );
        break;
      }
      errors.push(`Gagal mengunggah "${file.name}": ${uploadErr.message}`);
      continue;
    }

    const { data: signedData } = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 12);

    uploaded.push({
      id,
      name: file.name,
      path: storagePath,
      mime_type: contentType,
      size: file.size,
      uploaded_at: new Date().toISOString(),
      signed_url: signedData?.signedUrl,
    });
  }

  return { uploaded, errors };
}

export async function removeStoragePathsClient(paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const supabase = createClient();
  await supabase.storage.from(ATTACHMENT_BUCKET).remove(paths);
}

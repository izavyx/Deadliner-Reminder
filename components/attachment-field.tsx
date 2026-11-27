"use client";

import { useRef, useState } from "react";
import type { TaskAttachment } from "@/lib/types";
import {
  formatFileSize,
  getFileBadgeMeta,
  getFileCategory,
  removeStoragePathsClient,
  uploadTaskFiles,
} from "@/lib/attachments";
import { PaperclipIcon } from "@/components/icons";
import { useToast } from "@/components/toast";
import { Spinner } from "@/components/ui";

const ACCEPT_EXTENSIONS =
  "image/*,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.py,.ipynb";

export function AttachmentField({
  userId,
  defaultAttachments = [],
  onUploadingChange,
}: {
  userId: string;
  defaultAttachments?: TaskAttachment[];
  onUploadingChange?: (uploading: boolean) => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialIds = useRef(new Set(defaultAttachments.map((a) => a.id)));
  const [items, setItems] = useState<TaskAttachment[]>(defaultAttachments);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function setBusy(next: boolean) {
    setUploading(next);
    onUploadingChange?.(next);
  }

  async function processFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setBusy(true);
    try {
      const { uploaded, errors } = await uploadTaskFiles(userId, files);
      for (const err of errors) toast("error", err);
      if (uploaded.length > 0) {
        setItems((prev) => [...prev, ...uploaded]);
        setDirty(true);
        toast("success", `${uploaded.length} lampiran siap disimpan.`);
      }
    } catch {
      toast("error", "Gagal mengunggah lampiran. Periksa koneksi internetmu.");
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleRemove(target: TaskAttachment) {
    setItems((prev) => prev.filter((x) => x.id !== target.id));
    setDirty(true);

    if (initialIds.current.has(target.id)) {
      setRemovedPaths((prev) => [...prev, target.path]);
    } else {
      await removeStoragePathsClient([target.path]);
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    const pastedFiles: File[] = [];
    for (const item of Array.from(e.clipboardData.items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) {
          const ext = f.type.split("/")[1] || "png";
          const named =
            f.name && f.name !== "image.png"
              ? f
              : new File([f], `Screenshot_${Date.now()}.${ext}`, { type: f.type });
          pastedFiles.push(named);
        }
      }
    }
    if (pastedFiles.length > 0) {
      e.preventDefault();
      void processFiles(pastedFiles);
    }
  }

  const serializedItems = JSON.stringify(
    items.map(({ id, name, path, mime_type, size, uploaded_at }) => ({
      id,
      name,
      path,
      mime_type,
      size,
      uploaded_at,
    })),
  );

  return (
    <div onPaste={handlePaste} className="space-y-2.5">
      <input type="hidden" name="attachments" value={serializedItems} />
      <input type="hidden" name="attachments_dirty" value={dirty ? "1" : "0"} />
      <input type="hidden" name="removed_paths" value={JSON.stringify(removedPaths)} />

      <div className="flex items-center justify-between">
        <span className="block text-xs font-semibold text-slate-600">
          Lampiran Materi / Soal (Gambar, PDF, PPT, Word)
        </span>
        {items.length > 0 && (
          <span className="rounded-full bg-[#eaf1ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#2563eb]">
            {items.length} file terlampir
          </span>
        )}
      </div>

      {/* Dropzone Mode Terang Biru-Hijau */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) {
            void processFiles(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (!uploading) fileInputRef.current?.click();
        }}
        className={`cursor-pointer rounded-2xl border-2 border-dashed px-4 py-4 text-center transition ${
          dragOver
            ? "border-[#2563eb] bg-[#eaf1ff]/70"
            : "border-slate-200 bg-slate-50/60 hover:border-[#2563eb] hover:bg-[#f4f8ff]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT_EXTENSIONS}
          onChange={(e) => {
            if (e.target.files) void processFiles(e.target.files);
          }}
          className="hidden"
        />

        {uploading ? (
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2563eb]">
            <Spinner className="h-4 w-4" />
            <span>Mengunggah file ke ruang tugas...</span>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-[#181b20]">
              <PaperclipIcon className="h-3.5 w-3.5 text-[#2563eb]" />
              <span>
                Klik pilih file, tarik ke sini, atau{" "}
                <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px]">
                  Ctrl+V
                </kbd>{" "}
                screenshot
              </span>
            </p>
            <p className="text-[11px] text-slate-500">
              Mendukung Gambar, PDF, PPT/PPTX, DOCX, XLSX (maks. 50 MB/file)
            </p>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <ul className="grid gap-2">
          {items.map((att) => {
            const cat = getFileCategory(att.mime_type, att.name);
            const meta = getFileBadgeMeta(cat);
            return (
              <li
                key={att.id}
                className="flex items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-white p-2"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  {cat === "image" && att.signed_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={att.signed_url}
                      alt={att.name}
                      className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-cover"
                    />
                  ) : (
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-[10px] font-extrabold ${meta.boxClass}`}
                    >
                      {meta.short}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[#181b20]">
                      {att.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {meta.label} · {formatFileSize(att.size)}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleRemove(att)}
                  aria-label={`Hapus ${att.name}`}
                  className="shrink-0 rounded-full p-1.5 text-xs text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

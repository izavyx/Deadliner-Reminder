"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { Task, TaskAttachment } from "@/lib/types";
import {
  formatFileSize,
  getFileBadgeMeta,
  getFileCategory,
  isOfficePreviewable,
  uploadTaskFiles,
} from "@/lib/attachments";
import {
  appendTaskAttachmentsAction,
  removeTaskAttachmentAction,
} from "@/app/dashboard/actions";
import { useToast } from "@/components/toast";
import { Modal, Spinner, btnPrimary, btnSecondary } from "@/components/ui";

const ACCEPT_EXTENSIONS =
  "image/*,.pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.csv,.txt,.zip,.rar,.py,.ipynb";

const fullDateFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type DeadlineBadgeInfo = {
  label: string;
  badge: string;
  urgent: boolean;
};

/** Render teks deskripsi dengan mendeteksi link URL secara otomatis agar bisa diklik. */
function RichNotes({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
      {parts.map((part, idx) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-indigo-600 underline decoration-indigo-400/60 underline-offset-2 hover:text-indigo-700 dark:text-indigo-400"
          >
            {part}
          </a>
        ) : (
          <span key={idx}>{part}</span>
        ),
      )}
    </p>
  );
}

function AttachmentPreviewOverlay({
  attachments,
  activeIndex,
  onChangeIndex,
  onClose,
}: {
  attachments: TaskAttachment[];
  activeIndex: number;
  onChangeIndex: (nextIdx: number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [officeEngine, setOfficeEngine] = useState<"microsoft" | "google">("microsoft");

  const current = attachments[activeIndex];
  const hasPrev = activeIndex > 0;
  const hasNext = activeIndex < attachments.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      } else if (e.key === "ArrowLeft" && hasPrev) {
        onChangeIndex(activeIndex - 1);
      } else if (e.key === "ArrowRight" && hasNext) {
        onChangeIndex(activeIndex + 1);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [activeIndex, hasNext, hasPrev, onChangeIndex, onClose]);

  if (!current) return null;

  const cat = getFileCategory(current.mime_type, current.name);
  const meta = getFileBadgeMeta(cat);
  const signedUrl = current.signed_url;
  const canOfficeEmbed = Boolean(signedUrl && isOfficePreviewable(cat, current.name));

  const officeEmbedUrl = signedUrl
    ? officeEngine === "microsoft"
      ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(signedUrl)}`
      : `https://docs.google.com/gview?url=${encodeURIComponent(signedUrl)}&embedded=true`
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pratinjau ${current.name}`}
      className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-zinc-950/92 text-white backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Topbar Pratinjau ala Google Classroom */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-zinc-900/90 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-white/20"
          >
            ← Kembali
          </button>
          <span
            className={`hidden rounded-md border px-2 py-0.5 text-[10px] font-bold sm:inline-block ${meta.boxClass}`}
          >
            {meta.short}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{current.name}</p>
            <p className="text-[11px] text-zinc-400">
              {meta.label} · {formatFileSize(current.size)}
              {attachments.length > 1 && ` · File ${activeIndex + 1} dari ${attachments.length}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {cat === "image" && (
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
            >
              {zoomed ? "🔍 Sesuaikan Layar" : "🔍 Perbesar 100%"}
            </button>
          )}

          {canOfficeEmbed && (
            <div className="inline-flex rounded-lg border border-white/15 bg-zinc-800/80 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setOfficeEngine("microsoft")}
                className={`rounded-md px-2 py-1 font-medium transition ${
                  officeEngine === "microsoft"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Office Viewer
              </button>
              <button
                type="button"
                onClick={() => setOfficeEngine("google")}
                className={`rounded-md px-2 py-1 font-medium transition ${
                  officeEngine === "google"
                    ? "bg-indigo-600 text-white"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Google Viewer
              </button>
            </div>
          )}

          {attachments.length > 1 && (
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled={!hasPrev}
                onClick={() => {
                  setZoomed(false);
                  onChangeIndex(activeIndex - 1);
                }}
                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium transition hover:bg-white/10 disabled:opacity-35"
                title="Lampiran sebelumnya (←)"
              >
                ‹
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => {
                  setZoomed(false);
                  onChangeIndex(activeIndex + 1);
                }}
                className="rounded-lg border border-white/15 px-2.5 py-1.5 text-xs font-medium transition hover:bg-white/10 disabled:opacity-35"
                title="Lampiran berikutnya (→)"
              >
                ›
              </button>
            </div>
          )}

          {signedUrl && (
            <>
              <a
                href={signedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:bg-white/10"
              >
                Buka Tab Baru ↗
              </a>
              <a
                href={`${signedUrl}${signedUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(current.name)}`}
                download={current.name}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-500"
              >
                ⬇ Unduh
              </a>
            </>
          )}
        </div>
      </div>

      {/* Area Konten Pratinjau */}
      <div
        className="flex flex-1 items-center justify-center overflow-auto p-4 sm:p-6"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {!signedUrl ? (
          <div className="max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 text-center">
            <p className="text-sm font-medium text-zinc-200">
              Link pratinjau tidak tersedia atau sudah kedaluwarsa.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Muat ulang halaman dashboard untuk memperbarui sesi file.
            </p>
          </div>
        ) : cat === "image" ? (
          <div
            className={`flex items-center justify-center ${
              zoomed ? "min-h-full min-w-full overflow-auto" : "max-h-full max-w-5xl"
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signedUrl}
              alt={current.name}
              onClick={() => setZoomed((z) => !z)}
              className={`rounded-xl bg-zinc-900 shadow-2xl transition ${
                zoomed
                  ? "cursor-zoom-out max-w-none"
                  : "max-h-[80vh] w-auto max-w-full cursor-zoom-in object-contain"
              }`}
            />
          </div>
        ) : cat === "pdf" ? (
          <iframe
            src={signedUrl}
            title={current.name}
            className="h-[80vh] w-full max-w-5xl rounded-xl border border-white/10 bg-white shadow-2xl"
          />
        ) : canOfficeEmbed ? (
          <div className="flex h-[80vh] w-full max-w-5xl flex-col gap-2">
            <iframe
              key={`${current.id}-${officeEngine}`}
              src={officeEmbedUrl}
              title={current.name}
              className="h-full w-full rounded-xl border border-white/10 bg-white shadow-2xl"
            />
            <p className="text-center text-[11px] text-zinc-400">
              Jika slide/dokumen lambat dimuat, coba ganti tab <strong>Google Viewer</strong> di kanan atas atau klik <strong>Unduh</strong>.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-8 text-center shadow-2xl">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border text-base font-extrabold ${meta.boxClass}`}
            >
              {meta.short}
            </div>
            <h3 className="mt-4 break-all text-base font-semibold text-white">
              {current.name}
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              {meta.label} · {formatFileSize(current.size)}
            </p>
            <p className="mt-4 text-xs text-zinc-400">
              Format file ini tidak dapat dirender langsung di browser. Silakan unduh untuk membukanya di perangkatmu.
            </p>
            <a
              href={`${signedUrl}${signedUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(current.name)}`}
              download={current.name}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              ⬇ Unduh File Sekarang
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function TaskDetailModal({
  task,
  userId,
  status,
  isToggling,
  onClose,
  onToggleDone,
  onEdit,
  onDelete,
}: {
  task: Task | null;
  userId: string;
  status: DeadlineBadgeInfo | null;
  isToggling: boolean;
  onClose: () => void;
  onToggleDone: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deletingAttId, setDeletingAttId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Optimistic / live list agar upload langsung muncul seketika di modal Classroom
  const [optimisticAdded, setOptimisticAdded] = useState<{
    taskId: string;
    items: TaskAttachment[];
  }>({ taskId: "", items: [] });

  const baseAttachments = task?.attachments ?? [];
  const baseIds = new Set(baseAttachments.map((a) => a.id));
  const extraItems =
    task && optimisticAdded.taskId === task.id
      ? optimisticAdded.items.filter((a) => !baseIds.has(a.id))
      : [];
  const attachments = [...baseAttachments, ...extraItems];

  async function handleQuickUpload(fileList: FileList | File[]) {
    if (!task) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const { uploaded, errors } = await uploadTaskFiles(userId, files);
      for (const err of errors) toast("error", err);

      if (uploaded.length > 0) {
        setOptimisticAdded((prev) => ({
          taskId: task.id,
          items: prev.taskId === task.id ? [...prev.items, ...uploaded] : uploaded,
        }));

        const res = await appendTaskAttachmentsAction(task.id, uploaded);
        toast(res.ok ? "success" : "error", res.message);
        if (!res.ok) {
          setOptimisticAdded({ taskId: task.id, items: [] });
        }
      }
    } catch {
      toast("error", "Terjadi kesalahan saat mengunggah lampiran.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleRemoveAttachment(att: TaskAttachment) {
    if (!task) return;
    setDeletingAttId(att.id);
    startTransition(async () => {
      try {
        const res = await removeTaskAttachmentAction(task.id, att.id);
        toast(res.ok ? "success" : "error", res.message);
        if (res.ok) {
          setOptimisticAdded((prev) => ({
            taskId: task.id,
            items: prev.items.filter((x) => x.id !== att.id),
          }));
        }
      } catch {
        toast("error", "Gagal menghapus lampiran.");
      } finally {
        setDeletingAttId(null);
      }
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    if (!task) return;
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
      void handleQuickUpload(pastedFiles);
    }
  }

  return (
    <>
      <Modal
        open={Boolean(task)}
        onClose={() => {
          setPreviewIdx(null);
          onClose();
        }}
        title="Ruang Detail Tugas"
        maxWidthClass="max-w-3xl"
        disableEscape={previewIdx !== null}
      >
        {task && status && (
          <div
            onPaste={handlePaste}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files?.length) {
                void handleQuickUpload(e.dataTransfer.files);
              }
            }}
            className="space-y-6"
          >
            {/* Header Tugas bergaya Google Classroom */}
            <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg font-bold text-white shadow-sm ${
                    task.is_done ? "bg-emerald-600" : "bg-indigo-600"
                  }`}
                >
                  {task.is_done ? "✓" : "📋"}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.course && (
                      <span className="rounded-md bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                        {task.course}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}
                    >
                      {status.label}
                    </span>
                  </div>
                  <h3
                    className={`text-xl font-bold tracking-tight ${
                      task.is_done
                        ? "text-zinc-400 line-through"
                        : "text-zinc-900 dark:text-zinc-50"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    ⏰ Tenggat pengumpulan:{" "}
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">
                      {fullDateFmt.format(new Date(task.deadline))}
                    </span>
                  </p>
                </div>
              </div>

              {/* Aksi Cepat Tugas */}
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() => onToggleDone(task)}
                  className={
                    task.is_done
                      ? btnSecondary
                      : "inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                  }
                >
                  {isToggling && <Spinner className="h-3.5 w-3.5" />}
                  {task.is_done ? "Batalkan Selesai" : "✓ Tandai Selesai"}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/50"
                >
                  Hapus
                </button>
              </div>
            </div>

            {/* Bagian Deskripsi / Instruksi Tugas */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Deskripsi & Instruksi Tugas
              </h4>
              <div className="rounded-xl border border-zinc-200/80 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
                {task.notes ? (
                  <RichNotes text={task.notes} />
                ) : (
                  <p className="text-sm italic text-zinc-400">
                    Belum ada catatan atau instruksi tugas. Klik tombol{" "}
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="font-medium text-indigo-600 not-italic hover:underline dark:text-indigo-400"
                    >
                      Edit
                    </button>{" "}
                    untuk menambahkan detail soal atau link pengumpulan.
                  </p>
                )}
              </div>
            </div>

            {/* Bagian Lampiran Materi & Soal ala Google Classroom */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Lampiran Materi & Soal ({attachments.length})
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Simpan soal, slide PPT, atau PDF di sini agar tidak perlu mencari lagi di WhatsApp / VClass.
                  </p>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={ACCEPT_EXTENSIONS}
                    onChange={(e) => {
                      if (e.target.files) void handleQuickUpload(e.target.files);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                    className={`${btnPrimary} !px-3 !py-1.5 !text-xs`}
                  >
                    {uploading ? (
                      <>
                        <Spinner className="h-3.5 w-3.5" />
                        Mengunggah...
                      </>
                    ) : (
                      "+ Lampirkan File"
                    )}
                  </button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <div
                  onClick={() => {
                    if (!uploading) fileInputRef.current?.click();
                  }}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                    dragOver
                      ? "border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40"
                      : "border-zinc-200 hover:border-indigo-400 hover:bg-zinc-50/60 dark:border-zinc-800 dark:hover:border-indigo-500 dark:hover:bg-zinc-800/30"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    📂 Belum ada materi atau soal terlampir
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    Klik untuk mengunggah Gambar, PDF, atau PPT — atau langsung{" "}
                    <kbd className="rounded border border-zinc-300 bg-zinc-100 px-1.5 py-0.5 text-[10px] dark:border-zinc-700 dark:bg-zinc-800">
                      Ctrl+V
                    </kbd>{" "}
                    screenshot soal di sini.
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-3 sm:grid-cols-2 ${
                    dragOver ? "rounded-2xl ring-2 ring-indigo-500 ring-offset-2" : ""
                  }`}
                >
                  {attachments.map((att, idx) => {
                    const cat = getFileCategory(att.mime_type, att.name);
                    const meta = getFileBadgeMeta(cat);
                    const isRemoving = deletingAttId === att.id;

                    return (
                      <div
                        key={att.id}
                        onClick={() => setPreviewIdx(idx)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setPreviewIdx(idx);
                          }
                        }}
                        className="group flex cursor-pointer items-stretch overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-xs transition hover:border-indigo-400 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-indigo-500/70"
                      >
                        {/* Thumbnail Kiri ala Kartu Classroom */}
                        <div className="flex w-20 shrink-0 items-center justify-center border-r border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950">
                          {cat === "image" && att.signed_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={att.signed_url}
                              alt={att.name}
                              className="h-full w-full object-cover transition group-hover:scale-105"
                            />
                          ) : (
                            <span
                              className={`rounded-lg border px-2.5 py-1 text-xs font-extrabold ${meta.boxClass}`}
                            >
                              {meta.short}
                            </span>
                          )}
                        </div>

                        {/* Info File */}
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2 p-3">
                          <div className="min-w-0">
                            <p
                              className="truncate text-sm font-semibold text-zinc-800 group-hover:text-indigo-600 dark:text-zinc-100 dark:group-hover:text-indigo-400"
                              title={att.name}
                            >
                              {att.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-zinc-500">
                              {meta.label} · {formatFileSize(att.size)}
                            </p>
                            <span className="mt-1 inline-block text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                              Klik untuk preview →
                            </span>
                          </div>

                          {/* Tombol Unduh & Hapus */}
                          <div
                            className="flex shrink-0 flex-col items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {att.signed_url && (
                              <a
                                href={`${att.signed_url}${att.signed_url.includes("?") ? "&" : "?"}download=${encodeURIComponent(att.name)}`}
                                download={att.name}
                                title="Unduh lampiran"
                                className="rounded-lg p-1.5 text-xs text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                              >
                                ⬇
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => handleRemoveAttachment(att)}
                              title="Hapus lampiran"
                              className="rounded-lg p-1.5 text-xs text-zinc-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                            >
                              {isRemoving ? <Spinner className="h-3.5 w-3.5" /> : "🗑"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Lightbox Previewer Layar Penuh ala Google Classroom */}
      {previewIdx !== null && attachments[previewIdx] && (
        <AttachmentPreviewOverlay
          attachments={attachments}
          activeIndex={previewIdx}
          onChangeIndex={setPreviewIdx}
          onClose={() => setPreviewIdx(null)}
        />
      )}
    </>
  );
}

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
import {
  ArrowUpRightIcon,
  AssignmentBoardIcon,
  CalendarIcon,
  CheckIcon,
  DownloadIcon,
  FolderUploadIcon,
  PlusIcon,
  TrashIcon,
} from "@/components/icons";
import { useToast } from "@/components/toast";
import { Modal, Spinner, btnLime, btnPrimary, btnSecondary } from "@/components/ui";

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
    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
      {parts.map((part, idx) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={idx}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-[#2563eb] underline decoration-blue-400/60 underline-offset-2 hover:text-[#1d4ed8]"
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
      className="animate-fade-in fixed inset-0 z-50 flex flex-col bg-slate-900/80 backdrop-blur-md"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Topbar Pratinjau Mode Terang Bersih */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 text-[#181b20] shadow-xs">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            ← Kembali
          </button>
          <span
            className={`hidden rounded-md border px-2 py-0.5 text-[10px] font-bold sm:inline-block ${meta.boxClass}`}
          >
            {meta.short}
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-bold">{current.name}</p>
            <p className="text-[11px] text-slate-500">
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
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {zoomed ? "Sesuaikan Layar" : "Perbesar 100%"}
            </button>
          )}

          {canOfficeEmbed && (
            <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setOfficeEngine("microsoft")}
                className={`rounded-full px-2.5 py-1 font-semibold transition ${
                  officeEngine === "microsoft"
                    ? "bg-[#2563eb] text-white"
                    : "text-slate-600 hover:text-[#181b20]"
                }`}
              >
                Office Viewer
              </button>
              <button
                type="button"
                onClick={() => setOfficeEngine("google")}
                className={`rounded-full px-2.5 py-1 font-semibold transition ${
                  officeEngine === "google"
                    ? "bg-[#2563eb] text-white"
                    : "text-slate-600 hover:text-[#181b20]"
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
                aria-label="Lampiran sebelumnya"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-35"
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
                aria-label="Lampiran berikutnya"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-35"
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
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Tab Baru
                <ArrowUpRightIcon className="h-3.5 w-3.5" />
              </a>
              <a
                href={`${signedUrl}${signedUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(current.name)}`}
                download={current.name}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#bff227] px-3.5 py-1.5 text-xs font-bold text-[#181b20] transition hover:bg-[#b1e519]"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Unduh
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
          <div className="max-w-md rounded-3xl bg-white p-6 text-center shadow-xl">
            <p className="text-sm font-semibold text-[#181b20]">
              Link pratinjau tidak tersedia atau sudah kedaluwarsa.
            </p>
            <p className="mt-1 text-xs text-slate-500">
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
              className={`rounded-2xl bg-white shadow-2xl transition ${
                zoomed
                  ? "max-w-none cursor-zoom-out"
                  : "max-h-[80vh] w-auto max-w-full cursor-zoom-in object-contain"
              }`}
            />
          </div>
        ) : cat === "pdf" ? (
          <iframe
            src={signedUrl}
            title={current.name}
            className="h-[80vh] w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl"
          />
        ) : canOfficeEmbed ? (
          <div className="flex h-[80vh] w-full max-w-5xl flex-col gap-2">
            <iframe
              key={`${current.id}-${officeEngine}`}
              src={officeEmbedUrl}
              title={current.name}
              className="h-full w-full rounded-2xl border border-slate-200 bg-white shadow-2xl"
            />
            <p className="text-center text-xs text-white/90">
              Jika slide/dokumen lambat dimuat, coba ganti tab <strong>Google Viewer</strong> di kanan atas atau klik <strong>Unduh</strong>.
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
            <div
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border text-base font-extrabold ${meta.boxClass}`}
            >
              {meta.short}
            </div>
            <h3 className="mt-4 break-all font-display text-base font-bold text-[#181b20]">
              {current.name}
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              {meta.label} · {formatFileSize(current.size)}
            </p>
            <p className="mt-4 text-xs text-slate-500">
              Format file ini tidak dapat dirender langsung di browser. Silakan unduh untuk membukanya di perangkatmu.
            </p>
            <a
              href={`${signedUrl}${signedUrl.includes("?") ? "&" : "?"}download=${encodeURIComponent(current.name)}`}
              download={current.name}
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8]"
            >
              <DownloadIcon className="h-4 w-4" />
              Unduh File Sekarang
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
            {/* Header Tugas bergaya Classroom + Palet Biru & Hijau Lime */}
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3.5">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-xs ${
                    task.is_done
                      ? "bg-[#bff227] text-[#181b20]"
                      : "bg-[#2563eb] text-white"
                  }`}
                >
                  {task.is_done ? (
                    <CheckIcon className="h-6 w-6" />
                  ) : (
                    <AssignmentBoardIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    {task.course && (
                      <span className="rounded-full bg-[#eaf1ff] px-3 py-0.5 text-xs font-semibold text-[#2563eb]">
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
                    className={`font-display text-xl font-bold tracking-tight sm:text-2xl ${
                      task.is_done ? "text-slate-400 line-through" : "text-[#181b20]"
                    }`}
                  >
                    {task.title}
                  </h3>
                  <p className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <CalendarIcon className="h-3.5 w-3.5 text-[#2563eb]" />
                    <span>
                      Tenggat:{" "}
                      <span className="font-semibold text-slate-700">
                        {fullDateFmt.format(new Date(task.deadline))}
                      </span>
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
                      ? `${btnSecondary} !px-3.5 !py-1.5 !text-xs`
                      : `${btnLime} !px-4 !py-1.5 !text-xs`
                  }
                >
                  {isToggling ? (
                    <Spinner className="h-3.5 w-3.5" />
                  ) : (
                    !task.is_done && <CheckIcon className="h-3.5 w-3.5" />
                  )}
                  {task.is_done ? "Batalkan Selesai" : "Tandai Selesai"}
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(task)}
                  className="rounded-full border border-red-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                >
                  Hapus
                </button>
              </div>
            </div>

            {/* Bagian Deskripsi / Instruksi Tugas */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                Deskripsi &amp; Instruksi Tugas
              </h4>
              <div className="rounded-2xl border border-slate-200/85 bg-[#f8fafd] p-4">
                {task.notes ? (
                  <RichNotes text={task.notes} />
                ) : (
                  <p className="text-sm italic text-slate-400">
                    Belum ada catatan atau instruksi tugas. Klik tombol{" "}
                    <button
                      type="button"
                      onClick={() => onEdit(task)}
                      className="font-semibold text-[#2563eb] not-italic hover:underline"
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
                  <h4 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                    Lampiran Materi &amp; Soal ({attachments.length})
                  </h4>
                  <p className="text-xs text-slate-500">
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
                    className={`${btnPrimary} !min-h-9 !px-4 !py-1.5 !text-xs`}
                  >
                    {uploading ? (
                      <>
                        <Spinner className="h-3.5 w-3.5" />
                        Mengunggah...
                      </>
                    ) : (
                      <>
                        <PlusIcon className="h-3.5 w-3.5" />
                        Lampirkan File
                      </>
                    )}
                  </button>
                </div>
              </div>

              {attachments.length === 0 ? (
                <div
                  onClick={() => {
                    if (!uploading) fileInputRef.current?.click();
                  }}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-7 text-center transition ${
                    dragOver
                      ? "border-[#2563eb] bg-[#eaf1ff]/70"
                      : "border-slate-200 bg-slate-50/50 hover:border-[#2563eb] hover:bg-[#f4f8ff]"
                  }`}
                >
                  <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#eaf1ff] text-[#2563eb]">
                    <FolderUploadIcon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-[#181b20]">
                    Belum ada materi atau soal terlampir
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Klik untuk mengunggah Gambar, PDF, atau PPT — atau langsung{" "}
                    <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-[10px] font-semibold">
                      Ctrl+V
                    </kbd>{" "}
                    screenshot soal di sini.
                  </p>
                </div>
              ) : (
                <div
                  className={`grid gap-3 sm:grid-cols-2 ${
                    dragOver ? "rounded-2xl ring-2 ring-[#2563eb] ring-offset-2" : ""
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
                        className="group flex cursor-pointer items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition hover:border-[#2563eb] hover:shadow-md hover:shadow-blue-950/5"
                      >
                        {/* Thumbnail Kiri ala Kartu Classroom */}
                        <div className="flex w-20 shrink-0 items-center justify-center border-r border-slate-100 bg-slate-50">
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
                              className="truncate text-sm font-semibold text-[#181b20] group-hover:text-[#2563eb]"
                              title={att.name}
                            >
                              {att.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              {meta.label} · {formatFileSize(att.size)}
                            </p>
                            <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563eb]">
                              Buka preview
                              <ArrowUpRightIcon className="h-3 w-3" />
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
                                aria-label={`Unduh ${att.name}`}
                                title="Unduh lampiran"
                                className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-[#2563eb]"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              disabled={isRemoving}
                              onClick={() => handleRemoveAttachment(att)}
                              aria-label={`Hapus ${att.name}`}
                              title="Hapus lampiran"
                              className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              {isRemoving ? (
                                <Spinner className="h-3.5 w-3.5" />
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
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

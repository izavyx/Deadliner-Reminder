"use client";

import { useMemo, useState, useTransition } from "react";
import type { Task } from "@/lib/types";
import { getFileBadgeMeta, getFileCategory } from "@/lib/attachments";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "./actions";
import { AttachmentField } from "@/components/attachment-field";
import { DatePicker } from "@/components/date-picker";
import {
  ArrowUpRightIcon,
  CalendarIcon,
  CheckIcon,
  PaperclipIcon,
  PlusIcon,
  SearchIcon,
  TableListIcon,
} from "@/components/icons";
import { TaskDetailModal } from "@/components/task-detail-modal";
import { useToast } from "@/components/toast";
import {
  CancelButton,
  Modal,
  Spinner,
  SubmitButton,
  btnDanger,
  btnLime,
  btnSecondary,
  inputClass,
} from "@/components/ui";

const dateFmt = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

type FilterKey = "all" | "active" | "urgent" | "done";
type ViewMode = "table" | "calendar";

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DAY_NAMES = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

function getDeadlineStatus(task: Task, now: number) {
  if (task.is_done) {
    return {
      label: "Selesai",
      badge: "bg-[#f2fcd4] text-[#365314] border-[#bef264]",
      urgent: false,
    };
  }
  const diffMs = new Date(task.deadline).getTime() - now;
  const hours = Math.floor(diffMs / 36e5);

  if (diffMs < 0) {
    return {
      label: "Terlambat",
      badge: "bg-red-50 text-red-700 border-red-200",
      urgent: true,
    };
  }
  if (hours < 24) {
    return {
      label: `${Math.max(1, hours)} jam lagi`,
      badge: "bg-red-50 text-red-700 border-red-200",
      urgent: true,
    };
  }
  const days = Math.floor(hours / 24);
  if (days <= 3) {
    return {
      label: `${days} hari lagi`,
      badge: "bg-amber-50 text-amber-800 border-amber-200",
      urgent: true,
    };
  }
  return {
    label: `${days} hari lagi`,
    badge: "bg-[#eaf1ff] text-[#1d4ed8] border-blue-200",
    urgent: false,
  };
}

export function TaskManager({
  tasks,
  serverNow,
  userId,
}: {
  tasks: Task[];
  serverNow: number;
  userId: string;
}) {
  const toast = useToast();

  // Filter, pencarian, dan mode tampilan
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Modal states (Preview Classroom + CRUD)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createKey, setCreateKey] = useState(0);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Status sedang upload file pada form tambah/edit
  const [uploadingCreate, setUploadingCreate] = useState(false);
  const [uploadingEdit, setUploadingEdit] = useState(false);

  // Loading per-request untuk aksi baris (toggle & delete)
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startToggleTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Navigasi bulan pada mode kalender
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(serverNow);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null),
    [tasks, selectedTaskId],
  );

  // Statistik ringkas
  const stats = useMemo(() => {
    let done = 0;
    let urgent = 0;
    for (const t of tasks) {
      if (t.is_done) done++;
      else if (getDeadlineStatus(t, serverNow).urgent) urgent++;
    }
    return {
      total: tasks.length,
      active: tasks.length - done,
      urgent,
      done,
    };
  }, [tasks, serverNow]);

  // Daftar tugas terfilter
  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (filter === "active" && t.is_done) return false;
      if (filter === "done" && !t.is_done) return false;
      if (filter === "urgent" && (t.is_done || !getDeadlineStatus(t, serverNow).urgent)) {
        return false;
      }
      if (!q) return true;
      const inAttachments = (t.attachments ?? []).some((a) =>
        a.name.toLowerCase().includes(q),
      );
      return (
        t.title.toLowerCase().includes(q) ||
        t.course.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q) ||
        inAttachments
      );
    });
  }, [tasks, filter, query, serverNow]);

  function openCreateModal() {
    setCreateKey((k) => k + 1);
    setUploadingCreate(false);
    setCreateOpen(true);
  }

  async function handleCreate(formData: FormData) {
    const res = await createTaskAction(formData);
    toast(res.ok ? "success" : "error", res.message);
    if (res.ok) setCreateOpen(false);
  }

  async function handleUpdate(formData: FormData) {
    const res = await updateTaskAction(formData);
    toast(res.ok ? "success" : "error", res.message);
    if (res.ok) setEditingTask(null);
  }

  function handleToggle(task: Task) {
    setTogglingId(task.id);
    startToggleTransition(async () => {
      try {
        const res = await toggleTaskAction(task.id, task.is_done);
        toast(res.ok ? "success" : "error", res.message);
      } catch {
        toast("error", "Terjadi kesalahan jaringan saat mengubah status.");
      } finally {
        setTogglingId(null);
      }
    });
  }

  function handleConfirmDelete() {
    if (!deletingTask) return;
    const target = deletingTask;
    startDeleteTransition(async () => {
      try {
        const res = await deleteTaskAction(target.id);
        toast(res.ok ? "success" : "error", res.message);
        if (res.ok) {
          if (selectedTaskId === target.id) setSelectedTaskId(null);
          setDeletingTask(null);
        }
      } catch {
        toast("error", "Terjadi kesalahan jaringan saat menghapus tugas.");
      }
    });
  }

  const calendarCells = useMemo(() => {
    const first = new Date(calMonth.year, calMonth.month, 1);
    const leading = (first.getDay() + 6) % 7;
    const totalDays = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
    const cells: { day: number | null; items: Task[] }[] = [];

    for (let i = 0; i < leading; i++) cells.push({ day: null, items: [] });
    for (let d = 1; d <= totalDays; d++) {
      const items = filteredTasks.filter((t) => {
        const dt = new Date(t.deadline);
        return (
          dt.getFullYear() === calMonth.year &&
          dt.getMonth() === calMonth.month &&
          dt.getDate() === d
        );
      });
      cells.push({ day: d, items });
    }
    return cells;
  }, [calMonth, filteredTasks]);

  return (
    <div className="space-y-6">
      {/* Kartu Statistik bergaya Referensi (Putih bersih + Aksen Biru & Hijau Lime) */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total Tugas</p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-[#181b20]">
            {stats.total}
          </p>
        </div>

        <div className="rounded-2xl bg-[#2563eb] p-4 text-white shadow-sm shadow-blue-600/15">
          <p className="text-xs font-medium text-blue-100">Belum Selesai</p>
          <p className="mt-1.5 font-display text-3xl font-extrabold">
            {stats.active}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Mendesak (≤ 3 hari)</p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-amber-600">
            {stats.urgent}
          </p>
        </div>

        <div className="rounded-2xl border border-[#c5f042] bg-[#f2fcd4] p-4 shadow-xs">
          <p className="text-xs font-semibold text-[#365314]">Tuntas / Selesai</p>
          <p className="mt-1.5 font-display text-3xl font-extrabold text-[#181b20]">
            {stats.done}
          </p>
        </div>
      </div>

      {/* Toolbar: Filter Pill, Search, Mode Tampilan, & Tambah Tugas */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-1.5">
          {(
            [
              ["all", `Semua (${stats.total})`],
              ["active", `Aktif (${stats.active})`],
              ["urgent", `Mendesak (${stats.urgent})`],
              ["done", `Selesai (${stats.done})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                filter === key
                  ? "bg-[#2563eb] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-[#181b20]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-60">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari tugas, matkul, atau file..."
              aria-label="Cari tugas, mata kuliah, atau nama file"
              className="w-full rounded-full border border-slate-200 bg-slate-50/70 py-2 pr-3.5 pl-9 text-sm text-[#181b20] placeholder:text-slate-400 outline-none transition focus:border-[#2563eb] focus:bg-white focus:ring-3 focus:ring-[#2563eb]/12"
            />
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-[#181b20] text-white"
                  : "text-slate-600 hover:text-[#181b20]"
              }`}
            >
              <TableListIcon className="h-3.5 w-3.5" />
              Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                viewMode === "calendar"
                  ? "bg-[#181b20] text-white"
                  : "text-slate-600 hover:text-[#181b20]"
              }`}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              Kalender
            </button>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className={btnLime}
          >
            <PlusIcon className="h-4 w-4" />
            Tambah Tugas
          </button>
        </div>
      </div>

      {/* TAMPILAN TABEL CRUD + KLIK BARIS UNTUK PREVIEW CLASSROOM */}
      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-lg shadow-blue-950/[0.03]">
          <div className="flex items-center justify-between border-b border-slate-100 bg-[#f4f8ff] px-5 py-2.5 text-xs text-slate-600">
            <span className="inline-flex items-center gap-2">
              <PaperclipIcon className="h-3.5 w-3.5 shrink-0 text-[#2563eb]" />
              <span>
                Klik baris tugas mana saja untuk membuka{" "}
                <strong className="font-semibold text-[#2563eb]">
                  pop-up deskripsi &amp; lampiran materi/soal
                </strong>{" "}
                ala Google Classroom.
              </span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-xs font-semibold tracking-wider text-slate-500 uppercase">
                  <th className="w-14 px-4 py-3.5 text-center">Selesai</th>
                  <th className="px-4 py-3.5">Tugas, Deskripsi &amp; Lampiran</th>
                  <th className="px-4 py-3.5">Mata Kuliah</th>
                  <th className="px-4 py-3.5">Deadline</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center text-slate-500">
                      {tasks.length === 0
                        ? "Belum ada tugas tercatat. Klik '+ Tambah Tugas' untuk mulai mencatat!"
                        : "Tidak ada tugas yang cocok dengan filter atau pencarian."}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const status = getDeadlineStatus(task, serverNow);
                    const isRowLoading = togglingId === task.id;
                    const attachments = task.attachments ?? [];

                    return (
                      <tr
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`group cursor-pointer transition hover:bg-[#f5f8ff] ${
                          task.is_done ? "opacity-65" : ""
                        }`}
                      >
                        <td
                          className="px-4 py-4 text-center align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            disabled={isRowLoading}
                            onClick={() => handleToggle(task)}
                            aria-label={
                              task.is_done ? "Tandai belum selesai" : "Tandai selesai"
                            }
                            className={`inline-flex h-5 w-5 items-center justify-center rounded-md border-2 transition disabled:cursor-wait ${
                              task.is_done
                                ? "border-[#a3e635] bg-[#bff227] text-[#181b20]"
                                : "border-slate-300 bg-white hover:border-[#2563eb]"
                            }`}
                          >
                            {isRowLoading ? (
                              <Spinner className="h-3 w-3" />
                            ) : task.is_done ? (
                              <CheckIcon className="h-3.5 w-3.5" />
                            ) : null}
                          </button>
                        </td>

                        <td className="max-w-sm px-4 py-4 align-middle">
                          <p
                            className={`font-semibold transition group-hover:text-[#2563eb] ${
                              task.is_done ? "text-slate-400 line-through" : "text-[#181b20]"
                            }`}
                          >
                            {task.title}
                          </p>

                          {task.notes && (
                            <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                              {task.notes}
                            </p>
                          )}

                          {attachments.length > 0 && (
                            <div className="mt-2 flex flex-wrap items-center gap-1.5">
                              {attachments.slice(0, 2).map((att) => {
                                const cat = getFileCategory(att.mime_type, att.name);
                                const meta = getFileBadgeMeta(cat);
                                return (
                                  <span
                                    key={att.id}
                                    className="inline-flex max-w-44 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] text-slate-600"
                                  >
                                    <span
                                      className={`rounded-full border px-1.5 text-[9px] font-bold ${meta.boxClass}`}
                                    >
                                      {meta.short}
                                    </span>
                                    <span className="truncate">{att.name}</span>
                                  </span>
                                );
                              })}
                              {attachments.length > 2 && (
                                <span className="rounded-full bg-[#eaf1ff] px-2 py-0.5 text-[11px] font-semibold text-[#2563eb]">
                                  +{attachments.length - 2} file
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          {task.course ? (
                            <span className="inline-block rounded-full bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                              {task.course}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 align-middle text-xs font-medium text-slate-600">
                          {dateFmt.format(new Date(task.deadline))}
                        </td>

                        <td className="whitespace-nowrap px-4 py-4 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td
                          className="whitespace-nowrap px-5 py-4 text-right align-middle"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setSelectedTaskId(task.id)}
                              className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-[#eaf1ff] px-3 py-1 text-xs font-semibold text-[#2563eb] transition hover:bg-[#2563eb] hover:text-white"
                            >
                              Buka{attachments.length > 0 ? ` (${attachments.length})` : ""}
                              <ArrowUpRightIcon className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadingEdit(false);
                                setEditingTask(task);
                              }}
                              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTask(task)}
                              className="rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
                            >
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* TAMPILAN KALENDER BULANAN */
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-lg shadow-blue-950/[0.03]">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() =>
                setCalMonth((prev) => {
                  const d = new Date(prev.year, prev.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
              className={btnSecondary}
            >
              ‹ Bulan Lalu
            </button>
            <h3 className="font-display text-lg font-bold text-[#181b20]">
              {MONTH_NAMES[calMonth.month]} {calMonth.year}
            </h3>
            <button
              type="button"
              onClick={() =>
                setCalMonth((prev) => {
                  const d = new Date(prev.year, prev.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })
              }
              className={btnSecondary}
            >
              Bulan Depan ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
            {DAY_NAMES.map((d) => (
              <div key={d} className="py-2">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) =>
              cell.day === null ? (
                <div
                  key={`empty-${idx}`}
                  className="min-h-24 rounded-2xl bg-slate-50/70"
                />
              ) : (
                <div
                  key={cell.day}
                  className="min-h-24 rounded-2xl border border-slate-200/85 bg-white p-2 text-xs"
                >
                  <div className="mb-1.5 font-display font-bold text-slate-600">
                    {cell.day}
                  </div>
                  <div className="space-y-1">
                    {cell.items.map((t) => {
                      const hasFiles = (t.attachments?.length ?? 0) > 0;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`flex w-full items-center justify-between gap-1 rounded-lg px-2 py-1 text-left text-[11px] font-semibold transition ${
                            t.is_done
                              ? "bg-[#f2fcd4] text-[#365314] line-through opacity-75"
                              : "bg-[#eaf1ff] text-[#1d4ed8] hover:bg-[#2563eb] hover:text-white"
                          }`}
                          title={`${t.title} (${dateFmt.format(new Date(t.deadline))})`}
                        >
                          <span className="truncate">{t.title}</span>
                          {hasFiles && <PaperclipIcon className="h-3 w-3 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* POP-UP DETAIL & PREVIEW TUGAS ALA GOOGLE CLASSROOM */}
      <TaskDetailModal
        task={selectedTask}
        userId={userId}
        status={selectedTask ? getDeadlineStatus(selectedTask, serverNow) : null}
        isToggling={Boolean(selectedTask && togglingId === selectedTask.id)}
        onClose={() => setSelectedTaskId(null)}
        onToggleDone={handleToggle}
        onEdit={(t) => {
          setSelectedTaskId(null);
          setUploadingEdit(false);
          setEditingTask(t);
        }}
        onDelete={(t) => {
          setDeletingTask(t);
        }}
      />

      {/* MODAL TAMBAH TUGAS (CREATE) */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Tugas Baru"
        maxWidthClass="max-w-lg"
      >
        <form key={createKey} action={handleCreate} className="grid gap-3.5">
          <div>
            <label
              htmlFor="create-title"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Judul Tugas *
            </label>
            <input
              id="create-title"
              name="title"
              required
              placeholder="Contoh: Laporan Akhir PAP 1 Rekursif"
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="create-course"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Mata Kuliah
            </label>
            <input
              id="create-course"
              name="course"
              placeholder="Contoh: Algoritma & Pemrograman 1"
              className={inputClass}
            />
          </div>

          <div>
            <span className="mb-1 block text-xs font-semibold text-slate-600">
              Tanggal &amp; Jam Deadline *
            </span>
            <DatePicker name="deadline" />
          </div>

          <div>
            <label
              htmlFor="create-notes"
              className="mb-1 block text-xs font-semibold text-slate-600"
            >
              Deskripsi / Instruksi Tugas
            </label>
            <textarea
              id="create-notes"
              name="notes"
              rows={3}
              placeholder="Ketentuan soal, format nama file, link pengumpulan VClass, atau pembagian kelompok..."
              className={inputClass}
            />
          </div>

          <AttachmentField
            userId={userId}
            onUploadingChange={setUploadingCreate}
          />

          <div className="mt-2 flex justify-end gap-2">
            <CancelButton onClick={() => setCreateOpen(false)} />
            <SubmitButton
              disabled={uploadingCreate}
              pendingText="Menyimpan..."
            >
              {uploadingCreate ? "Menunggu Upload..." : "Simpan Tugas"}
            </SubmitButton>
          </div>
        </form>
      </Modal>

      {/* MODAL EDIT TUGAS (UPDATE) */}
      <Modal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit Tugas & Lampiran"
        maxWidthClass="max-w-lg"
      >
        {editingTask && (
          <form key={editingTask.id} action={handleUpdate} className="grid gap-3.5">
            <input type="hidden" name="id" value={editingTask.id} />

            <div>
              <label
                htmlFor="edit-title"
                className="mb-1 block text-xs font-semibold text-slate-600"
              >
                Judul Tugas *
              </label>
              <input
                id="edit-title"
                name="title"
                required
                defaultValue={editingTask.title}
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="edit-course"
                className="mb-1 block text-xs font-semibold text-slate-600"
              >
                Mata Kuliah
              </label>
              <input
                id="edit-course"
                name="course"
                defaultValue={editingTask.course}
                className={inputClass}
              />
            </div>

            <div>
              <span className="mb-1 block text-xs font-semibold text-slate-600">
                Tanggal &amp; Jam Deadline *
              </span>
              <DatePicker name="deadline" defaultValue={editingTask.deadline} />
            </div>

            <div>
              <label
                htmlFor="edit-notes"
                className="mb-1 block text-xs font-semibold text-slate-600"
              >
                Deskripsi / Instruksi Tugas
              </label>
              <textarea
                id="edit-notes"
                name="notes"
                rows={3}
                defaultValue={editingTask.notes}
                className={inputClass}
              />
            </div>

            <AttachmentField
              userId={userId}
              defaultAttachments={editingTask.attachments ?? []}
              onUploadingChange={setUploadingEdit}
            />

            <div className="mt-2 flex justify-end gap-2">
              <CancelButton onClick={() => setEditingTask(null)} />
              <SubmitButton
                disabled={uploadingEdit}
                pendingText="Memperbarui..."
              >
                {uploadingEdit ? "Menunggu Upload..." : "Simpan Perubahan"}
              </SubmitButton>
            </div>
          </form>
        )}
      </Modal>

      {/* MODAL KONFIRMASI HAPUS (DELETE) */}
      <Modal
        open={Boolean(deletingTask)}
        onClose={() => {
          if (!isDeleting) setDeletingTask(null);
        }}
        title="Hapus Tugas?"
      >
        {deletingTask && (
          <div>
            <p className="text-sm leading-relaxed text-slate-600">
              Apakah kamu yakin ingin menghapus tugas{" "}
              <span className="font-semibold text-[#181b20]">
                &ldquo;{deletingTask.title}&rdquo;
              </span>
              ? Seluruh file lampiran di dalamnya juga akan ikut dihapus permanen.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingTask(null)}
                className={btnSecondary}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className={btnDanger}
              >
                {isDeleting && <Spinner />}
                {isDeleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

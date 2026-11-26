"use client";

import { useMemo, useState, useTransition } from "react";
import type { Task } from "@/lib/types";
import {
  createTaskAction,
  deleteTaskAction,
  toggleTaskAction,
  updateTaskAction,
} from "./actions";
import { DatePicker } from "@/components/date-picker";
import { useToast } from "@/components/toast";
import {
  CancelButton,
  Modal,
  Spinner,
  SubmitButton,
  btnDanger,
  btnPrimary,
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
      badge:
        "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900",
      urgent: false,
    };
  }
  const diffMs = new Date(task.deadline).getTime() - now;
  const hours = Math.floor(diffMs / 36e5);

  if (diffMs < 0) {
    return {
      label: "Terlambat",
      badge:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
      urgent: true,
    };
  }
  if (hours < 24) {
    return {
      label: `${Math.max(1, hours)} jam lagi`,
      badge:
        "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-900",
      urgent: true,
    };
  }
  const days = Math.floor(hours / 24);
  if (days <= 3) {
    return {
      label: `${days} hari lagi`,
      badge:
        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900",
      urgent: true,
    };
  }
  return {
    label: `${days} hari lagi`,
    badge:
      "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900",
    urgent: false,
  };
}

export function TaskManager({
  tasks,
  serverNow,
}: {
  tasks: Task[];
  serverNow: number;
}) {
  const toast = useToast();

  // Filter, pencarian, dan mode tampilan
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  // Modal states (CRUD)
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Loading per-request untuk aksi baris (toggle & delete)
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [, startToggleTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();

  // Navigasi bulan pada mode kalender
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(serverNow);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

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
      return (
        t.title.toLowerCase().includes(q) ||
        t.course.toLowerCase().includes(q) ||
        t.notes.toLowerCase().includes(q)
      );
    });
  }, [tasks, filter, query, serverNow]);

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
        if (res.ok) setDeletingTask(null);
      } catch {
        toast("error", "Terjadi kesalahan jaringan saat menghapus tugas.");
      }
    });
  }

  // Data kalender bulanan
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
      {/* Kartu Statistik */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500">Total Tugas</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500">Belum Selesai</p>
          <p className="mt-1 text-2xl font-bold text-indigo-600">{stats.active}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500">Mendesak (≤ 3 hari)</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">{stats.urgent}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-xs font-medium text-zinc-500">Selesai</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.done}</p>
        </div>
      </div>

      {/* Toolbar: Filter, Search, Mode Tampilan, & Tambah Tugas */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 lg:flex-row lg:items-center lg:justify-between">
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
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                filter === key
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul atau matkul..."
            className="w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-indigo-500 sm:w-56 dark:border-zinc-700"
          />

          <div className="inline-flex rounded-lg border border-zinc-200 p-0.5 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === "table"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              📋 Tabel
            </button>
            <button
              type="button"
              onClick={() => setViewMode("calendar")}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                viewMode === "calendar"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              📅 Kalender
            </button>
          </div>

          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className={btnPrimary}
          >
            + Tambah Tugas
          </button>
        </div>
      </div>

      {/* TAMPILAN TABEL CRUD */}
      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/50">
                  <th className="w-12 px-4 py-3 text-center">Selesai</th>
                  <th className="px-4 py-3">Tugas & Catatan</th>
                  <th className="px-4 py-3">Mata Kuliah</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-zinc-500">
                      {tasks.length === 0
                        ? "Belum ada tugas tercatat. Klik '+ Tambah Tugas' untuk mulai mencatat!"
                        : "Tidak ada tugas yang cocok dengan filter atau pencarian."}
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map((task) => {
                    const status = getDeadlineStatus(task, serverNow);
                    const isRowLoading = togglingId === task.id;
                    return (
                      <tr
                        key={task.id}
                        className={`transition hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 ${
                          task.is_done ? "opacity-65" : ""
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center align-middle">
                          <button
                            type="button"
                            disabled={isRowLoading}
                            onClick={() => handleToggle(task)}
                            aria-label={
                              task.is_done ? "Tandai belum selesai" : "Tandai selesai"
                            }
                            className={`inline-flex h-5 w-5 items-center justify-center rounded border-2 transition disabled:cursor-wait ${
                              task.is_done
                                ? "border-emerald-500 bg-emerald-500 text-white"
                                : "border-zinc-400 hover:border-indigo-500"
                            }`}
                          >
                            {isRowLoading ? (
                              <Spinner className="h-3 w-3" />
                            ) : task.is_done ? (
                              <span className="text-xs font-bold">✓</span>
                            ) : null}
                          </button>
                        </td>

                        <td className="max-w-xs px-4 py-3.5 align-middle">
                          <p
                            className={`font-medium ${
                              task.is_done ? "text-zinc-400 line-through" : ""
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">
                              {task.notes}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          {task.course ? (
                            <span className="inline-block rounded-md bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              {task.course}
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400">—</span>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 align-middle text-xs text-zinc-600 dark:text-zinc-300">
                          {dateFmt.format(new Date(task.deadline))}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 align-middle">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${status.badge}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3.5 text-right align-middle">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingTask(task)}
                              className="rounded-md border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingTask(task)}
                              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 dark:hover:bg-red-950/50"
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
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
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
            <h3 className="text-base font-semibold">
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

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-zinc-500">
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
                  className="min-h-24 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/30"
                />
              ) : (
                <div
                  key={cell.day}
                  className="min-h-24 rounded-lg border border-zinc-200 p-2 text-xs dark:border-zinc-800"
                >
                  <div className="mb-1 font-semibold text-zinc-600 dark:text-zinc-400">
                    {cell.day}
                  </div>
                  <div className="space-y-1">
                    {cell.items.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setEditingTask(t)}
                        className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium transition ${
                          t.is_done
                            ? "bg-zinc-100 text-zinc-400 line-through dark:bg-zinc-800"
                            : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-200"
                        }`}
                        title={`${t.title} (${dateFmt.format(new Date(t.deadline))})`}
                      >
                        {t.title}
                      </button>
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH TUGAS (CREATE) */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tambah Tugas Baru"
      >
        <form action={handleCreate} className="grid gap-3.5">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Judul Tugas *
            </label>
            <input
              name="title"
              required
              placeholder="Contoh: Makalah Metopen Bab 1"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Mata Kuliah
            </label>
            <input
              name="course"
              placeholder="Contoh: Metodologi Penelitian"
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Tanggal & Jam Deadline *
            </label>
            <DatePicker name="deadline" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
              Catatan Tambahan
            </label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Detail pengumpulan, link referensi, atau anggota kelompok..."
              className={inputClass}
            />
          </div>

          <div className="mt-2 flex justify-end gap-2">
            <CancelButton onClick={() => setCreateOpen(false)} />
            <SubmitButton pendingText="Menyimpan...">Simpan Tugas</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* MODAL EDIT TUGAS (UPDATE) */}
      <Modal
        open={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title="Edit Tugas"
      >
        {editingTask && (
          <form key={editingTask.id} action={handleUpdate} className="grid gap-3.5">
            <input type="hidden" name="id" value={editingTask.id} />

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Judul Tugas *
              </label>
              <input
                name="title"
                required
                defaultValue={editingTask.title}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Mata Kuliah
              </label>
              <input
                name="course"
                defaultValue={editingTask.course}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Tanggal & Jam Deadline *
              </label>
              <DatePicker name="deadline" defaultValue={editingTask.deadline} />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400">
                Catatan Tambahan
              </label>
              <textarea
                name="notes"
                rows={3}
                defaultValue={editingTask.notes}
                className={inputClass}
              />
            </div>

            <div className="mt-2 flex justify-end gap-2">
              <CancelButton onClick={() => setEditingTask(null)} />
              <SubmitButton pendingText="Memperbarui...">
                Simpan Perubahan
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
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Apakah kamu yakin ingin menghapus tugas{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                &ldquo;{deletingTask.title}&rdquo;
              </span>
              ? Tindakan ini tidak dapat dibatalkan.
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

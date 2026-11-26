"use client";

import { useEffect, useRef, useState } from "react";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const WEEKDAYS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const pad = (n: number) => String(n).padStart(2, "0");

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

const displayFmt = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/**
 * Pemilih tanggal berbentuk kalender + jam.
 * Mengirim nilai ke form sebagai ISO string (UTC) lewat input bernama `name`.
 */
export function DatePicker({ name, defaultValue }: { name: string; defaultValue?: string }) {
  const [today] = useState(() => new Date());
  const [initial] = useState(() => (defaultValue ? new Date(defaultValue) : null));

  const [selected, setSelected] = useState<Date | null>(initial);
  const [time, setTime] = useState(
    initial ? `${pad(initial.getHours())}:${pad(initial.getMinutes())}` : "23:59",
  );
  const [view, setView] = useState(() => {
    const base = initial ?? new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    // Escape menutup kalender saja, tidak ikut menutup modal di belakangnya.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const [hh, mm] = time.split(":").map(Number);
  const iso =
    selected && !Number.isNaN(hh) && !Number.isNaN(mm)
      ? new Date(selected.getFullYear(), selected.getMonth(), selected.getDate(), hh, mm).toISOString()
      : "";

  const year = view.getFullYear();
  const month = view.getMonth();
  const leading = (view.getDay() + 6) % 7; // minggu dimulai Senin
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  function pick(date: Date) {
    setSelected(date);
    setView(new Date(date.getFullYear(), date.getMonth(), 1));
  }

  function quick(offsetDays: number) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offsetDays);
    pick(d);
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm transition hover:border-indigo-400 dark:border-zinc-700"
      >
        <span className={selected ? "" : "text-zinc-400"}>
          {selected ? `${displayFmt.format(selected)} · ${time}` : "Pilih tanggal & jam deadline"}
        </span>
        <span aria-hidden="true">📅</span>
      </button>

      {/* Input bernama: menyimpan nilai & memicu validasi "required" bawaan browser */}
      <input
        name={name}
        value={iso}
        onChange={() => {}}
        required
        tabIndex={-1}
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/2 h-0 w-0 opacity-0"
      />

      {open && (
        <div
          role="dialog"
          aria-label="Kalender"
          className="animate-fade-in absolute left-0 z-50 mt-2 w-full min-w-72 rounded-xl border border-zinc-200 bg-white p-3 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              aria-label="Bulan sebelumnya"
              className="rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ‹
            </button>
            <span className="text-sm font-semibold">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              aria-label="Bulan berikutnya"
              className="rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 font-medium">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`blank-${i}`} />;
              const isSelected = selected ? sameDay(date, selected) : false;
              const isToday = sameDay(date, today);
              return (
                <button
                  key={date.getDate()}
                  type="button"
                  onClick={() => pick(date)}
                  aria-pressed={isSelected}
                  className={`h-8 rounded-md text-sm transition ${
                    isSelected
                      ? "bg-indigo-600 font-semibold text-white"
                      : isToday
                        ? "border border-indigo-400 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  }`}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              ["Hari ini", 0],
              ["Besok", 1],
              ["+1 minggu", 7],
            ].map(([label, days]) => (
              <button
                key={label}
                type="button"
                onClick={() => quick(days as number)}
                className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-zinc-200 pt-3 dark:border-zinc-700">
            <label htmlFor={`${name}-time`} className="text-xs text-zinc-500">
              Jam
            </label>
            <input
              id={`${name}-time`}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-md border border-zinc-300 bg-transparent px-2 py-1 text-sm dark:border-zinc-700"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-md bg-indigo-600 px-3 py-1 text-xs font-medium text-white hover:bg-indigo-700"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

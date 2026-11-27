"use client";

import { useEffect, useRef, useState } from "react";
import { CalendarIcon } from "@/components/icons";

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
  const [initial] = useState(() => {
    if (!defaultValue) return null;
    const d = new Date(defaultValue);
    return Number.isNaN(d.getTime()) ? null : d;
  });

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

  const timeMatch = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time);
  const parsedDate =
    selected && timeMatch
      ? new Date(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
          Number(timeMatch[1]),
          Number(timeMatch[2]),
        )
      : null;
  const iso =
    parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : "";

  const year = view.getFullYear();
  const month = view.getMonth();
  const leading = (view.getDay() + 6) % 7;
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
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-left text-sm transition hover:border-[#2563eb]"
      >
        <span className={selected ? "text-[#181b20]" : "text-slate-400"}>
          {selected
            ? `${displayFmt.format(selected)} · ${time || "--:--"}`
            : "Pilih tanggal & jam deadline"}
        </span>
        <CalendarIcon className="h-4 w-4 shrink-0 text-[#2563eb]" />
      </button>

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
          className="animate-fade-in absolute left-0 z-50 mt-2 w-full min-w-72 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xl shadow-slate-900/10"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setView(new Date(year, month - 1, 1))}
              aria-label="Bulan sebelumnya"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
            >
              ‹
            </button>
            <span className="font-display text-sm font-bold text-[#181b20]">
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={() => setView(new Date(year, month + 1, 1))}
              aria-label="Bulan berikutnya"
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-slate-100"
            >
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
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
                  className={`h-8 rounded-lg text-sm transition ${
                    isSelected
                      ? "bg-[#2563eb] font-semibold text-white"
                      : isToday
                        ? "bg-[#f2fcd4] font-semibold text-[#181b20] ring-1 ring-[#a3e635] hover:bg-[#e5f9b0]"
                        : "text-slate-700 hover:bg-slate-100"
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
                className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-[#2563eb] hover:bg-[#eaf1ff] hover:text-[#2563eb]"
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3">
            <label htmlFor={`${name}-time`} className="text-xs font-medium text-slate-500">
              Jam
            </label>
            <input
              id={`${name}-time`}
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-sm text-[#181b20] outline-none focus:border-[#2563eb]"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="ml-auto rounded-full bg-[#bff227] px-3.5 py-1 text-xs font-semibold text-[#181b20] transition hover:bg-[#b1e519]"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

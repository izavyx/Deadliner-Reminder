"use client";

import { useEffect } from "react";
import { useFormStatus } from "react-dom";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-[#181b20] placeholder:text-slate-400 outline-none transition focus:border-[#2563eb] focus:ring-3 focus:ring-[#2563eb]/15";

export const btnPrimary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60";

export const btnLime =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#bff227] px-5 py-2 text-sm font-semibold text-[#181b20] transition hover:bg-[#b1e519] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60";

export const btnDanger =
  "inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60";

export function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Tombol submit yang otomatis menampilkan spinner selama form action berjalan. */
export function SubmitButton({
  children,
  pendingText,
  disabled = false,
  className = btnPrimary,
}: {
  children: React.ReactNode;
  pendingText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;
  return (
    <button type="submit" disabled={isDisabled} aria-busy={pending} className={className}>
      {pending && <Spinner />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}

/** Tombol batal yang ikut nonaktif saat form sedang diproses. */
export function CancelButton({ onClick }: { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button type="button" onClick={onClick} disabled={pending} className={btnSecondary}>
      Batal
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  maxWidthClass = "max-w-md",
  disableEscape = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  maxWidthClass?: string;
  disableEscape?: boolean;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open || disableEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose, disableEscape]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="animate-fade-in fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/35 p-4 backdrop-blur-[2px] sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`animate-modal-in my-8 w-full ${maxWidthClass} rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl shadow-slate-900/10`}
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-lg font-bold tracking-tight text-[#181b20]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup dialog"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm text-slate-500 transition hover:bg-[#bff227] hover:text-[#181b20]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

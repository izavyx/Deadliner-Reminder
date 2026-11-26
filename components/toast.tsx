"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

export type ToastType = "success" | "error" | "info";
type ToastItem = { id: number; type: ToastType; message: string };
type ToastFn = (type: ToastType, message: string) => void;

const ToastContext = createContext<ToastFn | null>(null);

export function useToast(): ToastFn {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast harus dipakai di dalam <ToastProvider>");
  return ctx;
}

const STYLES: Record<ToastType, { box: string; icon: string; symbol: string }> = {
  success: {
    box: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
    icon: "bg-emerald-500",
    symbol: "✓",
  },
  error: {
    box: "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950 dark:text-red-100",
    icon: "bg-red-500",
    symbol: "!",
  },
  info: {
    box: "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-100",
    icon: "bg-indigo-500",
    symbol: "i",
  },
};

// Pesan "flash" yang dikirim server lewat cookie singkat (mis. setelah login/logout redirect).
const FLASH: Record<string, [ToastType, string]> = {
  login: ["success", "Berhasil masuk. Selamat datang!"],
  register: ["success", "Akun berhasil dibuat. Selamat datang!"],
  logout: ["info", "Kamu sudah keluar."],
};

function FlashToast() {
  const toast = useToast();
  const pathname = usePathname();

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )flash=([^;]*)/);
    if (!match) return;
    document.cookie = "flash=; Max-Age=0; path=/";
    const entry = FLASH[match[1]];
    if (entry) toast(entry[0], entry[1]);
  }, [pathname, toast]);

  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (type, message) => {
      const id = ++nextId.current;
      setToasts((list) => [...list.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), 4500);
    },
    [dismiss],
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <FlashToast />
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2"
      >
        {toasts.map((t) => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              role={t.type === "error" ? "alert" : "status"}
              className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg ${s.box}`}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${s.icon}`}
              >
                {s.symbol}
              </span>
              <p className="flex-1 text-sm">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Tutup notifikasi"
                className="text-sm opacity-60 hover:opacity-100"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

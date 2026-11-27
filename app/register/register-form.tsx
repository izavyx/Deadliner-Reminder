"use client";

import { useActionState, useEffect } from "react";
import { register, type RegisterState } from "./actions";
import { SubmitButton, inputClass } from "@/components/ui";
import { useToast } from "@/components/toast";

export function RegisterForm() {
  const toast = useToast();
  const [state, formAction] = useActionState<RegisterState, FormData>(register, {});

  useEffect(() => {
    if (state.error) toast("error", state.error);
  }, [state, toast]);

  return (
    <form action={formAction} className="mt-6 grid gap-3.5">
      <div>
        <label
          htmlFor="reg-name"
          className="mb-1 block text-xs font-semibold text-slate-600"
        >
          Nama Lengkap
        </label>
        <input
          id="reg-name"
          name="name"
          required
          autoComplete="name"
          placeholder="Nama panggilan atau lengkap"
          defaultValue={state.name}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="reg-email"
          className="mb-1 block text-xs font-semibold text-slate-600"
        >
          Alamat Email
        </label>
        <input
          id="reg-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="nama@mahasiswa.ac.id"
          defaultValue={state.email}
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="reg-password"
          className="mb-1 block text-xs font-semibold text-slate-600"
        >
          Password
        </label>
        <input
          id="reg-password"
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Minimal 6 karakter"
          className={inputClass}
        />
      </div>

      <div>
        <label
          htmlFor="reg-confirm"
          className="mb-1 block text-xs font-semibold text-slate-600"
        >
          Konfirmasi Password
        </label>
        <input
          id="reg-confirm"
          name="confirm"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          placeholder="Ulangi password"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton
        pendingText="Membuat akun..."
        className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#bff227] px-5 py-2.5 text-sm font-bold text-[#181b20] transition hover:bg-[#b1e519] disabled:opacity-60"
      >
        Daftar Sekarang
      </SubmitButton>
    </form>
  );
}

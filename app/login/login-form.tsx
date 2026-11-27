"use client";

import { useActionState, useEffect } from "react";
import { login, type LoginState } from "./actions";
import { SubmitButton, inputClass } from "@/components/ui";
import { useToast } from "@/components/toast";

export function LoginForm() {
  const toast = useToast();
  const [state, formAction] = useActionState<LoginState, FormData>(login, {});

  useEffect(() => {
    if (state.error) toast("error", state.error);
  }, [state, toast]);

  return (
    <form action={formAction} className="mt-6 grid gap-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-1.5 block text-xs font-semibold text-slate-600"
        >
          Alamat Email
        </label>
        <input
          id="login-email"
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
          htmlFor="login-password"
          className="mb-1.5 block text-xs font-semibold text-slate-600"
        >
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="Masukkan password"
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText="Memproses..." className="mt-1 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-60">
        Masuk ke Ruang Tugas
      </SubmitButton>
    </form>
  );
}

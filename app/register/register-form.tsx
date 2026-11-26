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
    <form action={formAction} className="mt-6 grid gap-3">
      <input
        name="name"
        required
        autoComplete="name"
        placeholder="Nama lengkap"
        defaultValue={state.name}
        className={inputClass}
      />
      <input
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="Email"
        defaultValue={state.email}
        className={inputClass}
      />
      <input
        name="password"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        placeholder="Password (min. 6 karakter)"
        className={inputClass}
      />
      <input
        name="confirm"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        placeholder="Ulangi password"
        className={inputClass}
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Membuat akun...">Daftar</SubmitButton>
    </form>
  );
}

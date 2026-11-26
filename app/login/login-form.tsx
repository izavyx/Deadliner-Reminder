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
    <form action={formAction} className="mt-6 grid gap-3">
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
        autoComplete="current-password"
        placeholder="Password"
        className={inputClass}
      />
      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <SubmitButton pendingText="Memproses...">Masuk</SubmitButton>
    </form>
  );
}

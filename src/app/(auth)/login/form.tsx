"use client";
import { useActionState } from "react";
import { login } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm() {
  const [state, action] = useActionState(login, undefined);
  return (
    <form action={action} className="mt-6 space-y-4">
      <Field label="Email или телефон">
        <Input name="login" required autoComplete="username" placeholder="you@mail.ru или +7…" />
      </Field>
      <Field label="Пароль">
        <Input name="password" type="password" required autoComplete="current-password" />
      </Field>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      <SubmitButton className="w-full" pendingText="Входим…">Войти</SubmitButton>
    </form>
  );
}

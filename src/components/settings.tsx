"use client";
import { useActionState } from "react";
import { changePassword } from "@/app/actions/auth";
import { Field, Input } from "./ui";
import { SubmitButton } from "./submit-button";

export function PasswordForm() {
  const [state, action] = useActionState(changePassword, undefined);
  return (
    <form action={action} className="space-y-3">
      <Field label="Текущий пароль"><Input name="current" type="password" required /></Field>
      <Field label="Новый пароль"><Input name="next" type="password" required minLength={6} /></Field>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
      {state?.ok && <p className="text-sm text-emerald-600">{state.ok}</p>}
      <SubmitButton variant="secondary">Сменить пароль</SubmitButton>
    </form>
  );
}

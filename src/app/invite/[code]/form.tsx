"use client";
import { useActionState, useState } from "react";
import { acceptInvite } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import clsx from "clsx";

export function InviteForm({ code, phone }: { code: string; phone: string }) {
  const [state, action] = useActionState(acceptInvite, undefined);
  const [mode, setMode] = useState<"new" | "login">("new");
  return (
    <div className="mt-6">
      <div className="mb-4 inline-flex gap-1 rounded-xl bg-slate-100 p-1">
        {(["new", "login"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)}
            className={clsx("rounded-lg px-3 py-1.5 text-sm font-medium", mode === m ? "bg-white shadow-sm" : "text-slate-500")}>
            {m === "new" ? "Я впервые" : "У меня есть аккаунт"}
          </button>
        ))}
      </div>
      <form action={action} className="space-y-4">
        <input type="hidden" name="code" value={code} />
        <input type="hidden" name="mode" value={mode} />
        {mode === "new" && <Field label="Ваше имя"><Input name="name" required placeholder="Мария" /></Field>}
        <Field label="Телефон"><Input name="phone" type="tel" required defaultValue={phone} placeholder="+7…" /></Field>
        {mode === "new" && (
          <Field label="Кем вы приходитесь ребёнку" hint="Необязательно">
            <Input name="relation" placeholder="Мама" />
          </Field>
        )}
        <Field label={mode === "new" ? "Придумайте пароль" : "Пароль"}>
          <Input name="password" type="password" required minLength={6} />
        </Field>
        {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
        <SubmitButton className="w-full">Продолжить</SubmitButton>
      </form>
    </div>
  );
}

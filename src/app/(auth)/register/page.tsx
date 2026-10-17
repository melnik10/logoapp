"use client";
import Link from "next/link";
import { useActionState } from "react";
import { registerTherapist } from "@/app/actions/auth";
import { Field, Input } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default function RegisterPage() {
  const [state, action] = useActionState(registerTherapist, undefined);
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-violet-100/50 sm:p-8">
      <h1 className="text-2xl font-semibold">Регистрация логопеда</h1>
      <p className="mt-1 text-sm text-slate-500">Родители попадают в приложение по приглашению от вас.</p>
      <form action={action} className="mt-6 space-y-4">
        <Field label="Как вас зовут"><Input name="name" required placeholder="Анна Иванова" /></Field>
        <Field label="Email"><Input name="email" type="email" required /></Field>
        <Field label="Телефон" hint="Необязательно"><Input name="phone" type="tel" placeholder="+7…" /></Field>
        <Field label="Пароль"><Input name="password" type="password" required minLength={6} /></Field>
        {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
        <SubmitButton className="w-full" pendingText="Создаём кабинет…">Создать кабинет</SubmitButton>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Уже есть аккаунт? <Link href="/login" className="font-medium text-violet-700 hover:underline">Войти</Link>
      </p>
    </div>
  );
}

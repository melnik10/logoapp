import Link from "next/link";
import { LoginForm } from "./form";

export default function LoginPage() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-violet-100/50 sm:p-8">
      <h1 className="text-2xl font-semibold">Вход</h1>
      <p className="mt-1 text-sm text-slate-500">Логопеды входят по email, родители — по телефону.</p>
      <LoginForm />
      <p className="mt-6 text-center text-sm text-slate-500">
        Вы логопед и ещё не с нами?{" "}
        <Link href="/register" className="font-medium text-violet-700 hover:underline">Зарегистрироваться</Link>
      </p>
      {process.env.NODE_ENV !== "production" && (
        <div className="mt-6 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          Демо: логопед <b>logoped@demo.ru</b>, родитель <b>+79990000001</b>, админ <b>admin@demo.ru</b>. Пароль у всех <b>demo123</b>.
        </div>
      )}
    </div>
  );
}

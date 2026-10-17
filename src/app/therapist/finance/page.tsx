import Link from "next/link";
import { startOfMonth } from "date-fns";
import { Archive } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { archiveTariff, saveTariff } from "@/app/actions/therapist";
import { subInclude, subscriptionSummary } from "@/lib/billing";
import { fmtDate, fmtMoney, fullName } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/labels";
import { Card, CardTitle, Field, Input, PageHeader, Stat } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function FinancePage() {
  const user = await requireUser("THERAPIST");
  const [tariffs, subs, payments, monthSum] = await Promise.all([
    db.tariff.findMany({ where: { therapistId: user.id, archived: false }, orderBy: { lessonsCount: "asc" } }),
    db.subscription.findMany({ where: { therapistId: user.id, closed: false }, include: { ...subInclude, student: true } }),
    db.payment.findMany({ where: { therapistId: user.id }, include: { student: true }, orderBy: { paidAt: "desc" }, take: 30 }),
    db.payment.aggregate({ where: { therapistId: user.id, paidAt: { gte: startOfMonth(new Date()) } }, _sum: { amount: true } }),
  ]);
  const rows = subs.map((s) => ({ s, sum: subscriptionSummary(s) }));
  const debtors = rows.filter((r) => r.sum.debt > 0);
  const totalDebt = debtors.reduce((a, r) => a + r.sum.debt, 0);

  return (
    <>
      <PageHeader title="Финансы" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Stat label="Оплачено в этом месяце" value={fmtMoney(monthSum._sum.amount ?? 0)} tone="emerald" />
        <Stat label="Долги" value={fmtMoney(totalDebt)} tone="rose" hint={`${debtors.length} учеников`} />
        <Stat label="Активных абонементов" value={rows.filter((r) => r.sum.active).length} tone="violet" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitle>Долги</CardTitle>
            {debtors.length ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {debtors.map(({ s, sum }) => (
                  <li key={s.id}>
                    <Link href={`/therapist/students/${s.studentId}?tab=finance`} className="flex justify-between py-2.5 hover:text-violet-700">
                      <span>{fullName(s.student)} · {s.name}</span>
                      <b className="text-rose-600">{fmtMoney(sum.debt)}</b>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Долгов нет 🎉</p>}
          </Card>
          <Card>
            <CardTitle>Последние платежи</CardTitle>
            {payments.length ? (
              <ul className="divide-y divide-slate-100 text-sm">
                {payments.map((p) => (
                  <li key={p.id} className="flex justify-between gap-2 py-2.5">
                    <span>{fullName(p.student)} <span className="text-slate-400">· {fmtDate(p.paidAt)} · {paymentMethodLabel[p.method]}</span></span>
                    <b>{fmtMoney(p.amount)}</b>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-500">Платежей пока нет.</p>}
          </Card>
        </div>
        <Card className="h-fit">
          <CardTitle>Тарифы</CardTitle>
          <ul className="mb-4 space-y-2">
            {tariffs.map((t) => (
              <li key={t.id} className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.lessonsCount} зан. · {fmtMoney(t.price)}{t.validDays && ` · ${t.validDays} дн.`}</p>
                </div>
                <form action={archiveTariff}>
                  <input type="hidden" name="id" value={t.id} />
                  <button className="text-slate-400 hover:text-slate-700" aria-label="В архив"><Archive size={16} /></button>
                </form>
              </li>
            ))}
          </ul>
          <form action={saveTariff} className="space-y-3 border-t border-slate-100 pt-4">
            <p className="text-sm font-medium">Новый тариф</p>
            <Field label="Название"><Input name="name" required placeholder="Абонемент на 8 занятий" /></Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Занятий"><Input name="lessonsCount" type="number" min={1} required defaultValue={8} /></Field>
              <Field label="Цена, ₽"><Input name="price" type="number" min={0} required /></Field>
            </div>
            <Field label="Действует, дней" hint="Необязательно"><Input name="validDays" type="number" min={1} /></Field>
            <SubmitButton className="w-full">Добавить тариф</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}

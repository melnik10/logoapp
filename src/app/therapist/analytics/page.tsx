import { endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtMoney, fullName } from "@/lib/format";
import { BarChart } from "@/components/bar-chart";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui";

export default async function AnalyticsPage() {
  const user = await requireUser("THERAPIST");
  const since = startOfMonth(subMonths(new Date(), 5));
  const [lessons, payments, homeworks, students] = await Promise.all([
    db.lesson.findMany({ where: { therapistId: user.id, startsAt: { gte: since, lte: new Date() } }, select: { startsAt: true, status: true, studentId: true } }),
    db.payment.findMany({ where: { therapistId: user.id, paidAt: { gte: since } }, select: { paidAt: true, amount: true } }),
    db.homework.findMany({ where: { therapistId: user.id, createdAt: { gte: since } }, select: { status: true, studentId: true } }),
    db.student.findMany({ where: { therapistId: user.id, status: "ACTIVE" }, include: { sounds: true } }),
  ]);
  const months = Array.from({ length: 6 }, (_, i) => startOfMonth(subMonths(new Date(), 5 - i)));
  const inMonth = (d: Date, m: Date) => d >= m && d <= endOfMonth(m);
  const label = (m: Date) => format(m, "LLL", { locale: ru });

  const done = lessons.filter((l) => l.status === "DONE");
  const held = lessons.filter((l) => l.status !== "CANCELED" && l.status !== "PLANNED");
  const attendance = held.length ? Math.round((done.length / held.length) * 100) : 0;
  const hwDone = homeworks.filter((h) => h.status !== "ASSIGNED").length;
  const hwRate = homeworks.length ? Math.round((hwDone / homeworks.length) * 100) : 0;
  const soundsInSpeech = students.flatMap((s) => s.sounds).filter((s) => s.stage === "SPEECH").length;

  return (
    <>
      <PageHeader title="Аналитика" subtitle="За последние 6 месяцев" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Проведено занятий" value={done.length} tone="violet" />
        <Stat label="Посещаемость" value={`${attendance}%`} hint="проведено / (проведено + пропуски)" tone="emerald" />
        <Stat label="Домашки выполнены" value={`${hwRate}%`} hint={`${hwDone} из ${homeworks.length}`} tone="sky" />
        <Stat label="Звуков введено в речь" value={soundsInSpeech} tone="amber" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle>Проведённые занятия</CardTitle>
          <BarChart data={months.map((m) => ({ label: label(m), value: done.filter((l) => inMonth(l.startsAt, m)).length }))} />
        </Card>
        <Card>
          <CardTitle>Доход</CardTitle>
          <BarChart color="bg-emerald-500" format={(n) => `${Math.round(n / 1000)}к`} data={months.map((m) => ({ label: label(m), value: payments.filter((p) => inMonth(p.paidAt, m)).reduce((a, p) => a + p.amount, 0) }))} />
        </Card>
        <Card className="lg:col-span-2">
          <CardTitle>По ученикам</CardTitle>
          <div className="-mx-4 overflow-x-auto sm:mx-0">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="text-left text-xs uppercase text-slate-500">
                <tr><th className="px-4 py-2 sm:px-0">Ученик</th><th>Занятий</th><th>Пропусков</th><th>Домашки</th><th>Звуки в речи</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((s) => {
                  const ls = lessons.filter((l) => l.studentId === s.id);
                  const hs = homeworks.filter((h) => h.studentId === s.id);
                  return (
                    <tr key={s.id}>
                      <td className="px-4 py-2.5 font-medium sm:px-0">{fullName(s)}</td>
                      <td>{ls.filter((l) => l.status === "DONE").length}</td>
                      <td>{ls.filter((l) => l.status === "MISSED").length}</td>
                      <td>{hs.filter((h) => h.status !== "ASSIGNED").length} / {hs.length}</td>
                      <td>{s.sounds.filter((x) => x.stage === "SPEECH").map((x) => x.sound).join(", ") || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">Суммы в рублях; доход считается по дате оплаты. {fmtMoney(payments.reduce((a, p) => a + p.amount, 0))} за период.</p>
        </Card>
      </div>
    </>
  );
}

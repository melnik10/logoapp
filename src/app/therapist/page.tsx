import Link from "next/link";
import { endOfDay, endOfMonth, startOfDay, startOfMonth } from "date-fns";
import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { CHARGEABLE, subInclude, subscriptionSummary } from "@/lib/billing";
import { fmtDay, fmtMoney, fullName, fmtAgo } from "@/lib/format";
import { ButtonLink, Card, CardTitle, Empty, PageHeader, Stat, Avatar } from "@/components/ui";
import { LessonRow } from "@/components/lesson-row";

export default async function TherapistHome() {
  const user = await requireUser("THERAPIST");
  const now = new Date();
  const [today, toReview, subs, monthDone, monthPaid, studentsCount] = await Promise.all([
    db.lesson.findMany({
      where: { therapistId: user.id, startsAt: { gte: startOfDay(now), lte: endOfDay(now) } },
      include: { student: true },
      orderBy: { startsAt: "asc" },
    }),
    db.homework.findMany({
      where: { therapistId: user.id, status: "SUBMITTED" },
      include: { student: true, submissions: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "asc" },
    }),
    db.subscription.findMany({ where: { therapistId: user.id, closed: false }, include: { ...subInclude, student: true } }),
    db.lesson.count({ where: { therapistId: user.id, status: { in: CHARGEABLE }, startsAt: { gte: startOfMonth(now), lte: endOfMonth(now) } } }),
    db.payment.aggregate({ where: { therapistId: user.id, paidAt: { gte: startOfMonth(now), lte: endOfMonth(now) } }, _sum: { amount: true } }),
    db.student.count({ where: { therapistId: user.id, status: "ACTIVE" } }),
  ]);

  const running = subs.map((s) => ({ s, sum: subscriptionSummary(s) }));
  const ending = running.filter(({ sum }) => sum.left <= 1 || sum.expired);
  const debt = running.reduce((a, { sum }) => a + sum.debt, 0);

  return (
    <>
      <PageHeader
        title={`Здравствуйте, ${user.name.split(" ")[0]}!`}
        subtitle={fmtDay(now)}
        action={<ButtonLink href="/therapist/schedule/new"><Plus size={16} /> Занятие</ButtonLink>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Занятий сегодня" value={today.length} />
        <Stat label="Учеников" value={studentsCount} tone="sky" />
        <Stat label="Проведено за месяц" value={monthDone} tone="emerald" />
        <Stat label="Оплачено за месяц" value={fmtMoney(monthPaid._sum.amount ?? 0)} hint={debt ? `Долги: ${fmtMoney(debt)}` : undefined} tone="amber" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle action={<Link href="/therapist/schedule" className="text-sm text-violet-700">Всё расписание</Link>}>Сегодня</CardTitle>
          {today.length ? (
            <div className="space-y-2">{today.map((l) => <LessonRow key={l.id} lesson={l} href={`/therapist/lessons/${l.id}`} />)}</div>
          ) : (
            <Empty title="Сегодня занятий нет" text="Можно отдохнуть или подготовить материалы." />
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle>Ждут проверки</CardTitle>
            {toReview.length ? (
              <ul className="space-y-2">
                {toReview.map((h) => (
                  <li key={h.id}>
                    <Link href={`/therapist/homework/${h.id}`} className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50">
                      <Avatar name={fullName(h.student)} color={h.student.color} size={34} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{h.title}</p>
                        <p className="text-xs text-slate-500">{h.student.firstName} · {h.submissions[0] ? fmtAgo(h.submissions[0].createdAt) : ""}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Все домашки проверены.</p>
            )}
          </Card>

          <Card>
            <CardTitle>Абонементы на исходе</CardTitle>
            {ending.length ? (
              <ul className="space-y-2 text-sm">
                {ending.map(({ s, sum }) => (
                  <li key={s.id}>
                    <Link href={`/therapist/students/${s.studentId}?tab=finance`} className="flex justify-between rounded-lg p-2 hover:bg-slate-50">
                      <span>{fullName(s.student)}</span>
                      <span className={sum.left === 0 || sum.expired ? "text-rose-600" : "text-amber-600"}>
                        {sum.expired ? "истёк" : `осталось ${sum.left}`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">У всех есть занятия в запасе.</p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

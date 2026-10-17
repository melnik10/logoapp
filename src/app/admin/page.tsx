import { startOfMonth } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDate } from "@/lib/format";
import { Card, CardTitle, PageHeader, Stat } from "@/components/ui";

export default async function AdminHome() {
  await requireUser("ADMIN");
  const month = startOfMonth(new Date());
  const [therapists, parents, students, lessonsMonth, hwMonth, recent] = await Promise.all([
    db.user.count({ where: { role: "THERAPIST" } }),
    db.user.count({ where: { role: "PARENT" } }),
    db.student.count(),
    db.lesson.count({ where: { status: "DONE", startsAt: { gte: month } } }),
    db.homework.count({ where: { createdAt: { gte: month } } }),
    db.user.findMany({ where: { role: "THERAPIST" }, orderBy: { createdAt: "desc" }, take: 8, include: { _count: { select: { students: true } } } }),
  ]);
  return (
    <>
      <PageHeader title="Сводка платформы" />
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Логопедов" value={therapists} />
        <Stat label="Родителей" value={parents} tone="sky" />
        <Stat label="Учеников" value={students} tone="emerald" />
        <Stat label="Занятий за месяц" value={lessonsMonth} tone="amber" />
        <Stat label="Домашек за месяц" value={hwMonth} tone="rose" />
      </div>
      <Card>
        <CardTitle>Новые логопеды</CardTitle>
        <ul className="divide-y divide-slate-100 text-sm">
          {recent.map((u) => (
            <li key={u.id} className="flex justify-between py-2.5"><span>{u.name} <span className="text-slate-400">· {u.email}</span></span><span className="text-slate-500">{u._count.students} учен. · {fmtDate(u.createdAt)}</span></li>
          ))}
        </ul>
      </Card>
    </>
  );
}

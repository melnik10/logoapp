import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDay, fmtTime, fullName } from "@/lib/format";
import { lessonFormatLabel, lessonStatusLabel } from "@/lib/labels";
import { Badge, Card, CardTitle, Empty, PageHeader } from "@/components/ui";
import { statusTone } from "@/components/lesson-row";

export default async function ParentSchedule() {
  const user = await requireUser("PARENT");
  const lessons = await db.lesson.findMany({
    where: { student: { parents: { some: { parentId: user.id } } } },
    include: { student: true },
    orderBy: { startsAt: "desc" },
    take: 80,
  });
  const now = new Date();
  const upcoming = lessons.filter((l) => l.startsAt >= now).reverse();
  const past = lessons.filter((l) => l.startsAt < now);
  const many = new Set(lessons.map((l) => l.studentId)).size > 1;
  const Row = ({ l }: { l: (typeof lessons)[number] }) => (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-medium first-letter:uppercase">{fmtDay(l.startsAt)}, {fmtTime(l.startsAt)}</p>
          <p className="text-xs text-slate-500">{many && `${fullName(l.student)} · `}{l.durationMin} мин · {lessonFormatLabel[l.format]}</p>
        </div>
        <Badge className={statusTone[l.status]}>{lessonStatusLabel[l.status]}</Badge>
      </div>
      {l.noteForParent && <p className="mt-2 rounded-xl bg-violet-50 p-3 text-sm text-violet-900">💬 {l.noteForParent}</p>}
    </li>
  );
  return (
    <>
      <PageHeader title="Занятия" />
      {!lessons.length ? <Empty title="Занятий пока нет" /> : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card><CardTitle>Предстоящие</CardTitle>{upcoming.length ? <ul className="divide-y divide-slate-100">{upcoming.slice(0, 12).map((l) => <Row key={l.id} l={l} />)}</ul> : <p className="text-sm text-slate-500">Нет запланированных.</p>}</Card>
          <Card><CardTitle>Прошедшие</CardTitle>{past.length ? <ul className="divide-y divide-slate-100">{past.map((l) => <Row key={l.id} l={l} />)}</ul> : <p className="text-sm text-slate-500">Ещё не было.</p>}</Card>
        </div>
      )}
    </>
  );
}

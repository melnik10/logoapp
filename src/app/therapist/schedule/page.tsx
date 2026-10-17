import Link from "next/link";
import clsx from "clsx";
import { addDays, addWeeks, endOfWeek, format, isSameDay, startOfWeek } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ButtonLink, PageHeader } from "@/components/ui";
import { statusTone } from "@/components/lesson-row";
import { fmtTime } from "@/lib/format";
import { lessonStatusLabel } from "@/lib/labels";

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const user = await requireUser("THERAPIST");
  const { date } = await searchParams;
  const base = date ? new Date(date) : new Date();
  const from = startOfWeek(base, { weekStartsOn: 1 });
  const to = endOfWeek(base, { weekStartsOn: 1 });
  const lessons = await db.lesson.findMany({
    where: { therapistId: user.id, startsAt: { gte: from, lte: to } },
    include: { student: true },
    orderBy: { startsAt: "asc" },
  });
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const ymd = (d: Date) => format(d, "yyyy-MM-dd");

  return (
    <>
      <PageHeader
        title="Расписание"
        subtitle={`${format(from, "d MMM", { locale: ru })} — ${format(to, "d MMM yyyy", { locale: ru })} · ${lessons.length} занятий`}
        action={
          <div className="flex items-center gap-2">
            <Link href={`?date=${ymd(addWeeks(from, -1))}`} className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50" aria-label="Предыдущая неделя"><ChevronLeft size={16} /></Link>
            <Link href="?" className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">Сегодня</Link>
            <Link href={`?date=${ymd(addWeeks(from, 1))}`} className="rounded-xl border border-slate-200 bg-white p-2.5 hover:bg-slate-50" aria-label="Следующая неделя"><ChevronRight size={16} /></Link>
            <ButtonLink href={`/therapist/schedule/new?date=${ymd(base)}`}><Plus size={16} /> Занятие</ButtonLink>
          </div>
        }
      />
      <div className="grid gap-3 lg:grid-cols-7">
        {days.map((d) => {
          const items = lessons.filter((l) => isSameDay(l.startsAt, d));
          const today = isSameDay(d, new Date());
          return (
            <div key={d.toISOString()} className={clsx("rounded-2xl border bg-white p-3 lg:min-h-64", today ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-200/80")}>
              <div className="mb-2 flex items-baseline justify-between">
                <p className={clsx("text-sm font-semibold capitalize", today ? "text-violet-700" : "text-slate-700")}>
                  {format(d, "EEEEEE, d", { locale: ru })}
                </p>
                <Link href={`/therapist/schedule/new?date=${ymd(d)}`} className="text-slate-400 hover:text-violet-600" aria-label="Добавить"><Plus size={16} /></Link>
              </div>
              <div className="space-y-2">
                {items.length ? items.map((l) => (
                  <Link key={l.id} href={`/therapist/lessons/${l.id}`} className={clsx("block rounded-xl border-l-4 bg-slate-50 px-3 py-2 transition hover:bg-violet-50", l.status === "CANCELED" && "opacity-50")} style={{ borderColor: l.student.color }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold">{fmtTime(l.startsAt)}</span>
                      <span className={clsx("rounded-full px-1.5 py-0.5 text-[10px] font-medium", statusTone[l.status])}>{lessonStatusLabel[l.status]}</span>
                    </div>
                    <p className="truncate text-sm text-slate-700">{l.student.firstName} {l.student.lastName}</p>
                  </Link>
                )) : <p className="py-2 text-xs text-slate-400">Свободно</p>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

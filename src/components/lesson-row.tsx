import Link from "next/link";
import clsx from "clsx";
import type { Lesson, Student } from "@prisma/client";
import { fmtTime, fullName } from "@/lib/format";
import { lessonFormatLabel, lessonStatusLabel } from "@/lib/labels";
import { Badge } from "./ui";

export const statusTone = {
  PLANNED: "bg-violet-100 text-violet-700",
  DONE: "bg-emerald-100 text-emerald-700",
  CANCELED: "bg-slate-100 text-slate-500",
  MISSED: "bg-rose-100 text-rose-700",
} as const;

export function LessonRow({ lesson, href, showStudent = true }: { lesson: Lesson & { student: Student }; href?: string; showStudent?: boolean }) {
  const body = (
    <div className={clsx("flex items-center gap-3 rounded-xl border border-slate-100 bg-white p-3 transition", href && "hover:border-violet-200 hover:bg-violet-50/40")}>
      <div className="w-1.5 self-stretch rounded-full" style={{ background: lesson.student.color }} />
      <div className="w-14 shrink-0">
        <p className="font-semibold text-slate-900">{fmtTime(lesson.startsAt)}</p>
        <p className="text-xs text-slate-400">{lesson.durationMin} мин</p>
      </div>
      <div className="min-w-0 flex-1">
        {showStudent && <p className="truncate font-medium text-slate-900">{fullName(lesson.student)}</p>}
        <p className="text-xs text-slate-500">{lessonFormatLabel[lesson.format]}</p>
      </div>
      <Badge className={statusTone[lesson.status]}>{lessonStatusLabel[lesson.status]}</Badge>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

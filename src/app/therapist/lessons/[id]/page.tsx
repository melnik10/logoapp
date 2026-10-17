import Link from "next/link";
import { format } from "date-fns";
import { notFound } from "next/navigation";
import { Check, Trash2, UserX, X } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteLesson, markLesson, updateLesson } from "@/app/actions/therapist";
import { fmtDay, fmtTime, fullName } from "@/lib/format";
import { lessonStatusLabel } from "@/lib/labels";
import { Avatar, Badge, Button, Card, CardTitle, Field, Input, PageHeader, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { statusTone } from "@/components/lesson-row";

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("THERAPIST");
  const { id } = await params;
  const lesson = await db.lesson.findFirst({ where: { id, therapistId: user.id }, include: { student: true, subscription: true } });
  if (!lesson) notFound();

  const mark = (status: string, label: string, Icon: typeof Check, variant: "success" | "secondary" | "danger") => (
    <form action={markLesson}>
      <input type="hidden" name="id" value={lesson.id} />
      <input type="hidden" name="status" value={status} />
      <Button variant={lesson.status === status ? variant : "secondary"} className="w-full"><Icon size={16} /> {label}</Button>
    </form>
  );

  return (
    <>
      <PageHeader title={`${fmtDay(lesson.startsAt)}, ${fmtTime(lesson.startsAt)}`} subtitle={<Badge className={statusTone[lesson.status]}>{lessonStatusLabel[lesson.status]}</Badge>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <Link href={`/therapist/students/${lesson.studentId}`} className="flex items-center gap-3">
              <Avatar name={fullName(lesson.student)} color={lesson.student.color} />
              <div>
                <p className="font-semibold">{fullName(lesson.student)}</p>
                <p className="text-sm text-slate-500">
                  {lesson.subscription ? `Списано из «${lesson.subscription.name}»` : lesson.status === "DONE" || lesson.status === "MISSED" ? "Без абонемента — разовая оплата" : "Открыть карточку"}
                </p>
              </div>
            </Link>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {mark("DONE", "Проведено", Check, "success")}
              {mark("MISSED", "Пропуск", UserX, "danger")}
              {mark("CANCELED", "Отмена", X, "secondary")}
            </div>
            <p className="mt-2 text-xs text-slate-500">Проведённые занятия и пропуски списываются из абонемента, отменённые — нет.</p>
          </Card>

          <Card>
            <CardTitle>Заметки и перенос</CardTitle>
            <form action={updateLesson} className="space-y-4">
              <input type="hidden" name="id" value={lesson.id} />
              <Field label="Заметка для себя"><Textarea name="note" defaultValue={lesson.note ?? ""} placeholder="Что делали, на что обратить внимание" /></Field>
              <Field label="Комментарий для родителя" hint="Родитель увидит его в приложении и получит уведомление">
                <Textarea name="noteForParent" defaultValue={lesson.noteForParent ?? ""} placeholder="Сегодня отлично получался звук Р в слогах…" />
              </Field>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field label="Дата"><Input type="date" name="date" defaultValue={format(lesson.startsAt, "yyyy-MM-dd")} /></Field>
                <Field label="Время"><Input type="time" name="time" defaultValue={format(lesson.startsAt, "HH:mm")} /></Field>
                <Field label="Минут"><Input type="number" name="durationMin" defaultValue={lesson.durationMin} /></Field>
                <Field label="Формат">
                  <Select name="format" defaultValue={lesson.format}><option value="OFFLINE">Очно</option><option value="ONLINE">Онлайн</option></Select>
                </Field>
              </div>
              <SubmitButton>Сохранить</SubmitButton>
            </form>
          </Card>
        </div>

        <Card className="h-fit">
          <CardTitle>Удалить</CardTitle>
          <form action={deleteLesson} className="space-y-3">
            <input type="hidden" name="id" value={lesson.id} />
            {lesson.seriesId && (
              <Select name="scope"><option value="one">Только это занятие</option><option value="future">Это и все следующие в серии</option></Select>
            )}
            <Button variant="danger" className="w-full"><Trash2 size={16} /> Удалить</Button>
          </form>
        </Card>
      </div>
    </>
  );
}

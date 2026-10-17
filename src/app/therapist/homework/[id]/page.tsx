import Link from "next/link";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { deleteHomework, reviewHomework } from "@/app/actions/therapist";
import { fmtDate, fmtDateTime, fullName } from "@/lib/format";
import { Avatar, Button, Card, CardTitle, Field, PageHeader, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { HwBadge } from "@/components/hw-badge";
import { Attachments } from "@/components/attachments";
import { HomeworkMaterials } from "@/components/homework-materials";

export default async function HomeworkDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("THERAPIST");
  const { id } = await params;
  const hw = await db.homework.findFirst({
    where: { id, therapistId: user.id },
    include: {
      student: true,
      materials: { include: { material: { include: { attachments: true } } } },
      submissions: { include: { author: true, attachments: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!hw) notFound();
  return (
    <>
      <PageHeader title={hw.title} subtitle={<span className="flex items-center gap-2"><HwBadge status={hw.status} /> выдано {fmtDate(hw.createdAt)}{hw.dueDate && `, срок ${fmtDate(hw.dueDate)}`}</span>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <Link href={`/therapist/students/${hw.studentId}?tab=homework`} className="mb-4 flex items-center gap-3">
              <Avatar name={fullName(hw.student)} color={hw.student.color} size={36} />
              <span className="font-medium">{fullName(hw.student)}</span>
            </Link>
            {hw.instructions && <p className="mb-4 whitespace-pre-wrap text-sm text-slate-700">{hw.instructions}</p>}
            <HomeworkMaterials materials={hw.materials.map((m) => m.material)} />
          </Card>
          <Card>
            <CardTitle>Ответы родителя</CardTitle>
            {hw.submissions.length ? (
              <div className="space-y-4">
                {hw.submissions.map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{s.author.name} · {fmtDateTime(s.createdAt)}</p>
                    {s.comment && <p className="mt-1 whitespace-pre-wrap text-sm">{s.comment}</p>}
                    <Attachments items={s.attachments} />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-slate-500">Родитель ещё не отправил выполнение.</p>}
          </Card>
        </div>
        <div className="space-y-5">
          <Card>
            <CardTitle>Оценка и отзыв</CardTitle>
            <form action={reviewHomework} className="space-y-3">
              <input type="hidden" name="id" value={hw.id} />
              <Field label="Оценка">
                <Select name="grade" defaultValue={hw.grade ?? 5}>
                  {[5, 4, 3, 2, 1].map((g) => <option key={g} value={g}>{"⭐".repeat(g)}</option>)}
                </Select>
              </Field>
              <Field label="Комментарий"><Textarea name="feedback" defaultValue={hw.feedback ?? ""} placeholder="Молодец! Звук Р в начале слова уже уверенный." /></Field>
              <SubmitButton className="w-full">{hw.status === "REVIEWED" ? "Обновить отзыв" : "Отметить проверенным"}</SubmitButton>
            </form>
          </Card>
          <form action={deleteHomework}>
            <input type="hidden" name="id" value={hw.id} />
            <Button variant="ghost" className="w-full text-rose-600"><Trash2 size={16} /> Удалить задание</Button>
          </form>
        </div>
      </div>
    </>
  );
}

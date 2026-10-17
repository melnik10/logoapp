import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { submitHomework } from "@/app/actions/common";
import { fmtDate, fmtDateTime } from "@/lib/format";
import { Card, CardTitle, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { HwBadge } from "@/components/hw-badge";
import { Attachments } from "@/components/attachments";
import { HomeworkMaterials } from "@/components/homework-materials";
import { AudioRecorder } from "@/components/audio-recorder";

export default async function ParentHomeworkDetail({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("PARENT");
  const { id } = await params;
  const hw = await db.homework.findFirst({
    where: { id, student: { parents: { some: { parentId: user.id } } } },
    include: {
      student: true,
      materials: { include: { material: { include: { attachments: true } } } },
      submissions: { include: { attachments: true, author: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!hw) notFound();
  return (
    <>
      <PageHeader title={hw.title} subtitle={<span className="flex flex-wrap items-center gap-2"><HwBadge status={hw.status} /> {hw.student.firstName}{hw.dueDate && ` · сделать до ${fmtDate(hw.dueDate)}`}</span>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardTitle>Задание</CardTitle>
            {hw.instructions && <p className="mb-4 whitespace-pre-wrap text-slate-700">{hw.instructions}</p>}
            <HomeworkMaterials materials={hw.materials.map((m) => m.material)} />
          </Card>
          {hw.status === "REVIEWED" && (
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardTitle>Отзыв логопеда {hw.grade && <span className="ml-1">{"⭐".repeat(hw.grade)}</span>}</CardTitle>
              <p className="whitespace-pre-wrap text-sm">{hw.feedback || "Задание проверено."}</p>
            </Card>
          )}
          {hw.submissions.length > 0 && (
            <Card>
              <CardTitle>Вы отправили</CardTitle>
              <div className="space-y-3">
                {hw.submissions.map((s) => (
                  <div key={s.id} className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">{fmtDateTime(s.createdAt)}</p>
                    {s.comment && <p className="mt-1 whitespace-pre-wrap text-sm">{s.comment}</p>}
                    <Attachments items={s.attachments} />
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
        <Card className="h-fit">
          <CardTitle>{hw.submissions.length ? "Отправить ещё" : "Отметить выполнение"}</CardTitle>
          <form action={submitHomework} className="space-y-3">
            <input type="hidden" name="homeworkId" value={hw.id} />
            <AudioRecorder />
            <Field label="Фото или видео"><Input type="file" name="files" accept="image/*,video/*,application/pdf" multiple /></Field>
            <Field label="Комментарий"><Textarea name="comment" placeholder="Занимались 3 раза, звук в словах получается лучше" /></Field>
            <SubmitButton className="w-full" pendingText="Отправляю…">Отправить логопеду</SubmitButton>
          </form>
        </Card>
      </div>
    </>
  );
}

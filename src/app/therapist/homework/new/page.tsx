import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createHomework } from "@/app/actions/therapist";
import { fullName } from "@/lib/format";
import { materialTypeLabel } from "@/lib/labels";
import { Card, Field, Input, PageHeader, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function NewHomeworkPage({ searchParams }: { searchParams: Promise<{ student?: string; material?: string }> }) {
  const user = await requireUser("THERAPIST");
  const { student, material } = await searchParams;
  const [students, materials] = await Promise.all([
    db.student.findMany({ where: { therapistId: user.id, status: "ACTIVE" }, orderBy: { firstName: "asc" } }),
    db.material.findMany({ where: { OR: [{ ownerId: user.id }, { ownerId: null }] }, orderBy: { createdAt: "desc" } }),
  ]);
  return (
    <>
      <PageHeader title="Выдать домашнее задание" subtitle="Можно выдать одно задание сразу нескольким ученикам" />
      <form action={createHomework} className="grid gap-5 lg:grid-cols-3">
        <Card className="space-y-4 lg:col-span-2">
          <Field label="Название" hint="Если оставить пустым, возьмём название первого материала"><Input name="title" placeholder="Автоматизация звука Р в словах" /></Field>
          <Field label="Что сделать"><Textarea name="instructions" placeholder="Повторять слова по карточкам 2 раза в день. Запишите аудио, как ребёнок называет картинки." /></Field>
          <Field label="Срок"><Input type="date" name="dueDate" /></Field>
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Материалы</p>
            <div className="max-h-80 space-y-1.5 overflow-y-auto rounded-xl border border-slate-200 p-2">
              {materials.length ? materials.map((m) => (
                <label key={m.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-slate-50">
                  <input type="checkbox" name="materialIds" value={m.id} defaultChecked={m.id === material} className="mt-1 h-4 w-4 accent-violet-600" />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{m.title}</span>
                    <span className="text-xs text-slate-500">{materialTypeLabel[m.type]}{m.tags.length ? ` · ${m.tags.join(", ")}` : ""}{!m.ownerId && " · общий"}</span>
                  </span>
                </label>
              )) : <p className="p-2 text-sm text-slate-500">В библиотеке пока нет материалов.</p>}
            </div>
          </div>
        </Card>
        <Card className="h-fit space-y-3">
          <p className="text-sm font-medium text-slate-700">Кому</p>
          <div className="space-y-1">
            {students.map((s) => (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-50">
                <input type="checkbox" name="studentIds" value={s.id} defaultChecked={s.id === student} className="h-4 w-4 accent-violet-600" />
                <span className="text-sm">{fullName(s)}</span>
              </label>
            ))}
          </div>
          <SubmitButton className="w-full">Выдать</SubmitButton>
        </Card>
      </form>
    </>
  );
}

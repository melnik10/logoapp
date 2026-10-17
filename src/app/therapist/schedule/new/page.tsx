import { format } from "date-fns";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { createLesson } from "@/app/actions/therapist";
import { fullName } from "@/lib/format";
import { ButtonLink, Card, Empty, Field, Input, PageHeader, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export default async function NewLessonPage({ searchParams }: { searchParams: Promise<{ date?: string; student?: string }> }) {
  const user = await requireUser("THERAPIST");
  const { date, student } = await searchParams;
  const students = await db.student.findMany({ where: { therapistId: user.id, status: "ACTIVE" }, orderBy: { firstName: "asc" } });
  if (!students.length)
    return <Empty title="Сначала добавьте ученика" action={<ButtonLink href="/therapist/students/new">Добавить ученика</ButtonLink>} />;

  return (
    <>
      <PageHeader title="Новое занятие" />
      <Card className="max-w-xl">
        <form action={createLesson} className="space-y-4">
          <Field label="Ученик">
            <Select name="studentId" defaultValue={student} required>
              {students.map((s) => <option key={s.id} value={s.id}>{fullName(s)}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Дата"><Input type="date" name="date" required defaultValue={date ?? format(new Date(), "yyyy-MM-dd")} /></Field>
            <Field label="Время"><Input type="time" name="time" required defaultValue="16:00" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Длительность, мин"><Input type="number" name="durationMin" defaultValue={45} min={10} step={5} /></Field>
            <Field label="Формат">
              <Select name="format"><option value="OFFLINE">Очно</option><option value="ONLINE">Онлайн</option></Select>
            </Field>
          </div>
          <label className="flex items-center gap-3 rounded-xl bg-violet-50 p-3 text-sm">
            <input type="checkbox" name="repeat" className="h-4 w-4 accent-violet-600" />
            <span className="flex-1">Повторять каждую неделю в это время</span>
            <Input type="number" name="weeks" defaultValue={12} min={2} max={52} className="w-20" aria-label="Сколько недель" />
            <span className="text-slate-500">нед.</span>
          </label>
          <SubmitButton>Сохранить</SubmitButton>
        </form>
      </Card>
    </>
  );
}

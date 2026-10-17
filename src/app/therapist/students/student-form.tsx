import { format } from "date-fns";
import type { Student } from "@prisma/client";
import { SOUNDS } from "@/lib/labels";
import { Field, Input, Select, Textarea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function StudentForm({ action, student }: { action: (f: FormData) => Promise<void>; student?: Student }) {
  return (
    <form action={action} className="space-y-4">
      {student && <input type="hidden" name="id" value={student.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Имя"><Input name="firstName" required defaultValue={student?.firstName} /></Field>
        <Field label="Фамилия"><Input name="lastName" defaultValue={student?.lastName ?? ""} /></Field>
      </div>
      <Field label="Дата рождения">
        <Input type="date" name="birthDate" defaultValue={student?.birthDate ? format(student.birthDate, "yyyy-MM-dd") : ""} />
      </Field>
      {!student && (
        <Field label="Звуки в работе" hint="Попадут в карту звуков на этапе «Постановка»">
          <div className="flex flex-wrap gap-2">
            {SOUNDS.map((s) => (
              <label key={s} className="cursor-pointer">
                <input type="checkbox" name="sounds" value={s} className="peer sr-only" />
                <span className="inline-block rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium peer-checked:border-violet-500 peer-checked:bg-violet-50 peer-checked:text-violet-700">{s}</span>
              </label>
            ))}
          </div>
        </Field>
      )}
      <Field label="Логопедическое заключение"><Textarea name="conclusion" defaultValue={student?.conclusion ?? ""} placeholder="ФФНР, дислалия…" /></Field>
      <Field label="Индивидуальная программа и цели" hint="Видит родитель"><Textarea name="program" defaultValue={student?.program ?? ""} /></Field>
      <Field label="Заметки" hint="Видите только вы"><Textarea name="notes" defaultValue={student?.notes ?? ""} /></Field>
      {student && (
        <Field label="Статус">
          <Select name="status" defaultValue={student.status}>
            <option value="ACTIVE">Занимается</option><option value="PAUSED">Пауза</option><option value="FINISHED">Выпущен</option>
          </Select>
        </Field>
      )}
      <SubmitButton>{student ? "Сохранить" : "Добавить ученика"}</SubmitButton>
    </form>
  );
}

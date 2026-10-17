import type { Template } from "@/lib/diagnostics";
import { saveDiagnostic } from "@/app/actions/common";
import { Field, Input, Select, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";

export function DiagnosticFormView({ tpl, studentId }: { tpl: Template; studentId: string }) {
  return (
    <form action={saveDiagnostic} className="space-y-4">
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="templateKey" value={tpl.key} />
      <div className={tpl.key === "sound-exam" ? "grid gap-3 sm:grid-cols-2 lg:grid-cols-3" : "space-y-4"}>
        {tpl.questions.map((q) => (
          <div key={q.key} className={q.type === "textarea" && tpl.key === "sound-exam" ? "sm:col-span-2 lg:col-span-3" : ""}>
            <Field label={q.label}>
              {q.type === "text" && <Input name={q.key} />}
              {q.type === "textarea" && <Textarea name={q.key} />}
              {q.type === "choice" && (
                <Select name={q.key} defaultValue="">
                  <option value="">—</option>
                  {q.options.map((o) => <option key={o}>{o}</option>)}
                </Select>
              )}
            </Field>
          </div>
        ))}
      </div>
      <SubmitButton>Сохранить</SubmitButton>
    </form>
  );
}

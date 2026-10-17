import { createMaterial } from "@/app/actions/therapist";
import { Field, Input, Select, Textarea } from "./ui";
import { SubmitButton } from "./submit-button";

export function MaterialForm() {
  return (
    <form action={createMaterial} className="space-y-4">
      <Field label="Название"><Input name="title" required placeholder="Карточки на звук Р в начале слова" /></Field>
      <Field label="Тип">
        <Select name="type" defaultValue="FILE">
          <option value="FILE">Файл (PDF, картинки, аудио)</option>
          <option value="LINK">Ссылка</option>
          <option value="VIDEO">Видео (ссылка на YouTube, VK, Rutube)</option>
          <option value="TEXT">Текст</option>
        </Select>
      </Field>
      <Field label="Описание"><Input name="description" placeholder="Коротко, для чего материал" /></Field>
      <Field label="Файлы" hint="До 50 МБ каждый"><Input type="file" name="files" multiple /></Field>
      <Field label="Ссылка"><Input name="url" type="url" placeholder="https://" /></Field>
      <Field label="Текст задания"><Textarea name="text" placeholder="Рак, рама, рыба, рука, ракета…" /></Field>
      <Field label="Теги" hint="Через запятую: звуки, темы, возраст"><Input name="tags" placeholder="Р, автоматизация, слова" /></Field>
      <SubmitButton pendingText="Загружаю…">Добавить в библиотеку</SubmitButton>
    </form>
  );
}

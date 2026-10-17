import { SOUNDS } from "./labels";

export type Question =
  | { key: string; label: string; type: "text" | "textarea" }
  | { key: string; label: string; type: "choice"; options: string[] };

export type Template = { key: string; title: string; description: string; filledBy: "PARENT" | "THERAPIST"; questions: Question[] };

export const TEMPLATES: Template[] = [
  {
    key: "parent-intake",
    title: "Анкета для родителей",
    description: "Заполняется перед первым занятием: развитие ребёнка и что беспокоит.",
    filledBy: "PARENT",
    questions: [
      { key: "complaint", label: "Что вас беспокоит в речи ребёнка?", type: "textarea" },
      { key: "pregnancy", label: "Как протекали беременность и роды?", type: "textarea" },
      { key: "firstWords", label: "Когда появились первые слова?", type: "text" },
      { key: "phrases", label: "Когда появилась фразовая речь?", type: "text" },
      { key: "specialists", label: "Наблюдается ли ребёнок у невролога, ЛОРа, других специалистов?", type: "textarea" },
      { key: "kindergarten", label: "Посещает ли детский сад или школу?", type: "choice", options: ["Детский сад", "Школа", "Нет"] },
      { key: "languages", label: "На каких языках говорят дома?", type: "text" },
      { key: "previous", label: "Занимались ли раньше с логопедом? Каких результатов достигли?", type: "textarea" },
      { key: "interests", label: "Что любит ребёнок? (игры, мультфильмы, герои — поможет сделать занятия интереснее)", type: "textarea" },
    ],
  },
  {
    key: "sound-exam",
    title: "Обследование звукопроизношения",
    description: "Состояние каждого звука на момент обследования.",
    filledBy: "THERAPIST",
    questions: [
      ...SOUNDS.map((s) => ({
        key: `sound_${s}`,
        label: `Звук «${s}»`,
        type: "choice" as const,
        options: ["Норма", "Искажение", "Замена", "Отсутствует", "Не проверяли"],
      })),
      { key: "articulation", label: "Строение и подвижность артикуляционного аппарата", type: "textarea" },
      { key: "phonemic", label: "Фонематический слух", type: "textarea" },
      { key: "conclusion", label: "Выводы", type: "textarea" },
    ],
  },
];

export const templateByKey = (key: string) => TEMPLATES.find((t) => t.key === key);

import type {
  HomeworkStatus,
  LessonFormat,
  LessonStatus,
  MaterialType,
  PaymentMethod,
  SoundStage,
  StudentStatus,
} from "@prisma/client";

export const lessonStatusLabel: Record<LessonStatus, string> = {
  PLANNED: "Запланировано",
  DONE: "Проведено",
  CANCELED: "Отменено",
  MISSED: "Пропуск",
};

export const lessonFormatLabel: Record<LessonFormat, string> = {
  OFFLINE: "Очно",
  ONLINE: "Онлайн",
};

export const studentStatusLabel: Record<StudentStatus, string> = {
  ACTIVE: "Занимается",
  PAUSED: "Пауза",
  FINISHED: "Выпущен",
};

export const homeworkStatusLabel: Record<HomeworkStatus, string> = {
  ASSIGNED: "Выдано",
  SUBMITTED: "Сдано, ждёт проверки",
  REVIEWED: "Проверено",
};

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CASH: "Наличные",
  TRANSFER: "Перевод",
  CARD: "Карта",
  ONLINE: "Онлайн",
};

export const materialTypeLabel: Record<MaterialType, string> = {
  FILE: "Файл",
  LINK: "Ссылка",
  VIDEO: "Видео",
  TEXT: "Текст",
};

export const soundStages: SoundStage[] = [
  "NOT_STARTED",
  "STAGING",
  "SYLLABLES",
  "WORDS",
  "PHRASES",
  "DIFFERENTIATION",
  "SPEECH",
];

export const soundStageLabel: Record<SoundStage, string> = {
  NOT_STARTED: "Не в работе",
  STAGING: "Постановка",
  SYLLABLES: "Слоги",
  WORDS: "Слова",
  PHRASES: "Фразы",
  DIFFERENTIATION: "Дифференциация",
  SPEECH: "В речи",
};

export const soundStageColor: Record<SoundStage, string> = {
  NOT_STARTED: "bg-slate-100 text-slate-500",
  STAGING: "bg-rose-100 text-rose-700",
  SYLLABLES: "bg-orange-100 text-orange-700",
  WORDS: "bg-amber-100 text-amber-700",
  PHRASES: "bg-lime-100 text-lime-700",
  DIFFERENTIATION: "bg-sky-100 text-sky-700",
  SPEECH: "bg-emerald-100 text-emerald-700",
};

// Звуки, с которыми чаще всего работает логопед
export const SOUNDS = ["С", "Сь", "З", "Зь", "Ц", "Ш", "Ж", "Ч", "Щ", "Л", "Ль", "Р", "Рь", "К", "Г", "Х"];

export const weekdayLabel = ["", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

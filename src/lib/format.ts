import { format, formatDistanceToNowStrict, differenceInYears, differenceInMonths } from "date-fns";
import { ru } from "date-fns/locale";

export const fmtDate = (d: Date | string) => format(new Date(d), "d MMMM yyyy", { locale: ru });
export const fmtDateShort = (d: Date | string) => format(new Date(d), "d MMM", { locale: ru });
export const fmtDay = (d: Date | string) => format(new Date(d), "EEEE, d MMMM", { locale: ru });
export const fmtTime = (d: Date | string) => format(new Date(d), "HH:mm");
export const fmtDateTime = (d: Date | string) => format(new Date(d), "d MMM, HH:mm", { locale: ru });
export const fmtAgo = (d: Date | string) =>
  formatDistanceToNowStrict(new Date(d), { locale: ru, addSuffix: true });
export const fmtMoney = (n: number) => `${n.toLocaleString("ru-RU")} ₽`;

export function fmtAge(birth: Date | null | undefined) {
  if (!birth) return null;
  const y = differenceInYears(new Date(), birth);
  const m = differenceInMonths(new Date(), birth) % 12;
  const yw = y % 10 === 1 && y % 100 !== 11 ? "год" : [2, 3, 4].includes(y % 10) && ![12, 13, 14].includes(y % 100) ? "года" : "лет";
  return m ? `${y} ${yw} ${m} мес.` : `${y} ${yw}`;
}

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const fullName = (s: { firstName: string; lastName?: string | null }) =>
  [s.firstName, s.lastName].filter(Boolean).join(" ");

import type { LessonStatus, Prisma } from "@prisma/client";
import { db } from "./db";

// Списываются из абонемента проведённые занятия и пропуски без предупреждения
export const CHARGEABLE: LessonStatus[] = ["DONE", "MISSED"];

export type SubWithUsage = Prisma.SubscriptionGetPayload<{ include: { payments: true; _count: { select: { lessons: true } } } }>;

export function subscriptionSummary(s: { lessonsTotal: number; price: number; payments: { amount: number }[]; _count: { lessons: number }; expiresAt: Date | null; closed: boolean }) {
  const used = s._count.lessons;
  const left = Math.max(0, s.lessonsTotal - used);
  const paid = s.payments.reduce((a, p) => a + p.amount, 0);
  const expired = !!s.expiresAt && s.expiresAt < new Date();
  return { used, left, paid, debt: Math.max(0, s.price - paid), active: !s.closed && !expired && left > 0, expired };
}

export const subInclude = {
  payments: true,
  _count: { select: { lessons: { where: { status: { in: CHARGEABLE } } } } },
} satisfies Prisma.SubscriptionInclude;

// Подбираем абонемент для списания: самый старый активный с остатком
async function pickSubscription(studentId: string) {
  const subs = await db.subscription.findMany({
    where: { studentId, closed: false },
    include: subInclude,
    orderBy: { startDate: "asc" },
  });
  return subs.find((s) => subscriptionSummary(s).active) ?? null;
}

export async function setLessonStatus(lessonId: string, status: LessonStatus) {
  const lesson = await db.lesson.findUniqueOrThrow({ where: { id: lessonId } });
  let subscriptionId = lesson.subscriptionId;
  if (CHARGEABLE.includes(status) && !subscriptionId) {
    subscriptionId = (await pickSubscription(lesson.studentId))?.id ?? null;
  }
  if (!CHARGEABLE.includes(status)) subscriptionId = null;
  const updated = await db.lesson.update({ where: { id: lessonId }, data: { status, subscriptionId } });

  if (subscriptionId) {
    const sub = await db.subscription.findUniqueOrThrow({ where: { id: subscriptionId }, include: subInclude });
    const { left } = subscriptionSummary(sub);
    if (left <= 1) {
      const parents = await db.studentParent.findMany({ where: { studentId: lesson.studentId } });
      await db.notification.createMany({
        data: [
          ...parents.map((p) => ({
            userId: p.parentId,
            title: left === 0 ? "Абонемент закончился" : "В абонементе осталось 1 занятие",
            body: `«${sub.name}». Самое время продлить.`,
            link: "/parent/payments",
          })),
          {
            userId: lesson.therapistId,
            title: left === 0 ? "Абонемент закончился" : "Абонемент на исходе",
            body: `«${sub.name}»`,
            link: `/therapist/students/${lesson.studentId}?tab=finance`,
          },
        ],
      });
    }
  }
  return updated;
}

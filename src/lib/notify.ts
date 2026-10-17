import { db } from "./db";

export async function notifyParents(studentId: string, title: string, body: string | null, link: string) {
  const parents = await db.studentParent.findMany({ where: { studentId } });
  if (!parents.length) return;
  await db.notification.createMany({ data: parents.map((p) => ({ userId: p.parentId, title, body, link })) });
}

export async function notifyUser(userId: string, title: string, body: string | null, link: string) {
  await db.notification.create({ data: { userId, title, body, link } });
}

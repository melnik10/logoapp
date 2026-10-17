import { db } from "./db";

export async function parentChildren(parentId: string) {
  const links = await db.studentParent.findMany({ where: { parentId }, include: { student: { include: { therapist: true } } } });
  return links.map((l) => l.student);
}

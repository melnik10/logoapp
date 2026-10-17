"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { templateByKey } from "@/lib/diagnostics";
import { notifyUser } from "@/lib/notify";
import { saveUpload } from "@/lib/files";

async function canAccessStudent(userId: string, role: string, studentId: string) {
  if (role === "THERAPIST") return !!(await db.student.findFirst({ where: { id: studentId, therapistId: userId } }));
  if (role === "PARENT") return !!(await db.studentParent.findUnique({ where: { studentId_parentId: { studentId, parentId: userId } } }));
  return false;
}

export async function saveDiagnostic(form: FormData) {
  const user = await requireUser();
  const studentId = String(form.get("studentId"));
  const tpl = templateByKey(String(form.get("templateKey")));
  if (!tpl || !(await canAccessStudent(user.id, user.role, studentId))) redirect("/");
  const answers = Object.fromEntries(tpl.questions.map((q) => [q.key, String(form.get(q.key) ?? "")]));
  await db.diagnosticForm.create({ data: { studentId, templateKey: tpl.key, answers, filledById: user.id } });
  if (user.role === "PARENT") {
    const s = await db.student.findUniqueOrThrow({ where: { id: studentId } });
    await notifyUser(s.therapistId, `Заполнена «${tpl.title}»`, s.firstName, `/therapist/students/${studentId}?tab=diagnostics`);
    redirect("/parent");
  }
  redirect(`/therapist/students/${studentId}?tab=diagnostics`);
}

// Родитель сдаёт домашку: комментарий, фото, аудиозапись
export async function submitHomework(form: FormData) {
  const user = await requireUser("PARENT");
  const hw = await db.homework.findUnique({ where: { id: String(form.get("homeworkId")) }, include: { student: true } });
  if (!hw || !(await canAccessStudent(user.id, user.role, hw.studentId))) redirect("/parent");
  const submission = await db.homeworkSubmission.create({
    data: { homeworkId: hw.id, authorId: user.id, comment: (String(form.get("comment") ?? "").trim() || null) },
  });
  for (const f of [...form.getAll("files"), form.get("audio")]) {
    if (f instanceof File && f.size) {
      const saved = await saveUpload(f);
      if (saved) await db.attachment.create({ data: { ...saved, uploadedById: user.id, submissionId: submission.id } });
    }
  }
  await db.homework.update({ where: { id: hw.id }, data: { status: "SUBMITTED" } });
  await notifyUser(hw.therapistId, "Сдано домашнее задание", `${hw.student.firstName}: ${hw.title}`, `/therapist/homework/${hw.id}`);
  revalidatePath(`/parent/homework/${hw.id}`);
}

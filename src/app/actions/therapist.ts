"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { addDays, addWeeks, setHours, setMinutes, startOfDay } from "date-fns";
import type { LessonFormat, LessonStatus, MaterialType, PaymentMethod, SoundStage, StudentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireOwnStudent, requireUser } from "@/lib/auth";
import { setLessonStatus } from "@/lib/billing";
import { notifyParents } from "@/lib/notify";
import { saveUpload } from "@/lib/files";
import { normalizePhone } from "@/lib/phone";

const str = (f: FormData, k: string) => {
  const v = f.get(k);
  return typeof v === "string" && v.trim() ? v.trim() : null;
};
const num = (f: FormData, k: string) => {
  const v = str(f, k);
  return v ? Number(v) : null;
};
const date = (f: FormData, k: string) => {
  const v = str(f, k);
  return v ? new Date(v) : null;
};

const COLORS = ["#7c3aed", "#db2777", "#0891b2", "#059669", "#d97706", "#4f46e5", "#e11d48", "#0d9488"];

// ---------- Ученики ----------

export async function createStudent(form: FormData) {
  const user = await requireUser("THERAPIST");
  const count = await db.student.count({ where: { therapistId: user.id } });
  const student = await db.student.create({
    data: {
      therapistId: user.id,
      firstName: str(form, "firstName") ?? "Без имени",
      lastName: str(form, "lastName"),
      birthDate: date(form, "birthDate"),
      conclusion: str(form, "conclusion"),
      program: str(form, "program"),
      notes: str(form, "notes"),
      color: COLORS[count % COLORS.length],
    },
  });
  const sounds = form.getAll("sounds").map(String);
  if (sounds.length) {
    await db.soundProgress.createMany({ data: sounds.map((sound) => ({ studentId: student.id, sound, stage: "STAGING" as SoundStage })) });
  }
  redirect(`/therapist/students/${student.id}`);
}

export async function updateStudent(form: FormData) {
  const id = String(form.get("id"));
  await requireOwnStudent(id);
  await db.student.update({
    where: { id },
    data: {
      firstName: str(form, "firstName") ?? "Без имени",
      lastName: str(form, "lastName"),
      birthDate: date(form, "birthDate"),
      conclusion: str(form, "conclusion"),
      program: str(form, "program"),
      notes: str(form, "notes"),
      status: (str(form, "status") ?? "ACTIVE") as StudentStatus,
    },
  });
  redirect(`/therapist/students/${id}`);
}

export async function createInvite(form: FormData) {
  const studentId = String(form.get("studentId"));
  const { user } = await requireOwnStudent(studentId);
  const phone = str(form, "phone");
  await db.invite.create({
    data: { studentId, therapistId: user.id, code: randomBytes(6).toString("base64url"), phone: phone ? normalizePhone(phone) : null },
  });
  revalidatePath(`/therapist/students/${studentId}`);
}

export async function removeParent(form: FormData) {
  const studentId = String(form.get("studentId"));
  await requireOwnStudent(studentId);
  await db.studentParent.delete({ where: { studentId_parentId: { studentId, parentId: String(form.get("parentId")) } } });
  revalidatePath(`/therapist/students/${studentId}`);
}

// ---------- Карта звуков ----------

export async function setSoundStage(form: FormData) {
  const studentId = String(form.get("studentId"));
  await requireOwnStudent(studentId);
  const sound = String(form.get("sound"));
  const stage = String(form.get("stage")) as SoundStage;
  await db.soundProgress.upsert({
    where: { studentId_sound: { studentId, sound } },
    create: { studentId, sound, stage },
    update: { stage },
  });
  await db.soundProgressLog.create({ data: { studentId, sound, stage } });
  if (stage === "SPEECH") await notifyParents(studentId, `Звук «${sound}» введён в речь! 🎉`, "Отличная работа дома и на занятиях.", "/parent/progress");
  revalidatePath(`/therapist/students/${studentId}`);
}

// ---------- Расписание ----------

function atTime(day: Date, time: string) {
  const [h, m] = time.split(":").map(Number);
  return setMinutes(setHours(startOfDay(day), h), m);
}

export async function createLesson(form: FormData) {
  const user = await requireUser("THERAPIST");
  const studentId = String(form.get("studentId"));
  await requireOwnStudent(studentId);
  const day = new Date(String(form.get("date")));
  const time = String(form.get("time"));
  const durationMin = num(form, "durationMin") ?? 45;
  const format = (str(form, "format") ?? "OFFLINE") as LessonFormat;
  const repeat = form.get("repeat") === "on";

  if (repeat) {
    const weeks = num(form, "weeks") ?? 12;
    const weekday = ((day.getDay() + 6) % 7) + 1;
    const series = await db.lessonSeries.create({
      data: { studentId, weekday, time, durationMin, startDate: day, endDate: addWeeks(day, weeks - 1) },
    });
    await db.lesson.createMany({
      data: Array.from({ length: weeks }, (_, i) => ({
        therapistId: user.id, studentId, seriesId: series.id, startsAt: atTime(addWeeks(day, i), time), durationMin, format,
      })),
    });
  } else {
    await db.lesson.create({ data: { therapistId: user.id, studentId, startsAt: atTime(day, time), durationMin, format } });
  }
  await notifyParents(studentId, repeat ? "Новое расписание занятий" : "Назначено занятие", null, "/parent/schedule");
  redirect(`/therapist/schedule?date=${String(form.get("date"))}`);
}

async function ownLesson(id: string) {
  const user = await requireUser("THERAPIST");
  const lesson = await db.lesson.findFirst({ where: { id, therapistId: user.id } });
  if (!lesson) redirect("/therapist/schedule");
  return lesson;
}

export async function markLesson(form: FormData) {
  const lesson = await ownLesson(String(form.get("id")));
  const status = String(form.get("status")) as LessonStatus;
  await setLessonStatus(lesson.id, status);
  if (status === "CANCELED") await notifyParents(lesson.studentId, "Занятие отменено", null, "/parent/schedule");
  revalidatePath("/therapist", "layout");
}

export async function updateLesson(form: FormData) {
  const lesson = await ownLesson(String(form.get("id")));
  const d = str(form, "date");
  const t = str(form, "time");
  const startsAt = d && t ? atTime(new Date(d), t) : lesson.startsAt;
  await db.lesson.update({
    where: { id: lesson.id },
    data: {
      startsAt,
      durationMin: num(form, "durationMin") ?? lesson.durationMin,
      format: (str(form, "format") ?? lesson.format) as LessonFormat,
      note: str(form, "note"),
      noteForParent: str(form, "noteForParent"),
    },
  });
  if (startsAt.getTime() !== lesson.startsAt.getTime())
    await notifyParents(lesson.studentId, "Занятие перенесено", null, "/parent/schedule");
  if (str(form, "noteForParent") && str(form, "noteForParent") !== lesson.noteForParent)
    await notifyParents(lesson.studentId, "Логопед оставил комментарий к занятию", str(form, "noteForParent"), "/parent/schedule");
  revalidatePath("/therapist", "layout");
}

export async function deleteLesson(form: FormData) {
  const lesson = await ownLesson(String(form.get("id")));
  const scope = String(form.get("scope") ?? "one");
  if (scope === "future" && lesson.seriesId) {
    await db.lesson.deleteMany({ where: { seriesId: lesson.seriesId, startsAt: { gte: lesson.startsAt }, status: "PLANNED" } });
  } else {
    await db.lesson.delete({ where: { id: lesson.id } });
  }
  redirect("/therapist/schedule");
}

// ---------- Абонементы и оплаты ----------

export async function saveTariff(form: FormData) {
  const user = await requireUser("THERAPIST");
  const id = str(form, "id");
  const data = {
    name: str(form, "name") ?? "Абонемент",
    lessonsCount: num(form, "lessonsCount") ?? 1,
    price: num(form, "price") ?? 0,
    validDays: num(form, "validDays"),
  };
  if (id) await db.tariff.updateMany({ where: { id, therapistId: user.id }, data });
  else await db.tariff.create({ data: { ...data, therapistId: user.id } });
  revalidatePath("/therapist/finance");
}

export async function archiveTariff(form: FormData) {
  const user = await requireUser("THERAPIST");
  await db.tariff.updateMany({ where: { id: String(form.get("id")), therapistId: user.id }, data: { archived: true } });
  revalidatePath("/therapist/finance");
}

export async function assignSubscription(form: FormData) {
  const studentId = String(form.get("studentId"));
  const { user } = await requireOwnStudent(studentId);
  const tariff = await db.tariff.findFirst({ where: { id: String(form.get("tariffId")), therapistId: user.id } });
  if (!tariff) return;
  const start = date(form, "startDate") ?? new Date();
  const sub = await db.subscription.create({
    data: {
      therapistId: user.id, studentId, tariffId: tariff.id, name: tariff.name, lessonsTotal: tariff.lessonsCount,
      price: tariff.price, startDate: start, expiresAt: tariff.validDays ? addDays(start, tariff.validDays) : null,
    },
  });
  const paid = num(form, "paid");
  if (paid) {
    await db.payment.create({
      data: { therapistId: user.id, studentId, subscriptionId: sub.id, amount: paid, method: (str(form, "method") ?? "TRANSFER") as PaymentMethod },
    });
  }
  await notifyParents(studentId, "Оформлен абонемент", `«${tariff.name}», ${tariff.lessonsCount} занятий`, "/parent/payments");
  revalidatePath(`/therapist/students/${studentId}`);
  revalidatePath("/therapist/finance");
}

export async function addPayment(form: FormData) {
  const studentId = String(form.get("studentId"));
  const { user } = await requireOwnStudent(studentId);
  await db.payment.create({
    data: {
      therapistId: user.id, studentId, subscriptionId: str(form, "subscriptionId"), amount: num(form, "amount") ?? 0,
      method: (str(form, "method") ?? "TRANSFER") as PaymentMethod, comment: str(form, "comment"),
      paidAt: date(form, "paidAt") ?? new Date(),
    },
  });
  revalidatePath(`/therapist/students/${studentId}`);
  revalidatePath("/therapist/finance");
}

export async function closeSubscription(form: FormData) {
  const user = await requireUser("THERAPIST");
  const sub = await db.subscription.findFirst({ where: { id: String(form.get("id")), therapistId: user.id } });
  if (!sub) return;
  await db.subscription.update({ where: { id: sub.id }, data: { closed: true } });
  revalidatePath(`/therapist/students/${sub.studentId}`);
}

// ---------- Материалы ----------

export async function createMaterial(form: FormData) {
  const user = await requireUser();
  if (user.role === "PARENT") redirect("/parent");
  const type = (str(form, "type") ?? "TEXT") as MaterialType;
  const tags = (str(form, "tags") ?? "").split(",").map((t) => t.trim()).filter(Boolean);
  const material = await db.material.create({
    data: {
      ownerId: user.role === "ADMIN" ? null : user.id,
      title: str(form, "title") ?? "Без названия",
      description: str(form, "description"),
      type, url: str(form, "url"), text: str(form, "text"), tags,
    },
  });
  for (const f of form.getAll("files")) {
    if (f instanceof File && f.size) {
      const saved = await saveUpload(f);
      if (saved) await db.attachment.create({ data: { ...saved, uploadedById: user.id, materialId: material.id } });
    }
  }
  redirect(user.role === "ADMIN" ? "/admin/materials" : "/therapist/materials");
}

export async function deleteMaterial(form: FormData) {
  const user = await requireUser();
  const where = user.role === "ADMIN" ? { id: String(form.get("id")) } : { id: String(form.get("id")), ownerId: user.id };
  await db.material.deleteMany({ where });
  revalidatePath("/therapist/materials");
  revalidatePath("/admin/materials");
}

// ---------- Домашние задания ----------

export async function createHomework(form: FormData) {
  const user = await requireUser("THERAPIST");
  const studentIds = form.getAll("studentIds").map(String);
  const materialIds = form.getAll("materialIds").map(String);
  const students = await db.student.findMany({ where: { id: { in: studentIds }, therapistId: user.id } });
  const materials = await db.material.findMany({ where: { id: { in: materialIds }, OR: [{ ownerId: user.id }, { ownerId: null }] } });
  const title = str(form, "title") ?? materials[0]?.title ?? "Домашнее задание";
  for (const s of students) {
    await db.homework.create({
      data: {
        therapistId: user.id, studentId: s.id, title, instructions: str(form, "instructions"), dueDate: date(form, "dueDate"),
        materials: { create: materials.map((m) => ({ materialId: m.id })) },
      },
    });
    await notifyParents(s.id, "Новое домашнее задание", title, "/parent/homework");
  }
  redirect(students.length === 1 ? `/therapist/students/${students[0].id}?tab=homework` : "/therapist/homework");
}

export async function reviewHomework(form: FormData) {
  const user = await requireUser("THERAPIST");
  const hw = await db.homework.findFirst({ where: { id: String(form.get("id")), therapistId: user.id } });
  if (!hw) return;
  await db.homework.update({
    where: { id: hw.id },
    data: { status: "REVIEWED", feedback: str(form, "feedback"), grade: num(form, "grade") },
  });
  await notifyParents(hw.studentId, "Логопед проверил домашнее задание", str(form, "feedback") ?? hw.title, `/parent/homework/${hw.id}`);
  revalidatePath(`/therapist/homework/${hw.id}`);
}

export async function deleteHomework(form: FormData) {
  const user = await requireUser("THERAPIST");
  await db.homework.deleteMany({ where: { id: String(form.get("id")), therapistId: user.id } });
  redirect("/therapist/homework");
}

// ---------- Профиль ----------

export async function updateProfile(form: FormData) {
  const user = await requireUser();
  await db.user.update({
    where: { id: user.id },
    data: { name: str(form, "name") ?? user.name, about: str(form, "about"), paymentDetails: str(form, "paymentDetails") },
  });
  revalidatePath("/", "layout");
}

export async function markNotificationsRead() {
  const user = await requireUser();
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}


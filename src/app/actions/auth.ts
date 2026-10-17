"use server";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { createSession, destroySession, homeFor, requireUser } from "@/lib/auth";

export type FormState = { error?: string; ok?: string } | undefined;


export async function login(_: FormState, form: FormData): Promise<FormState> {
  const loginValue = String(form.get("login") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const where = loginValue.includes("@") ? { email: loginValue.toLowerCase() } : { phone: normalizePhone(loginValue) };
  const user = await db.user.findFirst({ where });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return { error: "Неверный логин или пароль" };
  if (user.blocked) return { error: "Аккаунт заблокирован. Напишите в поддержку." };
  await createSession(user.id);
  redirect(homeFor(user.role));
}

const registerSchema = z.object({
  name: z.string().min(2, "Укажите имя"),
  email: z.string().email("Проверьте email"),
  phone: z.string().optional(),
  password: z.string().min(6, "Пароль не короче 6 символов"),
});

export async function registerTherapist(_: FormState, form: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, email, phone, password } = parsed.data;
  const p = phone ? normalizePhone(phone) : null;
  const exists = await db.user.findFirst({ where: { OR: [{ email: email.toLowerCase() }, ...(p ? [{ phone: p }] : [])] } });
  if (exists) return { error: "Пользователь с таким email или телефоном уже есть" };
  const user = await db.user.create({
    data: { name, email: email.toLowerCase(), phone: p, passwordHash: await bcrypt.hash(password, 10), role: "THERAPIST" },
  });
  await createSession(user.id);
  redirect("/therapist");
}

export async function acceptInvite(_: FormState, form: FormData): Promise<FormState> {
  const code = String(form.get("code"));
  const invite = await db.invite.findUnique({ where: { code } });
  if (!invite || invite.usedAt) return { error: "Приглашение уже использовано или не найдено" };

  const mode = String(form.get("mode"));
  let userId: string;
  if (mode === "login") {
    const res = await db.user.findFirst({ where: { phone: normalizePhone(String(form.get("phone") ?? "")) } });
    if (!res || !(await bcrypt.compare(String(form.get("password") ?? ""), res.passwordHash)))
      return { error: "Неверный телефон или пароль" };
    if (res.role !== "PARENT") return { error: "Этот аккаунт не родительский" };
    userId = res.id;
  } else {
    const name = String(form.get("name") ?? "").trim();
    const phone = normalizePhone(String(form.get("phone") ?? ""));
    const password = String(form.get("password") ?? "");
    if (name.length < 2) return { error: "Укажите имя" };
    if (phone.length < 11) return { error: "Проверьте номер телефона" };
    if (password.length < 6) return { error: "Пароль не короче 6 символов" };
    if (await db.user.findUnique({ where: { phone } }))
      return { error: "Этот телефон уже зарегистрирован — войдите во вкладке «У меня есть аккаунт»" };
    const u = await db.user.create({ data: { name, phone, passwordHash: await bcrypt.hash(password, 10), role: "PARENT" } });
    userId = u.id;
  }
  await db.$transaction([
    db.studentParent.upsert({
      where: { studentId_parentId: { studentId: invite.studentId, parentId: userId } },
      create: { studentId: invite.studentId, parentId: userId, relation: String(form.get("relation") ?? "") || null },
      update: {},
    }),
    db.invite.update({ where: { id: invite.id }, data: { usedAt: new Date() } }),
  ]);
  await createSession(userId);
  redirect("/parent");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const user = await requireUser();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!(await bcrypt.compare(current, user.passwordHash))) return { error: "Текущий пароль неверный" };
  if (next.length < 6) return { error: "Новый пароль не короче 6 символов" };
  await db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(next, 10) } });
  return { ok: "Пароль изменён" };
}

export async function deleteAccount(form: FormData) {
  const user = await requireUser();
  if (String(form.get("confirm")) !== "УДАЛИТЬ") return;
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  redirect("/login");
}

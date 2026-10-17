import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@prisma/client";
import { db } from "./db";

const COOKIE = "logoapp_session";
const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET ?? "dev-secret");

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    const user = await db.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.blocked) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireUser(role?: Role) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (role && user.role !== role) redirect(homeFor(user.role));
  return user;
}

export function homeFor(role: Role) {
  if (role === "THERAPIST") return "/therapist";
  if (role === "PARENT") return "/parent";
  return "/admin";
}

// Родитель видит только своих детей
export async function requireParentChild(studentId: string) {
  const user = await requireUser("PARENT");
  const link = await db.studentParent.findUnique({
    where: { studentId_parentId: { studentId, parentId: user.id } },
  });
  if (!link) redirect("/parent");
  return user;
}

// Логопед видит только своих учеников
export async function requireOwnStudent(studentId: string) {
  const user = await requireUser("THERAPIST");
  const student = await db.student.findFirst({ where: { id: studentId, therapistId: user.id } });
  if (!student) redirect("/therapist/students");
  return { user, student };
}

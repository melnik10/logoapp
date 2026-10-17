"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function toggleBlock(form: FormData) {
  const admin = await requireUser("ADMIN");
  const id = String(form.get("id"));
  if (id === admin.id) return;
  const u = await db.user.findUniqueOrThrow({ where: { id } });
  await db.user.update({ where: { id }, data: { blocked: !u.blocked } });
  revalidatePath("/admin/users");
}

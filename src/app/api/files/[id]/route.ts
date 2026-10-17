import { readFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { UPLOAD_DIR } from "@/lib/files";

// Отдаём файл только тем, кому он положен
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  const a = await db.attachment.findUnique({
    where: { id },
    include: { material: true, submission: { include: { homework: { include: { student: { include: { parents: true } } } } } } },
  });
  if (!a) return new Response("Not found", { status: 404 });

  let allowed = user.role === "ADMIN" || a.uploadedById === user.id;
  if (!allowed && a.material) {
    allowed =
      a.material.ownerId === null ||
      a.material.ownerId === user.id ||
      (user.role === "PARENT" &&
        !!(await db.homeworkMaterial.findFirst({
          where: { materialId: a.material.id, homework: { student: { parents: { some: { parentId: user.id } } } } },
        })));
  }
  if (!allowed && a.submission) {
    const st = a.submission.homework.student;
    allowed = st.therapistId === user.id || st.parents.some((p) => p.parentId === user.id);
  }
  if (!allowed) return new Response("Forbidden", { status: 403 });

  const data = await readFile(path.join(UPLOAD_DIR, path.basename(a.path)));
  return new Response(data, {
    headers: {
      "Content-Type": a.mime,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(a.name)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

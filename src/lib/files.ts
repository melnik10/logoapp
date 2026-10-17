import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads");
const MAX = 50 * 1024 * 1024;

// Локально храним файлы на диске; в проде заменим на S3-совместимое хранилище
export async function saveUpload(file: File) {
  if (!file || file.size === 0) return null;
  if (file.size > MAX) throw new Error("Файл больше 50 МБ");
  await mkdir(UPLOAD_DIR, { recursive: true });
  const ext = path.extname(file.name).slice(0, 10);
  const name = `${randomUUID()}${ext}`;
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));
  return { path: name, name: file.name || name, mime: file.type || "application/octet-stream", size: file.size };
}

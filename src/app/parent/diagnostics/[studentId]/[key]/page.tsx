import { notFound } from "next/navigation";
import { requireParentChild } from "@/lib/auth";
import { db } from "@/lib/db";
import { templateByKey } from "@/lib/diagnostics";
import { Card, PageHeader } from "@/components/ui";
import { DiagnosticFormView } from "@/components/diagnostic-form";

export default async function ParentDiagnostic({ params }: { params: Promise<{ studentId: string; key: string }> }) {
  const { studentId, key } = await params;
  await requireParentChild(studentId);
  const tpl = templateByKey(key);
  if (!tpl || tpl.filledBy !== "PARENT") notFound();
  const student = await db.student.findUniqueOrThrow({ where: { id: studentId } });
  return (
    <>
      <PageHeader title={tpl.title} subtitle={`${student.firstName} · ${tpl.description}`} />
      <Card className="max-w-2xl"><DiagnosticFormView tpl={tpl} studentId={studentId} /></Card>
    </>
  );
}

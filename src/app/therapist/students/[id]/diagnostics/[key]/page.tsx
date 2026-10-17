import { notFound } from "next/navigation";
import { requireOwnStudent } from "@/lib/auth";
import { templateByKey } from "@/lib/diagnostics";
import { fullName } from "@/lib/format";
import { Card, PageHeader } from "@/components/ui";
import { DiagnosticFormView } from "@/components/diagnostic-form";

export default async function TherapistDiagnosticPage({ params }: { params: Promise<{ id: string; key: string }> }) {
  const { id, key } = await params;
  const { student } = await requireOwnStudent(id);
  const tpl = templateByKey(key);
  if (!tpl) notFound();
  return (
    <>
      <PageHeader title={tpl.title} subtitle={fullName(student)} />
      <Card className="max-w-4xl"><DiagnosticFormView tpl={tpl} studentId={id} /></Card>
    </>
  );
}

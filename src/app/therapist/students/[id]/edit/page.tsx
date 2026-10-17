import { requireOwnStudent } from "@/lib/auth";
import { updateStudent } from "@/app/actions/therapist";
import { Card, PageHeader } from "@/components/ui";
import { StudentForm } from "../../student-form";

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { student } = await requireOwnStudent(id);
  return (
    <>
      <PageHeader title="Редактировать ученика" />
      <Card className="max-w-2xl"><StudentForm action={updateStudent} student={student} /></Card>
    </>
  );
}

import { createStudent } from "@/app/actions/therapist";
import { Card, PageHeader } from "@/components/ui";
import { StudentForm } from "../student-form";

export default function NewStudentPage() {
  return (
    <>
      <PageHeader title="Новый ученик" />
      <Card className="max-w-2xl"><StudentForm action={createStudent} /></Card>
    </>
  );
}

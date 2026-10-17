import { requireUser } from "@/lib/auth";
import { Card, PageHeader } from "@/components/ui";
import { MaterialForm } from "@/components/material-form";

export default async function Page() {
  await requireUser("ADMIN");
  return (
    <>
      <PageHeader title="Новый общий материал" />
      <Card className="max-w-2xl"><MaterialForm /></Card>
    </>
  );
}

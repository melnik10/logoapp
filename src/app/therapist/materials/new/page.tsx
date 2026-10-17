import { Card, PageHeader } from "@/components/ui";
import { MaterialForm } from "@/components/material-form";

export default function NewMaterialPage() {
  return (
    <>
      <PageHeader title="Новый материал" subtitle="Заполните то, что нужно: файл, ссылку или текст" />
      <Card className="max-w-2xl"><MaterialForm /></Card>
    </>
  );
}

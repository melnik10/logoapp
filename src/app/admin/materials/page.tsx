import { Plus } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ButtonLink, Empty, PageHeader } from "@/components/ui";
import { MaterialList } from "@/components/material-list";

export default async function AdminMaterials() {
  await requireUser("ADMIN");
  const items = await db.material.findMany({ where: { ownerId: null }, include: { attachments: true }, orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title="Общая библиотека" subtitle="Эти материалы видят все логопеды" action={<ButtonLink href="/admin/materials/new"><Plus size={16} /> Материал</ButtonLink>} />
      {items.length ? <MaterialList items={items} canDelete={() => true} /> : <Empty title="Общих материалов пока нет" />}
    </>
  );
}

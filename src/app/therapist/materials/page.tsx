import { Plus, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ButtonLink, Empty, Input, PageHeader } from "@/components/ui";
import { MaterialList } from "@/components/material-list";

export default async function MaterialsPage({ searchParams }: { searchParams: Promise<{ q?: string; tag?: string }> }) {
  const user = await requireUser("THERAPIST");
  const { q, tag } = await searchParams;
  const all = await db.material.findMany({
    where: { OR: [{ ownerId: user.id }, { ownerId: null }] },
    include: { attachments: true },
    orderBy: { createdAt: "desc" },
  });
  const tags = [...new Set(all.flatMap((m) => m.tags))].sort();
  const items = all.filter(
    (m) => (!tag || m.tags.includes(tag)) && (!q || `${m.title} ${m.description ?? ""} ${m.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())),
  );
  return (
    <>
      <PageHeader title="Материалы" subtitle="Ваша библиотека и общие материалы платформы" action={<ButtonLink href="/therapist/materials/new"><Plus size={16} /> Материал</ButtonLink>} />
      <form className="relative mb-3">
        <Search size={16} className="absolute left-3 top-3 text-slate-400" />
        <Input name="q" defaultValue={q} placeholder="Поиск: «Р», «артикуляционная гимнастика»…" className="pl-9" />
      </form>
      <div className="mb-5 flex flex-wrap gap-1.5">
        <a href="?" className={`rounded-full px-3 py-1 text-xs font-medium ${!tag ? "bg-violet-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>Все</a>
        {tags.map((t) => (
          <a key={t} href={`?tag=${encodeURIComponent(t)}`} className={`rounded-full px-3 py-1 text-xs font-medium ${tag === t ? "bg-violet-600 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200"}`}>{t}</a>
        ))}
      </div>
      {items.length ? (
        <MaterialList items={items} canDelete={(m) => m.ownerId === user.id} assignHref={(m) => `/therapist/homework/new?material=${m.id}`} />
      ) : <Empty title="Ничего не нашлось" action={<ButtonLink href="/therapist/materials/new">Добавить материал</ButtonLink>} />}
    </>
  );
}

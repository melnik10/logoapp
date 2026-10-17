import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateShort } from "@/lib/format";
import { Card, CardTitle, Empty, PageHeader } from "@/components/ui";
import { HwBadge } from "@/components/hw-badge";

export default async function ParentHomework() {
  const user = await requireUser("PARENT");
  const list = await db.homework.findMany({
    where: { student: { parents: { some: { parentId: user.id } } } },
    include: { student: true },
    orderBy: { createdAt: "desc" },
  });
  const todo = list.filter((h) => h.status === "ASSIGNED");
  const rest = list.filter((h) => h.status !== "ASSIGNED");
  const Item = ({ h }: { h: (typeof list)[number] }) => (
    <li>
      <Link href={`/parent/homework/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-violet-700">
        <div>
          <p className="font-medium">{h.title}</p>
          <p className="text-xs text-slate-500">{h.student.firstName} · {fmtDateShort(h.createdAt)}{h.dueDate && ` · до ${fmtDateShort(h.dueDate)}`}{h.grade && ` · ${"⭐".repeat(h.grade)}`}</p>
        </div>
        <HwBadge status={h.status} />
      </Link>
    </li>
  );
  return (
    <>
      <PageHeader title="Домашние задания" />
      {!list.length ? <Empty title="Заданий пока нет" /> : (
        <div className="space-y-5">
          <Card><CardTitle>Нужно сделать</CardTitle>{todo.length ? <ul className="divide-y divide-slate-100">{todo.map((h) => <Item key={h.id} h={h} />)}</ul> : <p className="text-sm text-slate-500">Всё сделано, молодцы!</p>}</Card>
          {rest.length > 0 && <Card><CardTitle>Сданные</CardTitle><ul className="divide-y divide-slate-100">{rest.map((h) => <Item key={h.id} h={h} />)}</ul></Card>}
        </div>
      )}
    </>
  );
}

import type { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { toggleBlock } from "@/app/actions/admin";
import { fmtDate } from "@/lib/format";
import { Badge, Button, Card, PageHeader, Tabs } from "@/components/ui";

const roleLabel: Record<Role, string> = { THERAPIST: "Логопед", PARENT: "Родитель", ADMIN: "Админ" };

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const admin = await requireUser("ADMIN");
  const { role = "THERAPIST" } = await searchParams;
  const users = await db.user.findMany({
    where: role === "ALL" ? {} : { role: role as Role },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { students: true, children: true } } },
  });
  return (
    <>
      <PageHeader title="Пользователи" />
      <Tabs active={role} items={[
        { key: "THERAPIST", label: "Логопеды", href: "?role=THERAPIST" },
        { key: "PARENT", label: "Родители", href: "?role=PARENT" },
        { key: "ADMIN", label: "Админы", href: "?role=ADMIN" },
        { key: "ALL", label: "Все", href: "?role=ALL" },
      ]} />
      <Card className="p-0 sm:p-0">
        <ul className="divide-y divide-slate-100">
          {users.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{u.name} {u.blocked && <Badge className="bg-rose-100 text-rose-700">Заблокирован</Badge>}</p>
                <p className="text-xs text-slate-500">
                  {roleLabel[u.role]} · {u.email ?? u.phone} · с {fmtDate(u.createdAt)}
                  {u.role === "THERAPIST" && ` · ${u._count.students} учеников`}
                  {u.role === "PARENT" && ` · ${u._count.children} детей`}
                </p>
              </div>
              {u.id !== admin.id && (
                <form action={toggleBlock}>
                  <input type="hidden" name="id" value={u.id} />
                  <Button variant={u.blocked ? "secondary" : "ghost"} className="text-xs">{u.blocked ? "Разблокировать" : "Заблокировать"}</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}

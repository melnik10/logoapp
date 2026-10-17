import Link from "next/link";
import { Plus, Search } from "lucide-react";
import type { StudentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtAge, fullName } from "@/lib/format";
import { studentStatusLabel } from "@/lib/labels";
import { Avatar, Badge, ButtonLink, Empty, Input, PageHeader, Tabs } from "@/components/ui";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const user = await requireUser("THERAPIST");
  const { q, status = "ACTIVE" } = await searchParams;
  const students = await db.student.findMany({
    where: {
      therapistId: user.id,
      ...(status !== "ALL" && { status: status as StudentStatus }),
      ...(q && { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }] }),
    },
    include: { sounds: true, parents: true, lessons: { where: { startsAt: { gte: new Date() }, status: "PLANNED" }, orderBy: { startsAt: "asc" }, take: 1 } },
    orderBy: { firstName: "asc" },
  });

  return (
    <>
      <PageHeader title="Ученики" subtitle={`${students.length} в списке`} action={<ButtonLink href="/therapist/students/new"><Plus size={16} /> Ученик</ButtonLink>} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form className="relative min-w-56 flex-1">
          <Search size={16} className="absolute left-3 top-3 text-slate-400" />
          <input type="hidden" name="status" value={status} />
          <Input name="q" defaultValue={q} placeholder="Поиск по имени" className="pl-9" />
        </form>
      </div>
      <Tabs
        active={status}
        items={[
          { key: "ACTIVE", label: "Занимаются", href: "?status=ACTIVE" },
          { key: "PAUSED", label: "Пауза", href: "?status=PAUSED" },
          { key: "FINISHED", label: "Выпущены", href: "?status=FINISHED" },
          { key: "ALL", label: "Все", href: "?status=ALL" },
        ]}
      />
      {students.length ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {students.map((s) => {
            const inWork = s.sounds.filter((x) => x.stage !== "NOT_STARTED" && x.stage !== "SPEECH");
            return (
              <Link key={s.id} href={`/therapist/students/${s.id}`} className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow">
                <div className="flex items-center gap-3">
                  <Avatar name={fullName(s)} color={s.color} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{fullName(s)}</p>
                    <p className="text-sm text-slate-500">{fmtAge(s.birthDate) ?? "Возраст не указан"}</p>
                  </div>
                  {s.status !== "ACTIVE" && <Badge>{studentStatusLabel[s.status]}</Badge>}
                </div>
                <div className="mt-3 flex flex-wrap gap-1">
                  {inWork.map((x) => <Badge key={x.id} className="bg-violet-50 text-violet-700">{x.sound}</Badge>)}
                  {!s.parents.length && <Badge className="bg-amber-50 text-amber-700">Родитель не подключён</Badge>}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <Empty title="Учеников пока нет" text="Добавьте ученика и пригласите родителя по ссылке." action={<ButtonLink href="/therapist/students/new">Добавить ученика</ButtonLink>} />
      )}
    </>
  );
}

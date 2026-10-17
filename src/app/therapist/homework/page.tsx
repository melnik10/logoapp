import Link from "next/link";
import { Plus } from "lucide-react";
import type { HomeworkStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateShort, fullName } from "@/lib/format";
import { Avatar, ButtonLink, Card, Empty, PageHeader, Tabs } from "@/components/ui";
import { HwBadge } from "@/components/hw-badge";

export default async function HomeworkPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireUser("THERAPIST");
  const { status = "SUBMITTED" } = await searchParams;
  const list = await db.homework.findMany({
    where: { therapistId: user.id, ...(status !== "ALL" && { status: status as HomeworkStatus }) },
    include: { student: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const counts = await db.homework.groupBy({ by: ["status"], where: { therapistId: user.id }, _count: true });
  const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;
  return (
    <>
      <PageHeader title="Домашние задания" action={<ButtonLink href="/therapist/homework/new"><Plus size={16} /> Выдать задание</ButtonLink>} />
      <Tabs
        active={status}
        items={[
          { key: "SUBMITTED", label: `На проверку · ${c("SUBMITTED")}`, href: "?status=SUBMITTED" },
          { key: "ASSIGNED", label: `Выданы · ${c("ASSIGNED")}`, href: "?status=ASSIGNED" },
          { key: "REVIEWED", label: `Проверены · ${c("REVIEWED")}`, href: "?status=REVIEWED" },
          { key: "ALL", label: "Все", href: "?status=ALL" },
        ]}
      />
      {list.length ? (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {list.map((h) => (
              <li key={h.id}>
                <Link href={`/therapist/homework/${h.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">
                  <Avatar name={fullName(h.student)} color={h.student.color} size={36} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.title}</p>
                    <p className="text-xs text-slate-500">{fullName(h.student)} · {fmtDateShort(h.createdAt)}{h.dueDate && ` · до ${fmtDateShort(h.dueDate)}`}</p>
                  </div>
                  <HwBadge status={h.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : <Empty title="Здесь пусто" />}
    </>
  );
}

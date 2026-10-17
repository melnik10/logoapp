import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { markNotificationsRead } from "@/app/actions/therapist";
import { fmtAgo } from "@/lib/format";
import { Button, Card, Empty, PageHeader } from "./ui";

export async function NotificationsPage({ userId }: { userId: string }) {
  const items = await db.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <>
      <PageHeader title="Уведомления" action={items.some((n) => !n.readAt) && <form action={markNotificationsRead}><Button variant="secondary">Прочитать все</Button></form>} />
      {items.length ? (
        <Card className="p-0 sm:p-0">
          <ul className="divide-y divide-slate-100">
            {items.map((n) => (
              <li key={n.id}>
                <Link href={n.link ?? "#"} className={clsx("flex gap-3 px-4 py-3 hover:bg-slate-50", !n.readAt && "bg-violet-50/50")}>
                  <span className={clsx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-violet-500")} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.body && <p className="truncate text-sm text-slate-500">{n.body}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{fmtAgo(n.createdAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : <Empty title="Уведомлений нет" />}
    </>
  );
}

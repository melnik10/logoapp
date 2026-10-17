import Link from "next/link";
import { CalendarDays, ClipboardList, Wallet } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parentChildren } from "@/lib/parent";
import { subInclude, subscriptionSummary } from "@/lib/billing";
import { fmtAge, fmtDay, fmtTime, fullName } from "@/lib/format";
import { Avatar, Card, Empty, PageHeader } from "@/components/ui";
import { SoundMap } from "@/components/sound-map";

export default async function ParentHome() {
  const user = await requireUser("PARENT");
  const children = await parentChildren(user.id);
  if (!children.length)
    return <Empty title="Пока нет подключённых детей" text="Попросите логопеда прислать ссылку-приглашение." />;

  return (
    <>
      <PageHeader title={`Здравствуйте, ${user.name.split(" ")[0]}!`} />
      <div className="space-y-6">
        {await Promise.all(children.map(async (child) => {
          const [next, hwOpen, subs, sounds, intake] = await Promise.all([
            db.lesson.findFirst({ where: { studentId: child.id, startsAt: { gte: new Date() }, status: "PLANNED" }, orderBy: { startsAt: "asc" } }),
            db.homework.count({ where: { studentId: child.id, status: "ASSIGNED" } }),
            db.subscription.findMany({ where: { studentId: child.id, closed: false }, include: subInclude }),
            db.soundProgress.findMany({ where: { studentId: child.id } }),
            db.diagnosticForm.count({ where: { studentId: child.id, templateKey: "parent-intake" } }),
          ]);
          const active = subs.map(subscriptionSummary).filter((s) => s.active);
          const left = active.reduce((a, s) => a + s.left, 0);
          const debt = subs.map(subscriptionSummary).reduce((a, s) => a + s.debt, 0);
          return (
            <section key={child.id}>
              <div className="mb-3 flex items-center gap-3">
                <Avatar name={fullName(child)} color={child.color} />
                <div>
                  <p className="text-lg font-semibold">{fullName(child)}</p>
                  <p className="text-sm text-slate-500">{[fmtAge(child.birthDate), `логопед ${child.therapist.name}`].filter(Boolean).join(" · ")}</p>
                </div>
              </div>
              {!intake && (
                <Link href={`/parent/diagnostics/${child.id}/parent-intake`} className="mb-3 block rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-500 p-4 text-white shadow">
                  <p className="font-semibold">Заполните анкету о ребёнке</p>
                  <p className="text-sm text-white/80">Это поможет логопеду подготовиться к занятиям. Займёт 5 минут.</p>
                </Link>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <Link href="/parent/schedule" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-violet-200">
                  <CalendarDays className="mb-2 text-violet-600" size={22} />
                  <p className="text-xs text-slate-500">Следующее занятие</p>
                  <p className="font-semibold first-letter:uppercase">{next ? `${fmtDay(next.startsAt)}, ${fmtTime(next.startsAt)}` : "Не назначено"}</p>
                </Link>
                <Link href="/parent/homework" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-violet-200">
                  <ClipboardList className="mb-2 text-sky-600" size={22} />
                  <p className="text-xs text-slate-500">Домашние задания</p>
                  <p className="font-semibold">{hwOpen ? `${hwOpen} ждут выполнения` : "Всё сделано 👍"}</p>
                </Link>
                <Link href="/parent/payments" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm hover:border-violet-200">
                  <Wallet className="mb-2 text-emerald-600" size={22} />
                  <p className="text-xs text-slate-500">Абонемент</p>
                  <p className={`font-semibold ${left <= 1 ? "text-amber-600" : ""}`}>{active.length ? `Осталось ${left} зан.` : "Нет активного"}</p>
                  {debt > 0 && <p className="text-xs text-rose-600">К оплате {debt.toLocaleString("ru-RU")} ₽</p>}
                </Link>
              </div>
              {sounds.length > 0 && (
                <Card className="mt-3">
                  <p className="mb-3 font-semibold">Звуки</p>
                  <SoundMap sounds={sounds} />
                </Card>
              )}
            </section>
          );
        }))}
      </div>
    </>
  );
}

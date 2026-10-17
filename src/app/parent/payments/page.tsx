import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parentChildren } from "@/lib/parent";
import { subInclude, subscriptionSummary } from "@/lib/billing";
import { fmtDate, fmtMoney, fullName } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/labels";
import { Badge, Card, CardTitle, Empty, PageHeader } from "@/components/ui";

export default async function ParentPayments() {
  const user = await requireUser("PARENT");
  const children = await parentChildren(user.id);
  if (!children.length) return <Empty title="Нет подключённых детей" />;
  return (
    <>
      <PageHeader title="Абонементы и оплата" />
      <div className="space-y-8">
        {await Promise.all(children.map(async (c) => {
          const [subs, payments] = await Promise.all([
            db.subscription.findMany({ where: { studentId: c.id }, include: subInclude, orderBy: { startDate: "desc" } }),
            db.payment.findMany({ where: { studentId: c.id }, orderBy: { paidAt: "desc" }, take: 20 }),
          ]);
          return (
            <section key={c.id} className="space-y-4">
              {children.length > 1 && <h2 className="text-lg font-semibold">{fullName(c)}</h2>}
              {subs.length ? subs.map((s) => {
                const sum = subscriptionSummary(s);
                return (
                  <Card key={s.id} className={sum.active ? "" : "opacity-70"}>
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="font-semibold">{s.name}</p><p className="text-xs text-slate-500">с {fmtDate(s.startDate)}{s.expiresAt && ` до ${fmtDate(s.expiresAt)}`}</p></div>
                      <Badge className={sum.active ? "bg-emerald-100 text-emerald-700" : ""}>{sum.active ? "Активен" : "Завершён"}</Badge>
                    </div>
                    <div className="mt-3 flex gap-1">{Array.from({ length: s.lessonsTotal }, (_, i) => <span key={i} className={`h-3 flex-1 rounded-full ${i < sum.used ? "bg-violet-500" : "bg-slate-200"}`} />)}</div>
                    <p className="mt-2 text-sm">Осталось <b>{sum.left}</b> из {s.lessonsTotal} занятий</p>
                    {sum.debt > 0 && <p className="mt-1 text-sm font-semibold text-rose-600">К оплате: {fmtMoney(sum.debt)}</p>}
                  </Card>
                );
              }) : <Empty title="Абонементов пока нет" />}
              {c.therapist.paymentDetails && (
                <Card className="border-violet-200 bg-violet-50/50">
                  <CardTitle>Как оплатить</CardTitle>
                  <p className="whitespace-pre-wrap text-sm">{c.therapist.paymentDetails}</p>
                  <p className="mt-2 text-xs text-slate-500">После перевода логопед отметит оплату, и она появится ниже.</p>
                </Card>
              )}
              {payments.length > 0 && (
                <Card>
                  <CardTitle>История оплат</CardTitle>
                  <ul className="space-y-2 text-sm">{payments.map((p) => <li key={p.id} className="flex justify-between"><span className="text-slate-500">{fmtDate(p.paidAt)} · {paymentMethodLabel[p.method]}</span><b>{fmtMoney(p.amount)}</b></li>)}</ul>
                </Card>
              )}
            </section>
          );
        }))}
      </div>
    </>
  );
}

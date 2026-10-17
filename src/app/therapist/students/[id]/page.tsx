import Link from "next/link";
import { headers } from "next/headers";
import { Copy, Pencil, Plus, UserMinus } from "lucide-react";
import { db } from "@/lib/db";
import { requireOwnStudent } from "@/lib/auth";
import { addPayment, assignSubscription, closeSubscription, createInvite, removeParent, setSoundStage } from "@/app/actions/therapist";
import { subInclude, subscriptionSummary } from "@/lib/billing";
import { TEMPLATES, templateByKey } from "@/lib/diagnostics";
import { fmtAge, fmtDate, fmtDateShort, fmtMoney, fullName } from "@/lib/format";
import { paymentMethodLabel, studentStatusLabel } from "@/lib/labels";
import { Avatar, Badge, Button, ButtonLink, Card, CardTitle, Empty, Field, Input, PageHeader, Select, Tabs } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { LessonRow } from "@/components/lesson-row";
import { SoundMap } from "@/components/sound-map";
import { HwBadge } from "@/components/hw-badge";

const TABS = [
  { key: "overview", label: "Обзор" },
  { key: "sounds", label: "Карта звуков" },
  { key: "lessons", label: "Занятия" },
  { key: "homework", label: "Домашки" },
  { key: "finance", label: "Абонементы" },
  { key: "diagnostics", label: "Диагностика" },
];

export default async function StudentPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const { user, student } = await requireOwnStudent(id);

  return (
    <>
      <PageHeader
        title={fullName(student)}
        subtitle={[fmtAge(student.birthDate), studentStatusLabel[student.status]].filter(Boolean).join(" · ")}
        action={
          <div className="flex gap-2">
            <ButtonLink variant="secondary" href={`/therapist/students/${id}/edit`}><Pencil size={16} /> Изменить</ButtonLink>
            <ButtonLink href={`/therapist/schedule/new?student=${id}`}><Plus size={16} /> Занятие</ButtonLink>
          </div>
        }
      />
      <Tabs active={tab} items={TABS.map((t) => ({ ...t, href: `?tab=${t.key}` }))} />
      {tab === "overview" && <Overview studentId={id} />}
      {tab === "sounds" && <Sounds studentId={id} />}
      {tab === "lessons" && <Lessons studentId={id} />}
      {tab === "homework" && <Homework studentId={id} />}
      {tab === "finance" && <Finance studentId={id} therapistId={user.id} />}
      {tab === "diagnostics" && <Diagnostics studentId={id} />}
    </>
  );
}

async function Overview({ studentId }: { studentId: string }) {
  const s = await db.student.findUniqueOrThrow({
    where: { id: studentId },
    include: { parents: { include: { parent: true } }, invites: { where: { usedAt: null }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const invite = s.invites[0];
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardTitle>Заключение</CardTitle>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{s.conclusion || "Не заполнено"}</p>
        </Card>
        <Card>
          <CardTitle>Индивидуальная программа</CardTitle>
          <p className="whitespace-pre-wrap text-sm text-slate-700">{s.program || "Не заполнено"}</p>
        </Card>
        {s.notes && (
          <Card>
            <CardTitle>Заметки (видите только вы)</CardTitle>
            <p className="whitespace-pre-wrap text-sm text-slate-700">{s.notes}</p>
          </Card>
        )}
      </div>
      <Card className="h-fit">
        <CardTitle>Родители</CardTitle>
        <ul className="space-y-3">
          {s.parents.map(({ parent, relation }) => (
            <li key={parent.id} className="flex items-center gap-3">
              <Avatar name={parent.name} size={34} color="#64748b" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{parent.name} {relation && <span className="text-slate-400">· {relation}</span>}</p>
                <a href={`tel:${parent.phone}`} className="text-xs text-violet-700">{parent.phone}</a>
              </div>
              <form action={removeParent}>
                <input type="hidden" name="studentId" value={s.id} />
                <input type="hidden" name="parentId" value={parent.id} />
                <button className="text-slate-400 hover:text-rose-600" aria-label="Отключить"><UserMinus size={16} /></button>
              </form>
            </li>
          ))}
        </ul>
        {!s.parents.length && <p className="mb-3 text-sm text-slate-500">Пригласите родителя: он увидит расписание, домашки, абонемент и прогресс.</p>}
        <div className="mt-4 border-t border-slate-100 pt-4">
          {invite ? (
            <div>
              <p className="mb-1 text-xs font-medium text-slate-500">Ссылка-приглашение{invite.phone ? ` для ${invite.phone}` : ""}</p>
              <div className="flex items-center gap-2 rounded-xl bg-violet-50 p-2.5 text-xs text-violet-800">
                <Copy size={14} className="shrink-0" />
                <span className="select-all break-all">{origin}/invite/{invite.code}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Отправьте её родителю в мессенджере.</p>
            </div>
          ) : (
            <form action={createInvite} className="space-y-2">
              <input type="hidden" name="studentId" value={s.id} />
              <Input name="phone" type="tel" placeholder="Телефон родителя (необязательно)" />
              <SubmitButton variant="secondary" className="w-full">Создать приглашение</SubmitButton>
            </form>
          )}
        </div>
      </Card>
    </div>
  );
}

async function Sounds({ studentId }: { studentId: string }) {
  const [sounds, logs] = await Promise.all([
    db.soundProgress.findMany({ where: { studentId } }),
    db.soundProgressLog.findMany({ where: { studentId }, orderBy: { createdAt: "desc" }, take: 15 }),
  ]);
  const { soundStageLabel } = await import("@/lib/labels");
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardTitle>Этапы по звукам</CardTitle>
        <SoundMap sounds={sounds} action={setSoundStage} studentId={studentId} />
      </Card>
      <Card className="h-fit">
        <CardTitle>История</CardTitle>
        {logs.length ? (
          <ul className="space-y-2 text-sm">
            {logs.map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span><b>{l.sound}</b> → {soundStageLabel[l.stage]}</span>
                <span className="text-slate-400">{fmtDateShort(l.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-slate-500">Изменений пока нет.</p>}
      </Card>
    </div>
  );
}

async function Lessons({ studentId }: { studentId: string }) {
  const lessons = await db.lesson.findMany({ where: { studentId }, include: { student: true }, orderBy: { startsAt: "desc" }, take: 60 });
  const now = new Date();
  const upcoming = lessons.filter((l) => l.startsAt >= now).reverse();
  const past = lessons.filter((l) => l.startsAt < now);
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card>
        <CardTitle>Предстоящие</CardTitle>
        <div className="space-y-2">
          {upcoming.length ? upcoming.slice(0, 10).map((l) => (
            <div key={l.id}><p className="mb-1 text-xs text-slate-500">{fmtDate(l.startsAt)}</p><LessonRow lesson={l} showStudent={false} href={`/therapist/lessons/${l.id}`} /></div>
          )) : <p className="text-sm text-slate-500">Нет запланированных занятий.</p>}
        </div>
      </Card>
      <Card>
        <CardTitle>История</CardTitle>
        <div className="space-y-2">
          {past.length ? past.map((l) => (
            <div key={l.id}>
              <p className="mb-1 text-xs text-slate-500">{fmtDate(l.startsAt)}</p>
              <LessonRow lesson={l} showStudent={false} href={`/therapist/lessons/${l.id}`} />
              {l.note && <p className="mt-1 px-2 text-xs text-slate-500">📝 {l.note}</p>}
            </div>
          )) : <p className="text-sm text-slate-500">Занятий ещё не было.</p>}
        </div>
      </Card>
    </div>
  );
}

async function Homework({ studentId }: { studentId: string }) {
  const list = await db.homework.findMany({ where: { studentId }, orderBy: { createdAt: "desc" } });
  return (
    <Card>
      <CardTitle action={<ButtonLink href={`/therapist/homework/new?student=${studentId}`}><Plus size={16} /> Выдать</ButtonLink>}>Домашние задания</CardTitle>
      {list.length ? (
        <ul className="divide-y divide-slate-100">
          {list.map((h) => (
            <li key={h.id}>
              <Link href={`/therapist/homework/${h.id}`} className="flex items-center justify-between gap-3 py-3 hover:text-violet-700">
                <div>
                  <p className="font-medium">{h.title}</p>
                  <p className="text-xs text-slate-500">Выдано {fmtDateShort(h.createdAt)}{h.dueDate && ` · до ${fmtDateShort(h.dueDate)}`}</p>
                </div>
                <HwBadge status={h.status} />
              </Link>
            </li>
          ))}
        </ul>
      ) : <Empty title="Домашек пока нет" />}
    </Card>
  );
}

async function Finance({ studentId, therapistId }: { studentId: string; therapistId: string }) {
  const [subs, tariffs, payments] = await Promise.all([
    db.subscription.findMany({ where: { studentId }, include: subInclude, orderBy: { startDate: "desc" } }),
    db.tariff.findMany({ where: { therapistId, archived: false }, orderBy: { lessonsCount: "asc" } }),
    db.payment.findMany({ where: { studentId }, orderBy: { paidAt: "desc" }, take: 20 }),
  ]);
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {subs.length ? subs.map((s) => {
          const sum = subscriptionSummary(s);
          return (
            <Card key={s.id} className={!sum.active ? "opacity-70" : ""}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-xs text-slate-500">с {fmtDate(s.startDate)}{s.expiresAt && ` до ${fmtDate(s.expiresAt)}`}</p>
                </div>
                <Badge className={sum.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}>
                  {s.closed ? "Закрыт" : sum.expired ? "Истёк" : sum.left === 0 ? "Использован" : "Активен"}
                </Badge>
              </div>
              <div className="mt-3 flex items-end gap-1">
                {Array.from({ length: s.lessonsTotal }, (_, i) => (
                  <span key={i} className={`h-3 flex-1 rounded-full ${i < sum.used ? "bg-violet-500" : "bg-slate-200"}`} />
                ))}
              </div>
              <div className="mt-2 flex flex-wrap justify-between gap-2 text-sm">
                <span>Осталось <b>{sum.left}</b> из {s.lessonsTotal}</span>
                <span>Оплачено {fmtMoney(sum.paid)} из {fmtMoney(s.price)}{sum.debt > 0 && <b className="text-rose-600"> · долг {fmtMoney(sum.debt)}</b>}</span>
              </div>
              {!s.closed && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                  {sum.debt > 0 && (
                    <form action={addPayment} className="flex flex-wrap gap-2">
                      <input type="hidden" name="studentId" value={studentId} />
                      <input type="hidden" name="subscriptionId" value={s.id} />
                      <Input name="amount" type="number" defaultValue={sum.debt} className="w-28" aria-label="Сумма" />
                      <Select name="method" className="w-36" aria-label="Способ">{Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
                      <SubmitButton variant="success">Оплата получена</SubmitButton>
                    </form>
                  )}
                  <form action={closeSubscription}>
                    <input type="hidden" name="id" value={s.id} />
                    <Button variant="ghost">Закрыть</Button>
                  </form>
                </div>
              )}
            </Card>
          );
        }) : <Empty title="Абонементов нет" text="Назначьте абонемент справа — занятия будут списываться автоматически." />}
      </div>
      <div className="space-y-5">
        <Card>
          <CardTitle>Назначить абонемент</CardTitle>
          {tariffs.length ? (
            <form action={assignSubscription} className="space-y-3">
              <input type="hidden" name="studentId" value={studentId} />
              <Field label="Тариф">
                <Select name="tariffId">{tariffs.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.lessonsCount} зан. · {fmtMoney(t.price)}</option>)}</Select>
              </Field>
              <Field label="Сразу оплачено, ₽" hint="Оставьте пустым, если оплаты ещё нет"><Input name="paid" type="number" /></Field>
              <Field label="Способ оплаты">
                <Select name="method">{Object.entries(paymentMethodLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
              </Field>
              <SubmitButton className="w-full">Назначить</SubmitButton>
            </form>
          ) : <p className="text-sm text-slate-500">Сначала создайте тарифы в разделе <Link href="/therapist/finance" className="text-violet-700">Финансы</Link>.</p>}
        </Card>
        <Card>
          <CardTitle>Платежи</CardTitle>
          {payments.length ? (
            <ul className="space-y-2 text-sm">
              {payments.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span className="text-slate-500">{fmtDate(p.paidAt)} · {paymentMethodLabel[p.method]}</span>
                  <b>{fmtMoney(p.amount)}</b>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Платежей нет.</p>}
        </Card>
      </div>
    </div>
  );
}

async function Diagnostics({ studentId }: { studentId: string }) {
  const forms = await db.diagnosticForm.findMany({ where: { studentId }, include: { filledBy: true }, orderBy: { createdAt: "desc" } });
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {forms.length ? forms.map((f) => {
          const tpl = templateByKey(f.templateKey);
          const answers = f.answers as Record<string, string>;
          return (
            <Card key={f.id}>
              <CardTitle>{tpl?.title ?? f.templateKey}</CardTitle>
              <p className="-mt-2 mb-3 text-xs text-slate-500">{f.filledBy.name}, {fmtDate(f.createdAt)}</p>
              <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                {tpl?.questions.filter((q) => answers[q.key]).map((q) => (
                  <div key={q.key}><dt className="text-slate-500">{q.label}</dt><dd className="whitespace-pre-wrap font-medium">{answers[q.key]}</dd></div>
                ))}
              </dl>
            </Card>
          );
        }) : <Empty title="Бланков пока нет" text="Родитель может заполнить анкету в своём кабинете." />}
      </div>
      <Card className="h-fit">
        <CardTitle>Заполнить бланк</CardTitle>
        <ul className="space-y-2">
          {TEMPLATES.map((t) => (
            <li key={t.key}>
              <Link href={`/therapist/students/${studentId}/diagnostics/${t.key}`} className="block rounded-xl border border-slate-200 p-3 hover:border-violet-300">
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-xs text-slate-500">{t.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

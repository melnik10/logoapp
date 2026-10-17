import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { parentChildren } from "@/lib/parent";
import { fullName } from "@/lib/format";
import { Card, CardTitle, Empty, PageHeader, Stat } from "@/components/ui";
import { SoundMap } from "@/components/sound-map";

export default async function ParentProgress() {
  const user = await requireUser("PARENT");
  const children = await parentChildren(user.id);
  if (!children.length) return <Empty title="Нет подключённых детей" />;
  return (
    <>
      <PageHeader title="Прогресс" />
      <div className="space-y-8">
        {await Promise.all(children.map(async (c) => {
          const [sounds, done, hw, hwDone] = await Promise.all([
            db.soundProgress.findMany({ where: { studentId: c.id } }),
            db.lesson.count({ where: { studentId: c.id, status: "DONE" } }),
            db.homework.count({ where: { studentId: c.id } }),
            db.homework.count({ where: { studentId: c.id, status: { not: "ASSIGNED" } } }),
          ]);
          const inSpeech = sounds.filter((s) => s.stage === "SPEECH").length;
          return (
            <section key={c.id} className="space-y-4">
              {children.length > 1 && <h2 className="text-lg font-semibold">{fullName(c)}</h2>}
              <div className="grid grid-cols-3 gap-3">
                <Stat label="Занятий" value={done} />
                <Stat label="Домашек" value={`${hwDone}/${hw}`} tone="sky" />
                <Stat label="Звуков в речи" value={`${inSpeech}/${sounds.length}`} tone="emerald" />
              </div>
              <Card>
                <CardTitle>Карта звуков</CardTitle>
                {sounds.length ? <SoundMap sounds={sounds} /> : <p className="text-sm text-slate-500">Логопед ещё не заполнил карту звуков.</p>}
              </Card>
              {c.program && (
                <Card><CardTitle>Программа и цели</CardTitle><p className="whitespace-pre-wrap text-sm text-slate-700">{c.program}</p></Card>
              )}
            </section>
          );
        }))}
      </div>
    </>
  );
}

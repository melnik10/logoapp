import clsx from "clsx";
import type { SoundProgress, SoundStage } from "@prisma/client";
import { SOUNDS, soundStageColor, soundStageLabel, soundStages } from "@/lib/labels";

// Шкала этапов: сколько шагов звук прошёл из шести
export function stageProgress(stage: SoundStage) {
  return soundStages.indexOf(stage) / (soundStages.length - 1);
}

export function SoundMap({
  sounds, action, studentId,
}: {
  sounds: SoundProgress[];
  action?: (form: FormData) => Promise<void>;
  studentId?: string;
}) {
  const bySound = new Map(sounds.map((s) => [s.sound, s]));
  const list = action ? SOUNDS : SOUNDS.filter((s) => bySound.has(s));
  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {list.map((sound) => {
          const stage = bySound.get(sound)?.stage ?? "NOT_STARTED";
          const p = stageProgress(stage);
          return (
            <div key={sound} className={clsx("rounded-xl border p-3", stage === "SPEECH" ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-white")}>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900">{sound}</span>
                <span className={clsx("rounded-full px-2 py-0.5 text-[11px] font-medium", soundStageColor[stage])}>{soundStageLabel[stage]}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-500" style={{ width: `${p * 100}%` }} />
              </div>
              {action && studentId && (
                <form action={action} className="mt-2">
                  <input type="hidden" name="studentId" value={studentId} />
                  <input type="hidden" name="sound" value={sound} />
                  <select
                    name="stage"
                    defaultValue={stage}
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs"
                    aria-label={`Этап звука ${sound}`}
                  >
                    {soundStages.map((s) => <option key={s} value={s}>{soundStageLabel[s]}</option>)}
                  </select>
                  <button className="mt-1 w-full rounded-lg bg-slate-900 py-1 text-xs font-medium text-white hover:bg-slate-700">Сохранить</button>
                </form>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5 text-[11px] text-slate-500">
        {soundStages.slice(1).map((s, i) => (
          <span key={s} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300">→</span>}
            <span className={clsx("rounded-full px-2 py-0.5", soundStageColor[s])}>{soundStageLabel[s]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

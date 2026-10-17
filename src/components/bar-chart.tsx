// Простая столбчатая диаграмма без внешних библиотек
export function BarChart({ data, format = (n: number) => String(n), color = "bg-violet-500" }: { data: { label: string; value: number }[]; format?: (n: number) => string; color?: string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex h-48 items-end gap-2">
      {data.map((d) => (
        <div key={d.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-[11px] font-medium text-slate-600">{d.value ? format(d.value) : ""}</span>
          <div className={`w-full max-w-12 rounded-t-lg ${color}`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value ? 4 : 0 }} />
          <span className="text-[11px] capitalize text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

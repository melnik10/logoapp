import type { Attachment, Material } from "@prisma/client";
import { ExternalLink, PlayCircle } from "lucide-react";
import { Attachments } from "./attachments";

export function HomeworkMaterials({ materials }: { materials: (Material & { attachments: Attachment[] })[] }) {
  if (!materials.length) return null;
  return (
    <div className="space-y-3">
      {materials.map((m) => (
        <div key={m.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3">
          <p className="font-medium">{m.title}</p>
          {m.description && <p className="mt-0.5 text-sm text-slate-600">{m.description}</p>}
          {m.text && <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{m.text}</p>}
          {m.url && (
            <a href={m.url} target="_blank" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-violet-700">
              {m.type === "VIDEO" ? <PlayCircle size={16} /> : <ExternalLink size={16} />} {m.type === "VIDEO" ? "Смотреть видео" : "Открыть ссылку"}
            </a>
          )}
          <Attachments items={m.attachments} />
        </div>
      ))}
    </div>
  );
}

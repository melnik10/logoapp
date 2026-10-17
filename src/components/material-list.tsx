import Link from "next/link";
import { FileText, Link2, PlayCircle, Type, Trash2 } from "lucide-react";
import type { Attachment, Material } from "@prisma/client";
import { deleteMaterial } from "@/app/actions/therapist";
import { Badge, Card } from "./ui";

const icon = { FILE: FileText, LINK: Link2, VIDEO: PlayCircle, TEXT: Type };

export function MaterialList({ items, canDelete, assignHref }: { items: (Material & { attachments: Attachment[] })[]; canDelete: (m: Material) => boolean; assignHref?: (m: Material) => string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((m) => {
        const Icon = icon[m.type];
        return (
          <Card key={m.id} className="flex flex-col">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Icon size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.title}</p>
                {m.description && <p className="line-clamp-2 text-sm text-slate-500">{m.description}</p>}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1">
              {!m.ownerId && <Badge className="bg-fuchsia-50 text-fuchsia-700">Общий</Badge>}
              {m.tags.map((t) => <Badge key={t}>{t}</Badge>)}
              {m.attachments.length > 0 && <Badge>📎 {m.attachments.length}</Badge>}
            </div>
            <div className="mt-auto flex items-center gap-2 pt-3">
              {m.url && <a href={m.url} target="_blank" className="text-sm text-violet-700">Открыть</a>}
              {m.attachments[0] && <a href={`/api/files/${m.attachments[0].id}`} target="_blank" className="text-sm text-violet-700">Файл</a>}
              <span className="flex-1" />
              {assignHref && <Link href={assignHref(m)} className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700">Выдать</Link>}
              {canDelete(m) && (
                <form action={deleteMaterial}>
                  <input type="hidden" name="id" value={m.id} />
                  <button className="p-1.5 text-slate-400 hover:text-rose-600" aria-label="Удалить"><Trash2 size={16} /></button>
                </form>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

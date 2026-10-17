import type { Attachment } from "@prisma/client";
import { FileText, Paperclip } from "lucide-react";

export function Attachments({ items }: { items: Attachment[] }) {
  if (!items.length) return null;
  return (
    <div className="mt-2 space-y-2">
      {items.map((a) => {
        const src = `/api/files/${a.id}`;
        if (a.mime.startsWith("image/"))
          // eslint-disable-next-line @next/next/no-img-element
          return <a key={a.id} href={src} target="_blank"><img src={src} alt={a.name} className="max-h-64 rounded-xl border border-slate-200" /></a>;
        if (a.mime.startsWith("audio/")) return <audio key={a.id} controls src={src} className="w-full max-w-sm" />;
        if (a.mime.startsWith("video/")) return <video key={a.id} controls src={src} className="max-h-72 rounded-xl" />;
        return (
          <a key={a.id} href={src} target="_blank" className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50">
            {a.mime === "application/pdf" ? <FileText size={16} /> : <Paperclip size={16} />} {a.name}
          </a>
        );
      })}
    </div>
  );
}

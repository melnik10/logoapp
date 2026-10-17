"use client";
import { useRef, useState } from "react";
import { Mic, Square, Trash2 } from "lucide-react";

// Запись голоса ребёнка прямо в браузере / приложении; файл уходит вместе с формой
export function AudioRecorder({ name = "audio" }: { name?: string }) {
  const [state, setState] = useState<"idle" | "rec" | "done">("idle");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const chunks = useRef<Blob[]>([]);

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = (e) => chunks.current.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const type = mr.mimeType || "audio/webm";
        const blob = new Blob(chunks.current, { type });
        const ext = type.includes("mp4") ? "m4a" : type.includes("ogg") ? "ogg" : "webm";
        const file = new File([blob], `zapis-${Date.now()}.${ext}`, { type });
        const dt = new DataTransfer();
        dt.items.add(file);
        if (input.current) input.current.files = dt.files;
        setUrl(URL.createObjectURL(blob));
        setState("done");
      };
      mr.start();
      rec.current = mr;
      setState("rec");
    } catch {
      setError("Нет доступа к микрофону. Разрешите его в настройках браузера или телефона.");
    }
  }

  function reset() {
    if (input.current) input.current.value = "";
    setUrl(null);
    setState("idle");
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-3">
      <input ref={input} type="file" name={name} accept="audio/*" className="hidden" />
      {state === "idle" && (
        <button type="button" onClick={start} className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-50 py-3 text-sm font-medium text-rose-700 hover:bg-rose-100">
          <Mic size={18} /> Записать голос
        </button>
      )}
      {state === "rec" && (
        <button type="button" onClick={() => rec.current?.stop()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 py-3 text-sm font-medium text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" /> Идёт запись… <Square size={16} /> Стоп
        </button>
      )}
      {state === "done" && url && (
        <div className="flex items-center gap-2">
          <audio controls src={url} className="h-10 flex-1" />
          <button type="button" onClick={reset} className="p-2 text-slate-400 hover:text-rose-600" aria-label="Удалить запись"><Trash2 size={18} /></button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
    </div>
  );
}

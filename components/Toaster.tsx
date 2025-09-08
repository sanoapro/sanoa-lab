"use client";
import { useEffect, useState } from "react";

type ToastKind = "success" | "error" | "info";
type Toast = { id: number; message: string; kind: ToastKind };

let _id = 0;
export function showToast(message: string, kind: ToastKind = "info") {
  try { window.dispatchEvent(new CustomEvent("sanoa:toast", { detail: { message, kind } })); }
  catch {}
}

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    function onToast(e: Event) {
      const ce = e as CustomEvent<{ message: string; kind: ToastKind }>;
      const t: Toast = { id: ++_id, message: ce.detail.message, kind: ce.detail.kind || "info" };
      setToasts((prev) => [...prev, t]);
      // autodestruir en 4s
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
    }
    window.addEventListener("sanoa:toast", onToast as EventListener);
    return () => window.removeEventListener("sanoa:toast", onToast as EventListener);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const base = "pointer-events-auto rounded-xl border px-4 py-3 shadow bg-white";
        const border =
          t.kind === "success" ? "border-emerald-300" :
          t.kind === "error" ? "border-red-300" :
          "border-[var(--color-brand-border)]";
        const dot =
          t.kind === "success" ? "bg-emerald-500" :
          t.kind === "error" ? "bg-red-500" :
          "bg-[var(--color-brand-coral)]";
        return (
          <div key={t.id} className={`${base} ${border}`}>
            <div className="flex items-start gap-3">
              <span className={`mt-1 inline-block h-2 w-2 rounded-full ${dot}`} />
              <p className="text-[var(--color-brand-text)] text-sm">{t.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

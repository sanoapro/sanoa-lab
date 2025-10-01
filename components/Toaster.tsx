"use client";

import { useToast } from "./Toast";

export { showToast } from "./Toast";

export default function Toaster() {
  const { toasts, remove } = useToast();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => {
        const variant = toast.variant === "error" ? "error" : toast.variant === "success" ? "success" : "default";
        const emoji = variant === "success" ? "✅" : variant === "error" ? "⚠️" : "🔔";

        return (
          <div key={toast.id} className="glass-card bubble min-w-[260px] flex items-start gap-2">
            <div className="text-xl">
              <span className="emoji">{emoji}</span>
            </div>
            <div className="flex-1">
              {toast.title && <div className="font-semibold">{toast.title}</div>}
              {toast.description && <div className="text-sm text-contrast/80">{toast.description}</div>}
            </div>
            <button className="glass-btn" onClick={() => remove(toast.id)} aria-label="Cerrar">
              ✖️
            </button>
          </div>
        );
      })}
    </div>
  );
}

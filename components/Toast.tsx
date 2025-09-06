"use client";

import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import Emoji from "@/components/Emoji";

type Variant = "success" | "error" | "info" | "warning";

export type ToastInput = {
  title?: string;
  description?: string;
  variant?: Variant;
  duration?: number; // ms
  actionLabel?: string;
  onAction?: () => void;
};

type ToastItem = Required<ToastInput> & { id: string };

type ToastCtx = {
  toast: (t: ToastInput) => string;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider />");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tid = timers.current.get(id);
    if (tid) {
      window.clearTimeout(tid);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (t: ToastInput) => {
      const id = crypto.randomUUID();
      const item: ToastItem = {
        id,
        title: t.title ?? "",
        description: t.description ?? "",
        variant: t.variant ?? "info",
        duration: t.duration ?? 3500,
        actionLabel: t.actionLabel ?? "",
        onAction: t.onAction ?? (() => {}),
      };
      setToasts((prev) => [item, ...prev]);

      const tid = window.setTimeout(() => dismiss(id), item.duration);
      timers.current.set(id, tid);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <Ctx.Provider value={value}>
      {children}

      {/* Viewport */}
      <div
        className="
          pointer-events-none fixed z-[80]
          inset-x-4 bottom-4 mx-auto max-w-md
          md:inset-auto md:right-6 md:bottom-6 md:left-auto md:max-w-sm
          space-y-3
        "
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} t={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </Ctx.Provider>
  );
}

function ToastCard({ t, onClose }: { t: ToastItem; onClose: () => void }) {
  const stylesByVariant: Record<Variant, string> = {
    success:
      "border-[color-mix(in_oklab,var(--color-brand-primary)_30%,#0ea5e9_0%)]",
    error: "border-red-300",
    info: "border-[var(--color-brand-border)]",
    warning: "border-amber-300",
  };

  const iconByVariant: Record<Variant, React.ReactNode> = {
    success: <Emoji name="ok" size={18} />,
    error: <Emoji name="error" size={18} />,
    info: <Emoji name="info" size={18} />,
    warning: <Emoji name="alerta" size={18} />,
  };

  return (
    <div
      className={`
        pointer-events-auto overflow-hidden
        rounded-2xl border ${stylesByVariant[t.variant]}
        bg-white/95 shadow-[0_10px_30px_rgba(0,0,0,0.10)]
        backdrop-blur-sm
        transition-transform duration-300 ease-out
        animate-[toastIn_220ms_ease-out]
      `}
      style={{
        // animación CSS inline (fallback si no existe keyframes globales)
        ['--tw-enter' as any]: "translateY(8px)",
      }}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="shrink-0 mt-[2px]">{iconByVariant[t.variant]}</div>
        <div className="min-w-0 flex-1">
          {t.title ? (
            <div className="text-[15px] font-medium text-[var(--color-brand-text)]">
              {t.title}
            </div>
          ) : null}
          {t.description ? (
            <div className="text-[13px] text-[var(--color-brand-bluegray)]">
              {t.description}
            </div>
          ) : null}
          {t.actionLabel ? (
            <button
              type="button"
              onClick={t.onAction}
              className="
                mt-2 inline-flex items-center gap-1 text-[13px]
                text-[var(--color-brand-primary)] hover:underline
              "
            >
              {t.actionLabel}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="
            ml-1 rounded-xl px-2 py-1 text-[12px]
            bg-[var(--color-brand-background)] text-[var(--color-brand-text)]
            hover:brightness-95
          "
          aria-label="Cerrar notificación"
          title="Cerrar"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

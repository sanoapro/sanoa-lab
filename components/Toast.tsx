"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import ColorEmoji from "@/components/ColorEmoji";

type ToastVariant = "success" | "error" | "info" | "warning";

type ToastOptions = {
  variant?: ToastVariant;
  title?: string;
  description?: string;
  emoji?: string;
  duration?: number; // ms (default 3500)
};

type ToastItem = {
  id: string;
  opts: Required<ToastOptions>;
};

type ToastContextValue = {
  toast: (opts: ToastOptions) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de <ToastProvider />");
  }
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef<Record<string, any>>({});
  const [mounted, setMounted] = useState(false);
  const [container, setContainer] = useState<HTMLElement | null>(null);

  // Solo en cliente: habilitamos portal y resolvemos el contenedor
  useEffect(() => {
    setMounted(true);
    setContainer(document.getElementById("toast-root") ?? document.body);
    return () => {
      // limpiar timers al desmontar
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const toast = useCallback(
    (opts: ToastOptions) => {
      const id = Math.random().toString(36).slice(2);
      const item: ToastItem = {
        id,
        opts: {
          variant: opts.variant ?? "info",
          title: opts.title ?? "",
          description: opts.description ?? "",
          emoji: opts.emoji ?? "ℹ️",
          duration: opts.duration ?? 3500,
        },
      };
      setToasts((prev) => [item, ...prev]);
      timers.current[id] = setTimeout(() => remove(id), item.opts.duration);
    },
    [remove],
  );

  const value = useMemo(() => ({ toast }), [toast]);

  // Render del portal solo cuando hay DOM disponible
  const portal =
    mounted && container
      ? createPortal(
          <div
            className="
              pointer-events-none fixed inset-0 z-[9999] flex flex-col items-end gap-2
              p-4 sm:p-6
            "
          >
            {/* anclamos arriba a la derecha */}
            <div className="ml-auto w-full max-w-sm space-y-2">
              {toasts.map(({ id, opts }) => (
                <div
                  key={id}
                  className={`
                    pointer-events-auto rounded-2xl border p-4 shadow-[0_10px_30px_rgba(0,0,0,0.10)]
                    bg-white/95 backdrop-blur
                    animate-in fade-in zoom-in-95 duration-200
                    ${
                      {
                        success: "border-green-200",
                        error: "border-red-200",
                        info: "border-[var(--color-brand-border)]",
                        warning: "border-yellow-200",
                      }[opts.variant]
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 grid place-content-center rounded-xl border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                      {/* Mantén flexible: puedes forzar nativo si quieres colores originales */}
                      <ColorEmoji
                        emoji={opts.emoji}
                        mode={opts.variant === "error" ? "native" : "duotone"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {opts.title && (
                        <p className="font-semibold text-[var(--color-brand-text)] truncate">
                          {opts.title}
                        </p>
                      )}
                      {opts.description && (
                        <p className="text-sm text-[var(--color-brand-bluegray)]">
                          {opts.description}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(id)}
                      className="
                        ml-1 inline-flex h-8 w-8 items-center justify-center rounded-xl
                        hover:bg-[var(--color-brand-background)]
                        text-[var(--color-brand-text)]
                      "
                      title="Cerrar"
                    >
                      <span className="sr-only">Cerrar</span>✖️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>,
          container,
        )
      : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {portal}
    </ToastContext.Provider>
  );
}

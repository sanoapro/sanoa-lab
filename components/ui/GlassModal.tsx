// components/ui/GlassModal.tsx
"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  open: boolean;
  /** Se llama al cerrar por overlay, botón o Escape */
  onClose?: () => void;
  /** Notifica cambio explícito de estado de apertura */
  onOpenChange?: (open: boolean) => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  size?: Size;
  className?: string;
};

const sizeMap: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-2xl", // combina el tamaño más amplio del otro branch
  lg: "max-w-4xl",
  xl: "max-w-5xl",
};

export default function GlassModal({
  open,
  onClose,
  onOpenChange,
  title,
  footer,
  children,
  size = "md",
  className,
}: Props) {
  const close = () => {
    onClose?.();
    onOpenChange?.(false);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    // Evitar scroll del body mientras el modal esté abierto
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-md"
        onClick={close}
        aria-hidden
      />

      {/* Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className="relative z-[121] flex w-full justify-center"
      >
        <div className={cn("glass-card bubble w-full border border-white/20", sizeMap[size], className)}>
          {/* Header */}
          {(title || onClose) ? (
            <div className="flex items-center justify-between border-b border-white/20 px-5 py-4 text-contrast">
              {title ? <div className="text-lg font-semibold">{title}</div> : <span />}
              {onClose ? (
                <button type="button" className="glass-btn" onClick={close} aria-label="Cerrar">
                  ✖
                </button>
              ) : null}
            </div>
          ) : null}

          {/* Body */}
          <div className="px-5 py-4 space-y-4 text-contrast">{children}</div>

          {/* Footer */}
          {footer ? (
            <div className="border-t border-white/20 bg-white/40 px-5 py-3 backdrop-blur text-contrast">
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

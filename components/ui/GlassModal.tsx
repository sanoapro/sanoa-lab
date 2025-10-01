// components/ui/GlassModal.tsx
"use client";

import { ReactNode, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Card } from "./card";

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
  const close = useCallback(() => {
    onClose?.();
    onOpenChange?.(false);
  }, [onClose, onOpenChange]);

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
  }, [close, open]);

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
        <Card className={cn("w-full space-y-0", sizeMap[size], className)}>
          {/* Header */}
          {(title || onClose) ? (
            <header className="flex items-center justify-between border-b border-border/60 px-6 py-4">
              {title ? <div className="text-lg font-semibold leading-tight">{title}</div> : <span />}
              {onClose ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full"
                  onClick={close}
                  aria-label="Cerrar"
                >
                  ✖
                </Button>
              ) : null}
            </header>
          ) : null}

          {/* Body */}
          <div className="px-6 py-5 text-foreground">{children}</div>

          {/* Footer */}
          {footer ? <footer className="border-t border-border/60 px-6 py-4">{footer}</footer> : null}
        </Card>
      </div>
    </div>
  );
}

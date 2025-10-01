// components/Modal.tsx
"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  if (!open) return null;

  const sizes = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-3xl",
    xl: "max-w-5xl",
  };

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className={cn(
          "relative w-full rounded-xl bg-card text-card-foreground shadow-elevated border border-border",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || onClose) && (
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h3 className="text-lg font-bold">{title}</h3>
            <button aria-label="Cerrar" onClick={onClose} className="btn-base ghost">
              ✕
            </button>
          </div>
        )}
        <div className="p-4">{children}</div>
        {footer && <div className="p-4 border-t border-border flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

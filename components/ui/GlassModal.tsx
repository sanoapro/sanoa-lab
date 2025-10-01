"use client";
import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
};

const sizes = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
};

export default function GlassModal({ open, onClose, title, footer, size = "md", children }: Props) {
  useEffect(() => {
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} glass-card bubble`}>
        {title ? (
          <div className="flex items-center justify-between mb-3">
            <div className="text-xl font-semibold">{title}</div>
            <button className="glass-btn" onClick={onClose}>
              ✖
            </button>
          </div>
        ) : null}
        <div className="space-y-3">{children}</div>
        {footer ? <div className="mt-4 pt-3 border-t border-white/10">{footer}</div> : null}
      </div>
    </div>
  );
}

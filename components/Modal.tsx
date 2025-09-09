"use client";
import { ReactNode, useEffect } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string; // ej. "max-w-lg"
};

export default function Modal({ open, onClose, title, children, footer, widthClass="max-w-lg" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onEsc);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className={`w-full ${widthClass} rounded-2xl border border-[var(--color-brand-border)] bg-white shadow-xl`}>
          {title && (
            <div className="px-5 py-4 border-b border-[var(--color-brand-border)]">
              <h3 className="text-[var(--color-brand-text)] font-semibold">{title}</h3>
            </div>
          )}
          <div className="px-5 py-4">{children}</div>
          {footer && (
            <div className="px-5 py-3 border-t border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
              <div className="flex justify-end gap-2">{footer}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

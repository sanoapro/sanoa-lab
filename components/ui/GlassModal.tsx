"use client";
import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

type Props = {
  open: boolean;
  onClose?: () => void;
  onOpenChange?: (_open: boolean) => void;
  title?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  size?: Size;
  className?: string;
};

const sizeMap: Record<Size, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-3xl",
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={close} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === "string" ? title : undefined}
        className="relative z-[121] flex w-full justify-center"
      >
        <div className={cn("glass-card bubble w-full border border-white/20", sizeMap[size], className)}>
          {title ? (
            <div className="border-b border-white/20 px-5 py-4 text-lg font-semibold text-contrast flex items-center gap-2">
              {title}
            </div>
          ) : null}
          <div className="px-5 py-4 space-y-4 text-contrast">{children}</div>
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

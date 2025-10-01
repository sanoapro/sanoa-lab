"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type EmptyStateProps = {
  emoji: string;
  title: string;
  hint?: string;
  ctaText?: string;
  onCta?: () => void;
  className?: string;
  children?: ReactNode;
};

export default function EmptyState({
  emoji,
  title,
  hint,
  ctaText,
  onCta,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "glass-card bubble flex w-full flex-col items-center gap-4 p-6 text-center sm:p-8",
        className,
      )}
    >
      <div className="text-3xl">
        <span className="emoji" aria-hidden>
          {emoji}
        </span>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-contrast sm:text-2xl">{title}</h2>
        {hint ? <p className="text-[15px] text-contrast/80 sm:text-base">{hint}</p> : null}
      </div>
      {ctaText && onCta ? (
        <button
          type="button"
          onClick={onCta}
          className="glass-btn bubble text-base font-semibold text-slate-700 transition-shadow hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-100 dark:focus-visible:ring-offset-slate-900"
        >
          {ctaText}
        </button>
      ) : null}
      {children ? <div className="w-full max-w-md space-y-3 text-left sm:text-center">{children}</div> : null}
    </div>
  );
}

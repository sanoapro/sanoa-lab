"use client";

import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export default function UiCard({ children, className = "" }: Props) {
  return (
    <section
      className={`
        w-full max-w-3xl rounded-3xl
        bg-white/95 border border-[var(--color-brand-border)]
        shadow-[0_10px_30px_rgba(0,0,0,0.06)]
        backdrop-blur-sm overflow-hidden
        ${className}
      `}
    >
      {children}
    </section>
  );
}

"use client";

import * as React from "react";

/** Simple wrapper para entrada suave (accesible; respeta prefers-reduced-motion) */
export default function AnimateIn({
  children,
  delay = 0,
  className = "",
}: React.PropsWithChildren<{ delay?: number; className?: string }>) {
  return (
    <div
      className={[
        "will-change-transform opacity-0 translate-y-2",
        "motion-safe:animate-[fadeInUp_300ms_ease-out_forwards]",
        className,
      ].join(" ")}
      style={{ animationDelay: `${Math.max(0, delay)}ms` }}
    >
      {children}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .motion-safe\\:animate-\\[fadeInUp_300ms_ease-out_forwards\\] {
            animation: none !important;
            opacity: 1 !important;
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}

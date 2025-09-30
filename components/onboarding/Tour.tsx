"use client";

import * as React from "react";
import { TourStep, useTour } from "./useTour";

export default function Tour({ steps }: { steps: TourStep[] }) {
  const { open, current, index, total, next, prev, finish } = useTour(steps);

  if (!open || !current) return null;

  // Posicionamiento básico cerca del selector (si existe)
  let style: React.CSSProperties = { inset: "auto 1rem 1rem auto" };
  try {
    if (current.selector) {
      const el = document.querySelector(current.selector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        style = {
          position: "fixed",
          left: Math.max(16, r.left),
          top: Math.max(16, r.bottom + 8),
          right: "auto",
          bottom: "auto",
          maxWidth: "min(360px, 90vw)",
          zIndex: 60,
        };
      }
    }
  } catch {
    /* noop */
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-50" aria-hidden />

      {/* Tarjeta */}
      <div
        className="fixed z-60 rounded-2xl border bg-white dark:bg-slate-900 p-4 shadow-lg max-w-sm"
        style={style}
        role="dialog"
        aria-modal="true"
        aria-label="Tour de inicio"
      >
        <p className="text-xs text-slate-500">
          {index + 1} / {total}
        </p>
        <h3 className="mt-1 font-semibold">{current.title}</h3>
        <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{current.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={prev}
              className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
              disabled={index === 0}
            >
              Anterior
            </button>
            <button
              onClick={next}
              className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm"
            >
              Siguiente
            </button>
          </div>
          <button
            onClick={finish}
            className="px-2 py-1 rounded-lg text-xs text-slate-600 underline"
          >
            Omitir
          </button>
        </div>
      </div>
    </>
  );
}

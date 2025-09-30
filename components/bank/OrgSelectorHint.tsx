"use client";

import Link from "next/link";
import ColorEmoji from "@/components/ColorEmoji";

export default function OrgSelectorHint() {
  return (
    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 text-amber-800 shadow-sm dark:border-amber-300/50 dark:bg-amber-500/15 dark:text-amber-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-base font-medium">
          <ColorEmoji token="laboratorio" className="text-xl" />
          Selecciona una organización activa para continuar.
        </div>
        <Link
          href="/organizaciones"
          className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white/90 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-white dark:border-amber-200/40 dark:bg-slate-900/40 dark:text-amber-50 dark:hover:bg-slate-900/60"
        >
          <ColorEmoji token="carpeta" className="text-lg" /> Abrir selector
        </Link>
      </div>
      <p className="mt-2 text-xs text-amber-700/80 dark:text-amber-100/70">
        También puedes cambiarla desde el selector flotante en la parte superior derecha.
      </p>
    </div>
  );
}

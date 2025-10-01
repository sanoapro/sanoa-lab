"use client";

import * as React from "react";
import Link from "next/link";
import { useModuleAccess } from "./useModuleAccess";

export default function ModuleGate({
  featureKey,
  children,
  className = "",
}: React.PropsWithChildren<{ featureKey: string; className?: string }>) {
  const { loading, locked, bankReady } = useModuleAccess(featureKey);

  return (
    <div className={["relative", className].join(" ")}>
      <div className={locked ? "pointer-events-none select-none blur-[1.5px] opacity-80" : ""}>
        {children}
      </div>

      {!loading && locked && (
        <>
          <div
            className="absolute inset-0 rounded-3xl bg-white/60 dark:bg-slate-900/50 backdrop-blur-[2px]"
            aria-hidden
          />
          <div className="absolute inset-x-0 top-[35%] flex justify-center px-4">
            <div className="rounded-2xl border bg-white/95 dark:bg-slate-900 p-4 shadow max-w-md w-full text-center">
              <div className="mb-2 flex justify-center">
                <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-amber-800">
                  Estado: Bloqueada
                </span>
              </div>
              <h4 className="font-semibold text-lg text-[var(--color-brand-text)] dark:text-white">
                Módulo Pro bloqueado
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                {bankReady
                  ? "Desbloquea este módulo desde Sanoa Bank para empezar a usar sus funciones."
                  : "Configura Sanoa Bank para habilitar los módulos Pro y gestionar accesos."}
              </p>
              <div className="mt-3 flex justify-center">
                <Link
                  href="/banco"
                  className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400 bg-emerald-300 px-5 py-2 font-semibold text-emerald-950 shadow-[0_0_18px_rgba(52,211,153,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_0_26px_rgba(52,211,153,0.75)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
                >
                  Desbloquear con Sanoa Bank
                </Link>
              </div>
              {!bankReady && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Tip: configura tu cuenta bancaria primero para que podamos activar los módulos automáticamente.
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

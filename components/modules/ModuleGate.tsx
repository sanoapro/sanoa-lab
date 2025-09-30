"use client";

import * as React from "react";
import Link from "next/link";
import { useModuleAccess } from "./useModuleAccess";

export default function ModuleGate({
  featureKey,
  children,
  className = "",
}: React.PropsWithChildren<{ featureKey: string; className?: string }>) {
  const { loading, locked } = useModuleAccess(featureKey);

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
              <h4 className="font-semibold">Módulo Pro bloqueado</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Desbloquea este módulo desde Sanoa Bank para empezar a usar sus funciones.
              </p>
              <div className="mt-3 flex justify-center">
                <Link
                  href="/banco"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white"
                >
                  Desbloquear con Sanoa Bank
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

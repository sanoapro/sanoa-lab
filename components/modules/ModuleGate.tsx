"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

import { useModuleAccess } from "./useModuleAccess";

export default function ModuleGate({
  featureKey,
  children,
  className = "",
}: React.PropsWithChildren<{ featureKey: string; className?: string }>) {
  const { loading, locked } = useModuleAccess(featureKey);

  return (
    <div className={["relative", className].join(" ")}>
      <div className={locked ? "pointer-events-none select-none opacity-40" : ""}>{children}</div>

      {!loading && locked && (
        <>
          <div className="absolute inset-0 rounded-3xl bg-white/75 dark:bg-slate-950/70" aria-hidden />
          <div className="absolute inset-x-0 top-[35%] flex justify-center px-4">
            <div className="rounded-2xl border border-amber-200 bg-white/95 dark:bg-slate-900 p-5 shadow max-w-md w-full text-center space-y-3">
              <div className="flex justify-center">
                <span className="text-xs px-3 py-1 rounded-full border border-amber-200 bg-amber-100 text-amber-800 font-medium">
                  Bloqueada
                </span>
              </div>
              <h4 className="font-semibold">Módulo Pro bloqueado</h4>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Desbloquea este módulo desde Sanoa Bank para empezar a usar sus funciones.
              </p>
              <div className="pt-1">
                <Button
                  asChild
                  className="w-full bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-500/90 hover:shadow-[0_0_24px_rgba(16,185,129,0.85)]"
                >
                  <Link href="/banco">Desbloquear con Sanoa Bank</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

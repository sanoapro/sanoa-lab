"use client";

import * as React from "react";
import Link from "next/link";

import AccentHeader from "@/components/ui/AccentHeader";
import AnimateIn from "@/components/ui/AnimateIn";
import ColorEmoji from "@/components/ColorEmoji";
import { Button } from "@/components/ui/button";

type Area = { href: string; name: string; desc: string; token: string; featureKey: string };

const AREAS: Area[] = [
  {
    href: "/modulos/mente",
    name: "Mente",
    desc: "Evaluaciones, escalas y planes de apoyo.",
    token: "mente",
    featureKey: "mente",
  },
  {
    href: "/modulos/pulso",
    name: "Pulso",
    desc: "Indicadores clínicos, semáforos y riesgo CV.",
    token: "pulso",
    featureKey: "pulso",
  },
  {
    href: "/modulos/equilibrio",
    name: "Equilibrio",
    desc: "Planes de hábitos y seguimiento.",
    token: "equilibrio",
    featureKey: "equilibrio",
  },
  {
    href: "/modulos/sonrisa",
    name: "Sonrisa",
    desc: "Odontograma, presupuestos y firma.",
    token: "sonrisa",
    featureKey: "sonrisa",
  },
];

type SubStatus = {
  ok: boolean;
  data?: {
    active?: boolean;
    modules?: Record<string, boolean>;
    bankReady?: boolean;
    bank_ready?: boolean;
  };
};

export default function EspecialidadesPage() {
  const [status, setStatus] = React.useState<SubStatus | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/billing/subscription/status", { cache: "no-store" });
        const j = (await r.json()) as SubStatus;
        if (!cancelled) setStatus(j);
      } catch {
        if (!cancelled) {
          setStatus({ ok: true, data: { active: false, modules: {} } });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const modules = status?.data?.modules || {};
  const subActive = !!status?.data?.active;
  const bankReadyValue = status?.data?.bankReady ?? status?.data?.bank_ready;
  const bankReady = bankReadyValue === undefined ? undefined : !!bankReadyValue;

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AnimateIn>
        <AccentHeader
          title="Especialidades Pro"
          subtitle="Activa herramientas avanzadas para tu equipo desde Sanoa Bank."
          emojiToken="carpeta"
        />
      </AnimateIn>

      {bankReady === false && (
        <AnimateIn>
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">Configura Sanoa Bank para desbloquear especialidades.</p>
              <p className="text-sm text-amber-700 mt-1">
                Completa la configuración de Bank y asígnale saldo para activar tus módulos Pro.
              </p>
            </div>
            <Button
              asChild
              className="bg-amber-500 text-white shadow-[0_0_18px_rgba(245,158,11,0.65)] hover:bg-amber-500/90 hover:shadow-[0_0_24px_rgba(245,158,11,0.8)]"
            >
              <Link href="/banco">Ir a Sanoa Bank</Link>
            </Button>
          </div>
        </AnimateIn>
      )}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {AREAS.map((a: any, idx: any) => {
          const enabled = !!modules[a.featureKey];
          const locked = !(subActive && enabled);
          const statusLabel = locked ? "Bloqueada" : "Activa";
          const statusClasses = locked
            ? "bg-amber-100 text-amber-800 border border-amber-200"
            : "bg-emerald-100 text-emerald-800 border border-emerald-200";

          return (
            <AnimateIn key={a.href} delay={idx * 40}>
              <div className="relative rounded-3xl border bg-white/95 p-6 transition hover:shadow-sm">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-2xl border inline-grid place-content-center">
                    <ColorEmoji token={a.token} />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {a.name}
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">
                        Pro
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusClasses}`}>
                        {statusLabel}
                      </span>
                    </h3>
                    <p className="text-sm text-slate-600">{a.desc}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-3">
                  <div className="flex gap-2">
                    {locked ? (
                      <Button variant="outline" className="grow" disabled>
                        Ver módulo
                      </Button>
                    ) : (
                      <Button asChild variant="outline" className="grow">
                        <Link href={a.href}>Ver módulo</Link>
                      </Button>
                    )}
                    {locked && (
                      <Button
                        asChild
                        className="bg-emerald-500 text-white shadow-[0_0_18px_rgba(16,185,129,0.7)] hover:bg-emerald-500/90 hover:shadow-[0_0_24px_rgba(16,185,129,0.85)]"
                      >
                        <Link href="/banco">Desbloquear con Sanoa Bank</Link>
                      </Button>
                    )}
                  </div>
                  <p className={`text-xs ${locked ? "text-amber-600" : "text-emerald-600"}`}>
                    {locked
                      ? "Especialidad bloqueada. Asigna saldo desde Sanoa Bank para activarla."
                      : "Especialidad activa para tu organización."}
                  </p>
                </div>
              </div>
            </AnimateIn>
          );
        })}
      </section>
    </main>
  );
}

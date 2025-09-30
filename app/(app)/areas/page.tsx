// app/(app)/areas/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import AnimateIn from "@/components/ui/AnimateIn";

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
    active: boolean;
    modules?: Record<string, boolean>; // p.ej. { mente:true, pulso:false, ... }
  };
};

export default function AreasProPage() {
  const [status, setStatus] = React.useState<SubStatus | null>(null);

  React.useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/billing/subscription/status", { cache: "no-store" });
        const j = await r.json();
        setStatus(j);
      } catch {
        setStatus({ ok: true, data: { active: false, modules: {} } });
      }
    })();
  }, []);

  const modules = status?.data?.modules || {};
  const subActive = !!status?.data?.active;

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AnimateIn>
        <AccentHeader
          title="Áreas Pro"
          subtitle="Especialidades con herramientas avanzadas. Desbloquea desde Sanoa Bank."
          emojiToken="carpeta"
        />
      </AnimateIn>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {AREAS.map((a, idx) => {
          const enabled = !!modules[a.featureKey];
          const locked = !(subActive && enabled);
          return (
            <AnimateIn key={a.href} delay={idx * 40}>
              <div className="relative rounded-3xl border bg-white/95 p-6 transition hover:shadow-sm">
                <div className="flex gap-3">
                  <div className="h-12 w-12 rounded-2xl border inline-grid place-content-center">
                    <ColorEmoji token={a.token} />
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {a.name}{" "}
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">
                        Pro
                      </span>
                    </h3>
                    <p className="text-sm text-slate-600">{a.desc}</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Link
                    href={a.href}
                    className={[
                      "px-3 py-2 rounded-xl border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
                      locked ? "opacity-60 cursor-not-allowed" : "",
                    ].join(" ")}
                    onClick={(e) => {
                      if (locked) e.preventDefault();
                    }}
                    aria-disabled={locked}
                  >
                    Ver módulo
                  </Link>
                  {locked && (
                    <Link href="/banco" className="px-3 py-2 rounded-xl bg-amber-500 text-white">
                      Desbloquear con Sanoa Bank
                    </Link>
                  )}
                </div>

                {locked && (
                  <div
                    className="absolute inset-0 rounded-3xl bg-white/55 backdrop-blur-[1px] pointer-events-none transition"
                    aria-hidden
                  />
                )}
              </div>
            </AnimateIn>
          );
        })}
      </section>
    </main>
  );
}

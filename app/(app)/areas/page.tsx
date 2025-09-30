// app/(app)/areas/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";

type Area = { href: string; name: string; desc: string; token: string; };

const AREAS: Area[] = [
  { href: "/modulos/mente", name: "Mente", desc: "Evaluaciones, escalas y planes de apoyo.", token: "mente" },
  { href: "/modulos/pulso", name: "Pulso", desc: "Indicadores clínicos, semáforos y riesgo CV.", token: "pulso" },
  { href: "/modulos/equilibrio", name: "Equilibrio", desc: "Planes de hábitos y seguimiento.", token: "equilibrio" },
  { href: "/modulos/sonrisa", name: "Sonrisa", desc: "Odontograma, presupuestos y firma.", token: "sonrisa" },
];

export default function AreasProPage() {
  // En un futuro: consultar /api/billing/subscription/status para mostrar estado real.
  const hasPro = false;

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Áreas Pro"
        subtitle="Especialidades con herramientas avanzadas. Desbloquea desde Sanoa Bank."
        emojiToken="carpeta"
      />

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {AREAS.map((a) => (
          <div key={a.href} className="relative rounded-3xl border bg-white/95 p-6">
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-2xl border inline-grid place-content-center">
                <ColorEmoji token={a.token} />
              </div>
              <div>
                <h3 className="font-semibold">{a.name} <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">Pro</span></h3>
                <p className="text-sm text-slate-600">{a.desc}</p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Link href={a.href} className="px-3 py-2 rounded-xl border">Ver módulo</Link>
              {!hasPro && (
                <Link href="/banco" className="px-3 py-2 rounded-xl bg-amber-500 text-white">Desbloquear con Sanoa Bank</Link>
              )}
            </div>

            {!hasPro && (
              <div className="absolute inset-0 rounded-3xl bg-white/50 backdrop-blur-[1px] pointer-events-none" aria-hidden />
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

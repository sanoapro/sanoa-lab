"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";

const CARDS = [
  {
    href: "/modulos/mente",
    name: "Mente",
    desc: "Evaluaciones, escalas y planes.",
    token: "mente",
  },
  {
    href: "/modulos/pulso",
    name: "Pulso",
    desc: "Semáforos, cálculos y riesgo CV.",
    token: "pulso",
  },
  {
    href: "/modulos/equilibrio",
    name: "Equilibrio",
    desc: "Hábitos y seguimiento.",
    token: "equilibrio",
  },
  {
    href: "/modulos/sonrisa",
    name: "Sonrisa",
    desc: "Odontograma y presupuestos.",
    token: "sonrisa",
  },
];

export default function ModulosHubPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Especialidades Pro"
        subtitle="Elige la especialidad que quieres explorar."
        emojiToken="carpeta"
      />
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {CARDS.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-3xl border bg-white/95 p-6 block hover:shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <div className="flex gap-3">
              <div className="h-12 w-12 rounded-2xl border inline-grid place-content-center">
                <ColorEmoji token={c.token} />
              </div>
              <div>
                <h3 className="font-semibold">
                  {c.name}{" "}
                  <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-300">
                    Pro
                  </span>
                </h3>
                <p className="text-sm text-slate-600">{c.desc}</p>
              </div>
            </div>
            <div className="mt-4 text-sm text-blue-600">Abrir →</div>
          </Link>
        ))}
      </section>
    </main>
  );
}

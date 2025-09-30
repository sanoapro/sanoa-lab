"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ModuleGate from "@/components/modules/ModuleGate";
import StarterTips from "@/components/modules/StarterTips";

export default function EquilibrioPage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Equilibrio"
        subtitle="Planes de hábitos, tareas y seguimiento."
        emojiToken="equilibrio"
      />

      <ModuleGate featureKey="equilibrio" className="space-y-6">
        <section className="rounded-3xl border bg-white/95 p-6">
          <h3 className="font-semibold">Acciones rápidas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/modulos/equilibrio/planes/nuevo" className="px-3 py-2 rounded-xl border">
              Nuevo plan de hábitos
            </Link>
            <Link href="/recordatorios/plantillas" className="px-3 py-2 rounded-xl border">
              Tareas programadas
            </Link>
            <Link href="/reportes/overview" className="px-3 py-2 rounded-xl border">
              Panel longitudinal
            </Link>
          </div>
        </section>

        <StarterTips
          tips={[
            "Crea plantillas de planes reutilizables por especialidad.",
            "Mide adherencia con confirmaciones por WhatsApp.",
            "Configura alertas cuando la adherencia baje del 60%.",
          ]}
          actions={[
            { href: "/recordatorios", label: "Notificaciones" },
            { href: "/reportes/confirmaciones", label: "Adherencia" },
          ]}
        />
      </ModuleGate>
    </main>
  );
}

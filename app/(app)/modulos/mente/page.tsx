"use client";

import * as React from "react";
import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ColorEmoji from "@/components/ColorEmoji";
import ModuleGate from "@/components/modules/ModuleGate";
import StarterTips from "@/components/modules/StarterTips";

export default function MentePage() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Mente"
        subtitle="Evaluaciones (PHQ-9, GAD-7), seguimiento y planes."
        emojiToken="mente"
      />

      <ModuleGate featureKey="mente" className="space-y-6">
        {/* Acciones rápidas */}
        <section className="rounded-3xl border bg-white/95 p-6">
          <h3 className="font-semibold">Acciones rápidas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/prescriptions/templates" className="px-3 py-2 rounded-xl border">
              <ColorEmoji token="recetas" /> Receta / Plantillas
            </Link>
            <Link href="/api/forms/templates" className="px-3 py-2 rounded-xl border">
              PHQ-9 / GAD-7
            </Link>
            <Link href="/recordatorios" className="px-3 py-2 rounded-xl border">
              Recordatorio post-cita
            </Link>
          </div>
        </section>

        {/* Primeros pasos */}
        <StarterTips
          tips={[
            "Crea plantillas de notas y recetas para acelerar tu consulta.",
            "Configura recordatorios de seguimiento a 7 y 30 días.",
            "Activa reportes semanales de adherencia desde Reportes › Programación.",
          ]}
          actions={[
            { href: "/reportes/programacion", label: "Programar reportes" },
            { href: "/recordatorios/plantillas", label: "Plantillas de recordatorios" },
          ]}
        />
      </ModuleGate>
    </main>
  );
}

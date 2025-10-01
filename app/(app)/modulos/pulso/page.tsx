"use client";

import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ModuleGate from "@/components/modules/ModuleGate";
import StatusBadge from "@/components/modules/StatusBadge";
import { useModuleAccess } from "@/components/modules/useModuleAccess";
import StarterTips from "@/components/modules/StarterTips";

export default function PulsoPage() {
  const { active, enabled } = useModuleAccess("pulso");
  const isActive = active && enabled;

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title={
          <span className="flex items-center gap-2">
            Pulso Pro
            <StatusBadge active={isActive} />
          </span>
        }
        subtitle="Indicadores clínicos, semáforos y riesgo cardiovascular."
        emojiToken="pulso"
      />

      <ModuleGate featureKey="pulso" className="space-y-6">
        <section className="rounded-3xl border bg-white/95 p-6">
          <h3 className="font-semibold">Acciones rápidas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/modulos/pulso/calculadoras/imc" className="px-3 py-2 rounded-xl border">
              IMC
            </Link>
            <Link href="/modulos/pulso/calculadoras/cvd" className="px-3 py-2 rounded-xl border">
              Riesgo CV
            </Link>
            <Link href="/reportes/rapidos" className="px-3 py-2 rounded-xl border">
              Semáforos (rápidos)
            </Link>
          </div>
        </section>

        <StarterTips
          tips={[
            "Define rangos de referencia por grupo etario en Ajustes del módulo.",
            "Activa alertas por valores críticos vía Recordatorios.",
            "Usa vistas guardadas de Pacientes para cohortes con riesgo alto.",
          ]}
          actions={[
            { href: "/saved-views", label: "Vistas guardadas" },
            { href: "/recordatorios", label: "Configurar alertas" },
          ]}
        />
      </ModuleGate>
    </main>
  );
}

"use client";

import Link from "next/link";
import AccentHeader from "@/components/ui/AccentHeader";
import ModuleGate from "@/components/modules/ModuleGate";
import StatusBadge from "@/components/modules/StatusBadge";
import { useModuleAccess } from "@/components/modules/useModuleAccess";
import StarterTips from "@/components/modules/StarterTips";

export default function SonrisaPage() {
  const { active, enabled } = useModuleAccess("sonrisa");
  const isActive = active && enabled;

  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title={
          <span className="flex items-center gap-2">
            Sonrisa Pro
            <StatusBadge active={isActive} />
          </span>
        }
        subtitle="Odontograma, presupuestos y documentos con firma."
        emojiToken="sonrisa"
      />

      <ModuleGate featureKey="sonrisa" className="space-y-6">
        <section className="rounded-3xl border bg-white/95 p-6">
          <h3 className="font-semibold">Acciones rápidas</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/modulos/sonrisa/odontograma/nuevo" className="px-3 py-2 rounded-xl border">
              Nuevo odontograma
            </Link>
            <Link
              href="/modulos/sonrisa/presupuestos/nuevo"
              className="px-3 py-2 rounded-xl border"
            >
              Nuevo presupuesto
            </Link>
            <Link href="/prescriptions/templates" className="px-3 py-2 rounded-xl border">
              Receta con membrete
            </Link>
          </div>
        </section>

        <StarterTips
          tips={[
            "Carga tu membrete y firma en Ajustes para documentos y recetas.",
            "Activa plantillas por procedimiento para agilizar presupuestos.",
            "Comparte PDF con enlaces firmados y expiración corta.",
          ]}
          actions={[
            { href: "/ajustes", label: "Subir membrete/firma" },
            { href: "/export/metrics/by-tag", label: "Top procedimientos" },
          ]}
        />
      </ModuleGate>
    </main>
  );
}

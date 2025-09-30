"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import AnimateIn from "@/components/ui/AnimateIn";
import PrescriptionEditor from "@/components/prescriptions/PrescriptionEditor";

export default function PrescriptionTemplatesPage() {
  return (
    <main className="space-y-8">
      <AnimateIn>
        <AccentHeader
          title="Plantillas de recetas"
          subtitle="Guarda combinaciones frecuentes y emite recetas listas para imprimir en segundos."
          emojiToken="recetas"
        />
      </AnimateIn>

      <AnimateIn delay={60}>
        <PrescriptionEditor />
      </AnimateIn>
    </main>
  );
}

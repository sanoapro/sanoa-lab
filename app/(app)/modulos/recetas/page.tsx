// app/(app)/modulos/recetas/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import PrescriptionEditor from "@/components/prescriptions/PrescriptionEditor";

export default function RecetasPage() {
  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Recetas médicas"
        subtitle="Crea recetas con membrete y firma, reutiliza plantillas y exporta a impresión."
        emojiToken="receta"
      />
      <PrescriptionEditor />
    </main>
  );
}

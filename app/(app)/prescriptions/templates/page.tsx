"use client";

import { RequireAuth } from "@/components/RequireAuth";
import AccentHeader from "@/components/ui/AccentHeader";
import PrescriptionEditor from "@/components/prescriptions/PrescriptionEditor";

export default function Page() {
  return (
    <RequireAuth>
      <main className="space-y-8">
        <AccentHeader
          title="Plantillas de recetas"
          subtitle="Guarda combinaciones frecuentes y emite recetas listas para imprimir en segundos."
          emojiToken="recetas"
        />
        <PrescriptionEditor />
      </main>
    </RequireAuth>
  );
}

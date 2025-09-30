// app/(app)/trabajo/templates/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import TemplatesEditor from "@/components/work/TemplatesEditor";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Plantillas de tareas"
        subtitle="Crea y reutiliza ejercicios por módulo para asignar a pacientes."
        emojiToken="carpeta"
      />
      <TemplatesEditor />
    </main>
  );
}

// app/(app)/trabajo/plantillas/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import TemplateEditor from "@/components/work/TemplateEditor";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Plantillas de ejercicios/tareas"
        subtitle="Crea y gestiona tu biblioteca por módulo."
        emojiToken="carpeta"
      />
      <TemplateEditor />
    </main>
  );
}

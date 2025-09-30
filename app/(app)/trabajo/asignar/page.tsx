// app/(app)/trabajo/asignar/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import AssignForm from "@/components/work/AssignForm";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader title="Asignar tarea o ejercicio" subtitle="Elige una plantilla o crea una asignación ad-hoc." emojiToken="trabajo" />
      <AssignForm />
    </main>
  );
}

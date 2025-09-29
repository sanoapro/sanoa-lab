// app/(app)/modulos/equilibrio/planes/page.tsx
"use client";
import AccentHeader from "@/components/ui/AccentHeader";
import PlanEditor from "@/components/equilibrio/PlanEditor";

export default function EquilibrioPlanesPage() {
  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Equilibrio — Plan semanal"
        subtitle="Asigna hábitos/tareas estructuradas por días de la semana y metas claras."
        emojiToken="equilibrio"
      />
      <PlanEditor />
    </main>
  );
}

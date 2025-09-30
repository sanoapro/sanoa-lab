// app/(app)/trabajo/asignaciones/page.tsx
"use client";

import AccentHeader from "@/components/ui/AccentHeader";
import AssignForm from "@/components/work/AssignForm";
import AssignmentsTable from "@/components/work/AssignmentsTable";

export default function Page() {
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Asignaciones a pacientes"
        subtitle="Asigna ejercicios y gestiona su estado."
        emojiToken="trabajo"
      />
      <AssignForm />
      <AssignmentsTable />
    </main>
  );
}

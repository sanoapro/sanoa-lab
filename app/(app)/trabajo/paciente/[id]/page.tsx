// app/(app)/trabajo/paciente/[id]/page.tsx
"use client";

import { useParams } from "next/navigation";
import AccentHeader from "@/components/ui/AccentHeader";
import PatientAssignments from "@/components/work/PatientAssignments";

export default function Page() {
  const params = useParams<{ id: string }>();
  const patientId = params?.id;
  return (
    <main className="p-6 md:p-10 space-y-8">
      <AccentHeader
        title="Tareas del paciente"
        subtitle="Seguimiento y acciones rápidas."
        emojiToken="trabajo"
      />
      {patientId ? <PatientAssignments patientId={patientId} /> : <p>Falta paciente</p>}
    </main>
  );
}

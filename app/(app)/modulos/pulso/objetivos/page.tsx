// app/(app)/modulos/pulso/objetivos/page.tsx
"use client";
import AccentHeader from "@/components/ui/AccentHeader";
import { useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import TargetsEditor from "@/components/pulso/TargetsEditor";

export default function PulsoObjetivosPage() {
  const org = useMemo(()=> getActiveOrg(), []);
  const orgId = org?.id || "";
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Pulso — Objetivos"
        subtitle="Define rangos objetivo personalizados por paciente y tipo de medición."
        emojiToken="ajustes"
      />
      <section className="rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold">Selecciona paciente</h3>
        {!orgId ? (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">Selecciona una organización activa.</p>
        ) : (
          <PatientAutocomplete orgId={orgId} scope="mine" onSelect={setPatient} placeholder="Buscar paciente…" />
        )}
        {patient && <div className="text-sm text-slate-600">Paciente: <strong>{patient.label}</strong></div>}
      </section>
      {orgId && patient?.id && <TargetsEditor orgId={orgId} patientId={patient.id} />}
    </main>
  );
}

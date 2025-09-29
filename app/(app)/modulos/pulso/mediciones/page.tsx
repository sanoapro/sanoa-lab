// app/(app)/modulos/pulso/mediciones/page.tsx
"use client";
import AccentHeader from "@/components/ui/AccentHeader";
import { useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import MeasurementForm from "@/components/pulso/MeasurementForm";
import MeasurementTable from "@/components/pulso/MeasurementTable";
import OverviewCards from "@/components/pulso/OverviewCards";

export default function PulsoMedicionesPage() {
  const org = useMemo(()=> getActiveOrg(), []);
  const orgId = org?.id || "";
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [refresh, setRefresh] = useState<number>(0);

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Pulso — Mediciones"
        subtitle="Captura y visualiza signos vitales y biomarcadores con objetivos por paciente."
        emojiToken="pulso"
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

      {orgId && patient?.id && (
        <>
          <OverviewCards orgId={orgId} patientId={patient.id} />
          <MeasurementForm orgId={orgId} patientId={patient.id} onSaved={()=> setRefresh(x=>x+1)} />
          <MeasurementTable orgId={orgId} patientId={patient.id} refreshToken={refresh} />
        </>
      )}
    </main>
  );
}

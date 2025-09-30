// app/(app)/modulos/sonrisa/presupuestos/page.tsx
"use client";
import AccentHeader from "@/components/ui/AccentHeader";
import BudgetEditor from "@/components/sonrisa/BudgetEditor";
import { useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import BudgetList from "@/components/sonrisa/BudgetList";

export default function SonrisaPresupuestosPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Sonrisa — Presupuestos"
        subtitle="Arma presupuestos por paciente, firma de aceptación y envío a pago."
        emojiToken="sonrisa"
      />

      <section className="rounded-2xl border p-4 space-y-3">
        <h3 className="font-semibold">Filtrar por paciente</h3>
        {!orgId ? (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Selecciona una organización activa.
          </p>
        ) : (
          <PatientAutocomplete
            orgId={orgId}
            scope="mine"
            onSelect={setPatient}
            placeholder="Buscar paciente…"
          />
        )}
        {patient && (
          <div className="text-sm text-slate-600">
            Paciente: <strong>{patient.label}</strong>
          </div>
        )}
      </section>

      {orgId && <BudgetList orgId={orgId} patientId={patient?.id || undefined} />}

      <BudgetEditor />
    </main>
  );
}

"use client";

import { useMemo, useState } from "react";
import AccentHeader from "@/components/ui/AccentHeader";
import ProviderSelect from "@/components/agenda/ProviderSelect";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import WeekGrid from "@/components/agenda/WeekGrid";
import { getActiveOrg } from "@/lib/org-local";

export default function AgendaSemanaPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  const [providerId, setProviderId] = useState<string>("");
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [tz, setTz] = useState<string>("America/Mexico_City");
  const [baseDate, setBaseDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  });

  function shiftDays(n: number) {
    const t = new Date(`${baseDate}T00:00:00`);
    const nx = new Date(t.getTime() + n * 86400000);
    setBaseDate(nx.toISOString().slice(0, 10));
  }

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Agenda semanal"
        subtitle="Visualiza disponibilidad, crea citas rápido y reprograma con chequeo de colisiones."
        emojiToken="agenda"
      />

      {!orgId && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa.
        </p>
      )}

      <section className="border rounded-2xl p-4 space-y-3 bg-white/80">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Profesional</label>
            <ProviderSelect value={providerId} onChange={setProviderId} />
          </div>
          <div>
            <label className="text-sm">Paciente</label>
            {orgId ? (
              <PatientAutocomplete
                orgId={orgId}
                scope="mine"
                onSelect={setPatient}
                placeholder="Buscar paciente…"
              />
            ) : (
              <input
                className="border rounded px-3 py-2 w-full"
                disabled
                placeholder="Selecciona una organización"
              />
            )}
            {patient && (
              <p className="text-xs text-slate-600 mt-1">
                Elegido: <strong>{patient.label}</strong>
              </p>
            )}
          </div>
          <div>
            <label className="text-sm">Zona horaria</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={tz}
              onChange={(e: any) => setTz(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm">Semana base</label>
          <input
            type="date"
            className="border rounded px-3 py-2"
            value={baseDate}
            onChange={(e: any) => setBaseDate(e.target.value)}
          />
          <div className="ml-auto flex items-center gap-2">
            <button className="border rounded px-3 py-2" onClick={() => shiftDays(-7)}>
              ← Anterior
            </button>
            <button className="border rounded px-3 py-2" onClick={() => shiftDays(7)}>
              Siguiente →
            </button>
          </div>
        </div>
      </section>

      {orgId && providerId ? (
        <WeekGrid
          orgId={orgId}
          providerId={providerId}
          tz={tz}
          baseDate={baseDate}
          patientId={patient?.id || null}
          defaultDurationMin={30}
        />
      ) : (
        <p className="text-slate-500">Completa profesional y organización para ver la agenda.</p>
      )}
    </main>
  );
}

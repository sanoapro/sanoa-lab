// components/agenda/AppointmentForm.tsx
"use client";
import { useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import SmartSlots from "./SmartSlots";

export default function AppointmentForm() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";

  const [providerId, setProviderId] = useState<string>("");
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);
  const [date, setDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [tz, setTz] = useState<string>("America/Mexico_City");
  const [duration, setDuration] = useState<number>(30);
  const [location, setLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [pendingIso, setPendingIso] = useState<string>("");

  async function save() {
    if (!orgId || !providerId || !patient?.id || !pendingIso) {
      alert("Faltan datos");
      return;
    }
    const r = await fetch("/api/agenda/appointments/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        org_id: orgId,
        provider_id: providerId,
        patient_id: patient.id,
        starts_at: pendingIso,
        duration_min: duration,
        tz,
        location: location || null,
        notes: notes || null,
        schedule_reminders: true,
      }),
    });
    const j = await r.json();
    if (!j.ok) {
      alert(j.error?.message ?? "Error");
      return;
    }
    alert("Cita creada ✅ con recordatorios programados");
    setPendingIso("");
  }

  return (
    <section className="space-y-6">
      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Datos básicos</h3>
        {!orgId && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
            Selecciona una organización activa.
          </p>
        )}
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Profesional (provider_id)</label>
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="uuid del profesional"
              value={providerId}
              onChange={(e: any) => setProviderId(e.target.value)}
            />
            <p className="text-xs text-slate-500 mt-1">
              En siguiente lote conectamos selector visual por profesional.
            </p>
          </div>
          <div>
            <label className="text-sm">Fecha</label>
            <input
              type="date"
              className="border rounded px-3 py-2 w-full"
              value={date}
              onChange={(e: any) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Zona horaria</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={tz}
              onChange={(e: any) => setTz(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm">Duración (min)</label>
            <input
              type="number"
              min={10}
              max={240}
              className="border rounded px-3 py-2 w-full"
              value={duration}
              onChange={(e: any) => setDuration(Number(e.target.value || 30))}
            />
          </div>
        </div>
      </div>

      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Paciente</h3>
        {orgId ? (
          <PatientAutocomplete
            orgId={orgId}
            scope="mine"
            onSelect={setPatient}
            placeholder="Buscar paciente…"
          />
        ) : null}
        {patient && (
          <div className="text-sm text-slate-600">
            Paciente: <strong>{patient.label}</strong>
          </div>
        )}
      </div>

      <SmartSlots
        orgId={orgId}
        providerId={providerId || "00000000-0000-0000-0000-000000000000"}
        date={date}
        tz={tz}
        duration={duration}
        patientId={patient?.id || null}
        onPick={(s: any) => setPendingIso(s.start_iso)}
      />

      <div className="border rounded-2xl p-4 space-y-3">
        <h3 className="font-semibold">Confirmación</h3>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm">Inicio seleccionado</label>
            <input className="border rounded px-3 py-2 w-full" value={pendingIso} readOnly />
          </div>
          <div>
            <label className="text-sm">Lugar</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={location}
              onChange={(e: any) => setLocation(e.target.value)}
              placeholder="Consultorio / Teleconsulta"
            />
          </div>
          <div>
            <label className="text-sm">Notas</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={notes}
              onChange={(e: any) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <button
          className="border rounded px-3 py-2"
          onClick={save}
          disabled={!pendingIso || !patient || !providerId}
        >
          Crear cita + recordatorios
        </button>
      </div>
    </section>
  );
}

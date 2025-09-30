"use client";
import AccentHeader from "@/components/ui/AccentHeader";
import { useMemo, useState } from "react";
import { getActiveOrg } from "@/lib/org-local";
import PatientAutocomplete from "@/components/patients/PatientAutocomplete";
import SimpleNote from "@/components/notes/SimpleNote";

function SessionsList({ orgId, patientId }: { orgId: string; patientId: string }) {
  const [rows, setRows] = useState<any[]>([]);
  async function load() {
    const p = new URLSearchParams({ org_id: orgId, patient_id: patientId });
    const r = await fetch(`/api/modules/mente/sessions/list?${p.toString()}`, {
      cache: "no-store",
    });
    const j = await r.json();
    setRows(j?.ok ? j.data : []);
  }
  return (
    <div className="border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Notas previas</h3>
        <button className="border rounded px-3 py-2" onClick={load}>
          Actualizar
        </button>
      </div>
      <div className="rounded border overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2">Fecha</th>
              <th className="text-left px-3 py-2">Firmada</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-3 py-2">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2">{r.signed_at ? "Sí" : "No"}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={2} className="px-3 py-6 text-center">
                  Sin notas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function MenteSesionesPage() {
  const org = useMemo(() => getActiveOrg(), []);
  const orgId = org?.id || "";
  const [patient, setPatient] = useState<{ id: string; label: string } | null>(null);

  return (
    <main className="p-6 md:p-10 space-y-6">
      <AccentHeader
        title="Mente — Sesiones"
        subtitle="Notas clínicas firmables por consulta."
        emojiToken="nota"
      />
      {!orgId ? (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3">
          Selecciona una organización activa.
        </p>
      ) : (
        <>
          <div className="rounded-2xl border p-4 space-y-3">
            <h3 className="font-semibold">Selecciona paciente</h3>
            <PatientAutocomplete orgId={orgId} scope="mine" onSelect={setPatient} />
            {patient && (
              <div className="text-sm text-slate-600">
                Paciente: <strong>{patient.label}</strong>
              </div>
            )}
          </div>
          {patient && (
            <>
              <SimpleNote
                orgId={orgId}
                patientId={patient.id}
                onSaved={() => {
                  /* opcional: toasts */
                }}
              />
              <SessionsList orgId={orgId} patientId={patient.id} />
            </>
          )}
        </>
      )}
    </main>
  );
}

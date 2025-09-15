"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getPatient, type Patient } from "@/lib/patients";
import { listNotes, type PatientNote } from "@/lib/patient-notes";
import { listAudit, type AuditEntry } from "@/lib/audit";
import { listPatientFiles, type PatientFile } from "@/lib/patient-files";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExportPDFButton from "@/components/ExportPDFButton";

export default function ExportAdvancedPage() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [files, setFiles] = useState<PatientFile[]>([]);

  // Opciones
  const [incPatient, setIncPatient] = useState(true);
  const [incNotes, setIncNotes] = useState(true);
  const [incFiles, setIncFiles] = useState(false);
  const [incAudit, setIncAudit] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const p = await getPatient(String(id));
        setPatient(p);
        const [n, a] = await Promise.all([
          listNotes(String(id)),
          listAudit(String(id)),
        ]);
        setNotes(n);
        setAudit(a);
        setFiles(await listPatientFiles(String(id)));
      } finally { setLoading(false); }
    }
    void load();
  }, [id]);

  function filteredNotes(): PatientNote[] {
    let arr = notes;
    if (from) arr = arr.filter(n => new Date(n.created_at) >= new Date(from + "T00:00:00"));
    if (to) arr = arr.filter(n => new Date(n.created_at) <= new Date(to + "T23:59:59"));
    return arr;
  }

  const pdfName = `Export-${(patient?.nombre || "Paciente").replace(/\s+/g,"_")}-${new Date().toISOString().slice(0,16).replace(/[:T]/g,"")}.pdf`;

  if (loading) return <div className="max-w-4xl mx-auto p-4">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Exportar PDF — {patient?.nombre}</h1>

      <div className="border rounded-xl p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={incPatient} onChange={(e)=>setIncPatient(e.target.checked)} /> Datos del paciente</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={incNotes} onChange={(e)=>setIncNotes(e.target.checked)} /> Notas</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={incFiles} onChange={(e)=>setIncFiles(e.target.checked)} /> Archivos (sólo listado)</label>
        <label className="text-sm flex items-center gap-2"><input type="checkbox" checked={incAudit} onChange={(e)=>setIncAudit(e.target.checked)} /> Actividad (auditoría)</label>
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div><span className="block text-sm text-gray-600">Notas desde</span><Input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} /></div>
          <div><span className="block text-sm text-gray-600">Notas hasta</span><Input type="date" value={to} onChange={(e)=>setTo(e.target.value)} /></div>
        </div>
      </div>

      <div ref={targetRef} className="bg-white rounded-xl p-6 space-y-6">
        {incPatient && (
          <section>
            <h2 className="text-xl font-semibold">Datos del paciente</h2>
            <div className="text-sm text-gray-700">
              <div><strong>Nombre:</strong> {patient?.nombre}</div>
              <div><strong>Edad:</strong> {patient?.edad ?? "—"}</div>
              <div><strong>Género:</strong> {patient?.genero}</div>
              <div><strong>ID:</strong> {patient?.id}</div>
            </div>
          </section>
        )}

        {incNotes && (
          <section>
            <h2 className="text-xl font-semibold">Notas</h2>
            {filteredNotes().length === 0 && <div className="text-sm text-gray-600">Sin notas en el rango.</div>}
            {filteredNotes().map(n => (
              <div key={n.id} className="border rounded-lg p-3 mb-2">
                <div className="text-sm text-gray-600">{new Date(n.created_at).toLocaleString()} · {n.titulo || "(Sin título)"}</div>
                {n.contenido && <pre className="whitespace-pre-wrap text-sm mt-1">{n.contenido}</pre>}
              </div>
            ))}
          </section>
        )}

        {incFiles && (
          <section>
            <h2 className="text-xl font-semibold">Archivos (listado)</h2>
            {files.length === 0 && <div className="text-sm text-gray-600">Sin archivos.</div>}
            {files.map(f => (
              <div key={f.path} className="text-sm text-gray-700">{f.name} · {Math.round((f.size as number)/1024)} KB · {new Date((f.updated_at || f.created_at) as string).toLocaleString()}</div>
            ))}
          </section>
        )}

        {incAudit && (
          <section>
            <h2 className="text-xl font-semibold">Actividad</h2>
            {audit.length === 0 && <div className="text-sm text-gray-600">Sin actividad.</div>}
            {audit.map(a => (<div key={a.id} className="text-sm">{a.created_at} · {a.action}</div>))}
          </section>
        )}
      </div>

      <div className="flex justify-end">
        <ExportPDFButton targetRef={targetRef} fileName={pdfName} />
      </div>
    </div>
  );
}
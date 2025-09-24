"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getPatient, type Patient } from "@/lib/patients";
import { listNotes, type PatientNote } from "@/lib/patient-notes";
import { listAudit, type AuditEntry } from "@/lib/audit";
import { listPatientFiles, type PatientFile } from "@/lib/patient-files";
import {
  listExportTemplates,
  createExportTemplate,
  deleteExportTemplate,
  type ExportTemplate,
} from "@/lib/export-templates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExportPDFButton from "@/components/ExportPDFButton";
import { showToast } from "@/components/Toaster";

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

  // Branding
  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [tplId, setTplId] = useState<string | "">("");
  const [tplName, setTplName] = useState("");
  const [tplTitle, setTplTitle] = useState("Informe clínico");
  const [tplSubtitle, setTplSubtitle] = useState("");
  const [tplLogo, setTplLogo] = useState("");
  const [tplColor, setTplColor] = useState("#D97A66");
  const [tplScope, setTplScope] = useState<"personal" | "org">("personal");

  const targetRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const p = await getPatient(String(id));
        setPatient(p);
        const [n, a, t] = await Promise.all([
          listNotes(String(id)),
          listAudit(String(id)),
          listExportTemplates(true),
        ]);
        setNotes(n);
        setAudit(a);
        setFiles(await listPatientFiles(String(id)));
        setTemplates(t);
        if (t.length) setTplId(t[0].id);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  function filteredNotes(): PatientNote[] {
    let arr = notes;
    if (from) arr = arr.filter((n) => new Date(n.created_at) >= new Date(from + "T00:00:00"));
    if (to) arr = arr.filter((n) => new Date(n.created_at) <= new Date(to + "T23:59:59"));
    return arr;
  }

  function activeTpl(): ExportTemplate | null {
    return templates.find((x) => x.id === tplId) ?? null;
  }

  async function createTpl() {
    if (!tplName.trim()) {
      showToast({ title: "Nombre requerido", description: "Escribe un nombre para la plantilla." });
      return;
    }
    try {
      const t = await createExportTemplate(
        tplName.trim(),
        tplTitle.trim(),
        tplSubtitle || null,
        tplLogo || null,
        tplColor || null,
        tplScope,
      );
      setTemplates([t, ...templates]);
      setTplId(t.id);
      setTplName("");
      showToast({ title: "Plantilla creada", description: "Disponible para tus exportaciones." });
    } catch (e: any) {
      showToast({ title: "No se pudo crear", description: e.message, variant: "destructive" });
    }
  }

  function Cover() {
    const t = activeTpl();
    if (!t) return null;
    const color = (t.brand_hex || "#D97A66").startsWith("#")
      ? t.brand_hex || "#D97A66"
      : `#${t.brand_hex}`;
    return (
      <section className="h-[70vh] min-h-[520px] flex flex-col items-center justify-center text-center relative">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}
        />
        {t.logo_url && <img src={t.logo_url} alt="Logo" className="h-16 mb-4" />}
        <h1 className="text-3xl font-semibold" style={{ color }}>
          {t.cover_title}
        </h1>
        <p className="mt-2 text-gray-700">{t.cover_subtitle ?? ""}</p>
        <div className="mt-8 text-sm text-gray-600">
          <div>
            <strong>Paciente:</strong> {patient?.nombre}
          </div>
          <div>
            <strong>Fecha:</strong> {new Date().toLocaleString()}
          </div>
        </div>
      </section>
    );
  }

  const pdfName = `Export-${(patient?.nombre || "Paciente").replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.pdf`;

  if (loading) return <div className="max-w-4xl mx-auto p-4">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Exportar PDF — {patient?.nombre}</h1>

      <div className="border rounded-xl p-4 bg-white grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={incPatient}
            onChange={(e) => setIncPatient(e.target.checked)}
          />{" "}
          Datos del paciente
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={incNotes}
            onChange={(e) => setIncNotes(e.target.checked)}
          />{" "}
          Notas
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={incFiles}
            onChange={(e) => setIncFiles(e.target.checked)}
          />{" "}
          Archivos (listado)
        </label>
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={incAudit}
            onChange={(e) => setIncAudit(e.target.checked)}
          />{" "}
          Actividad (auditoría)
        </label>
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="block text-sm text-gray-600">Notas desde</span>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <span className="block text-sm text-gray-600">Notas hasta</span>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Branding / Plantillas */}
      <div className="border rounded-xl p-4 bg-white space-y-3">
        <div className="font-medium">Plantilla de exportación (portada)</div>
        <div className="flex gap-2 items-center">
          <select
            className="border rounded-md px-3 py-2"
            value={tplId}
            onChange={(e) => setTplId(e.target.value)}
          >
            <option value="">(Sin portada)</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <Button
            variant="secondary"
            onClick={() => {
              if (!tplId) return;
              if (!confirm("¿Eliminar esta plantilla?")) return;
              void (async () => {
                await deleteExportTemplate(tplId);
                setTemplates(templates.filter((x) => x.id !== tplId));
                setTplId("");
              })();
            }}
            disabled={!tplId}
          >
            Borrar
          </Button>
        </div>

        <details className="rounded border p-3 bg-gray-50">
          <summary className="cursor-pointer">Crear nueva plantilla</summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Input
              placeholder="Nombre"
              value={tplName}
              onChange={(e) => setTplName(e.target.value)}
            />
            <select
              className="border rounded-md px-3 py-2"
              value={tplScope}
              onChange={(e) => setTplScope(e.target.value as any)}
            >
              <option value="personal">Personal</option>
              <option value="org">Organización activa</option>
            </select>
            <Input
              placeholder="Título de portada"
              value={tplTitle}
              onChange={(e) => setTplTitle(e.target.value)}
            />
            <Input
              placeholder="Subtítulo (opcional)"
              value={tplSubtitle}
              onChange={(e) => setTplSubtitle(e.target.value)}
            />
            <Input
              placeholder="Logo URL (opcional)"
              value={tplLogo}
              onChange={(e) => setTplLogo(e.target.value)}
            />
            <Input
              placeholder="Color marca (HEX)"
              value={tplColor}
              onChange={(e) => setTplColor(e.target.value)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => void createTpl()}>Crear plantilla</Button>
          </div>
        </details>
      </div>

      {/* Región exportable */}
      <div ref={targetRef} className="bg-white rounded-xl p-6 space-y-6">
        {tplId && <Cover />}

        {incPatient && (
          <section>
            <h2 className="text-xl font-semibold">Datos del paciente</h2>
            <div className="text-sm text-gray-700">
              <div>
                <strong>Nombre:</strong> {patient?.nombre}
              </div>
              <div>
                <strong>Edad:</strong> {patient?.edad ?? "—"}
              </div>
              <div>
                <strong>Género:</strong> {patient?.genero}
              </div>
              <div>
                <strong>ID:</strong> {patient?.id}
              </div>
            </div>
          </section>
        )}

        {incNotes && (
          <section>
            <h2 className="text-xl font-semibold">Notas</h2>
            {filteredNotes().length === 0 && (
              <div className="text-sm text-gray-600">Sin notas en el rango.</div>
            )}
            {filteredNotes().map((n) => (
              <div key={n.id} className="border rounded-lg p-3 mb-2">
                <div className="text-sm text-gray-600">
                  {new Date(n.created_at).toLocaleString()} · {n.titulo || "(Sin título)"}
                </div>
                {n.contenido && (
                  <pre className="whitespace-pre-wrap text-sm mt-1">{n.contenido}</pre>
                )}
              </div>
            ))}
          </section>
        )}

        {incFiles && (
          <section>
            <h2 className="text-xl font-semibold">Archivos (listado)</h2>
            {files.length === 0 && <div className="text-sm text-gray-600">Sin archivos.</div>}
            {files.map((f) => (
              <div key={f.path} className="text-sm text-gray-700">
                {f.name} · {Math.round((f.size as number) / 1024)} KB ·{" "}
                {new Date((f.updated_at || f.created_at) as string).toLocaleString()}
              </div>
            ))}
          </section>
        )}

        {incAudit && (
          <section>
            <h2 className="text-xl font-semibold">Actividad</h2>
            {audit.length === 0 && <div className="text-sm text-gray-600">Sin actividad.</div>}
            {audit.map((a) => (
              <div key={a.id} className="text-sm">
                {a.created_at} · {a.action}
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="flex justify-end">
        <ExportPDFButton
          targetRef={targetRef}
          fileName={`Export-${(patient?.nombre || "Paciente").replace(/\s+/g, "_")}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}.pdf`}
        />
      </div>
    </div>
  );
}

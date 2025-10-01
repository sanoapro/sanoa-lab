"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type TemplateScope = "personal" | "org";

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
  const [tplId, setTplId] = useState<string>("");
  const [tplName, setTplName] = useState("");
  const [tplTitle, setTplTitle] = useState("Informe clínico");
  const [tplSubtitle, setTplSubtitle] = useState("");
  const [tplLogo, setTplLogo] = useState("");
  const [tplColor, setTplColor] = useState("#D97A66");
  const [tplScope, setTplScope] = useState<TemplateScope>("personal");

  const targetRef = useRef<HTMLDivElement | null>(null);

  // Formateadores MX
  const fmtDateTime = useMemo(
    () =>
      new Intl.DateTimeFormat("es-MX", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/Mexico_City",
      }),
    []
  );

  // Carga inicial (con cancelación)
  useEffect(() => {
    let alive = true;
    const ac = new AbortController();

    async function loadAll() {
      setLoading(true);
      try {
        const pid = String(id);
        const [p, n, a, f, t] = await Promise.all([
          getPatient(pid),
          listNotes(pid),
          listAudit(pid),
          listPatientFiles(pid),
          listExportTemplates(true),
        ]);
        if (!alive) return;
        setPatient(p);
        setNotes(n);
        setAudit(a);
        setFiles(f);
        setTemplates(t);
        if (t?.length) setTplId(t[0].id);
      } catch (e: any) {
        showToast({
          title: "No se pudo cargar",
          description: e?.message ?? String(e),
          variant: "destructive",
        });
      } finally {
        if (alive) setLoading(false);
      }
    }

    void loadAll();

    return () => {
      alive = false;
      ac.abort();
    };
  }, [id]);

  // Notas filtradas por fecha
  const filteredNotes = useMemo(() => {
    let arr = notes;
    if (from) {
      const d = new Date(from + "T00:00:00");
      arr = arr.filter((n) => new Date(n.created_at) >= d);
    }
    if (to) {
      const d = new Date(to + "T23:59:59");
      arr = arr.filter((n) => new Date(n.created_at) <= d);
    }
    return arr;
  }, [notes, from, to]);

  // Plantilla activa memorizada
  const activeTpl = useMemo<ExportTemplate | null>(
    () => templates.find((x) => x.id === tplId) ?? null,
    [templates, tplId]
  );

  // Validadores simples
  const isHex = (v: string) => /^#?[0-9a-f]{6}$/i.test(v.trim());
  const safeHex = (v: string, fallback = "#D97A66") => {
    if (!v) return fallback;
    const h = v.startsWith("#") ? v : `#${v}`;
    return isHex(h) ? h : fallback;
    };

  const isUrl = (v: string) => {
    if (!v) return false;
    try {
      // Permite data: y http(s)
      return /^https?:\/\//.test(v) || v.startsWith("data:");
    } catch {
      return false;
    }
  };

  async function handleCreateTpl() {
    if (!tplName.trim()) {
      showToast({ title: "Nombre requerido", description: "Escribe un nombre para la plantilla." });
      return;
    }
    try {
      const newTpl = await createExportTemplate(
        tplName.trim(),
        tplTitle.trim() || "Informe clínico",
        tplSubtitle.trim() || null,
        isUrl(tplLogo) ? tplLogo.trim() : null,
        safeHex(tplColor),
        tplScope
      );
      setTemplates((prev) => [newTpl, ...prev]);
      setTplId(newTpl.id);
      setTplName("");
      showToast({ title: "Plantilla creada", description: "Disponible para tus exportaciones." });
    } catch (e: any) {
      showToast({ title: "No se pudo crear", description: e?.message ?? String(e), variant: "destructive" });
    }
  }

  async function handleDeleteTpl() {
    if (!tplId) return;
    const tpl = templates.find((t) => t.id === tplId);
    const name = tpl?.name ?? "esta plantilla";
    if (!confirm(`¿Eliminar ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteExportTemplate(tplId);
      setTemplates((prev) => prev.filter((x) => x.id !== tplId));
      setTplId("");
      showToast({ title: "Plantilla eliminada" });
    } catch (e: any) {
      showToast({ title: "No se pudo eliminar", description: e?.message ?? String(e), variant: "destructive" });
    }
  }

  // Portada
  function Cover() {
    const t = activeTpl;
    if (!t) return null;
    const color = safeHex(t.brand_hex || "#D97A66");
    return (
      <section className="h-[70vh] min-h-[520px] flex flex-col items-center justify-center text-center relative overflow-hidden rounded-xl">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${color}22, transparent)` }}
          aria-hidden
        />
        {t.logo_url && isUrl(t.logo_url) && (
          <img src={t.logo_url} alt="Logo portada" className="h-16 mb-4" />
        )}
        <h1 className="text-3xl font-semibold" style={{ color }}>
          {t.cover_title || "Informe clínico"}
        </h1>
        {t.cover_subtitle ? <p className="mt-2 text-gray-700">{t.cover_subtitle}</p> : null}
        <div className="mt-8 text-sm text-gray-600">
          <div>
            <strong>Paciente:</strong> {patient?.nombre ?? "—"}
          </div>
          <div>
            <strong>Fecha:</strong> {fmtDateTime.format(new Date())}
          </div>
        </div>
      </section>
    );
  }

  const pdfName = useMemo(() => {
    const base = (patient?.nombre || "Paciente").replace(/\s+/g, "_");
    const ts = new Date().toISOString().slice(0, 16).replace(/[:T]/g, "");
    return `Export-${base}-${ts}.pdf`;
  }, [patient?.nombre]);

  // Utilidad: tamaño legible
  const humanSize = (bytes?: number | null) => {
    const b = typeof bytes === "number" && isFinite(bytes) ? bytes : 0;
    if (b < 1024 * 1024) return `${Math.round(b / 1024)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="max-w-4xl mx-auto p-4">Cargando…</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Exportar PDF — {patient?.nombre ?? "—"}</h1>

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
          <Button variant="secondary" onClick={handleDeleteTpl} disabled={!tplId}>
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
              onChange={(e) => setTplScope(e.target.value as TemplateScope)}
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
              placeholder="Logo URL (opcional: https://… o data:)"
              value={tplLogo}
              onChange={(e) => setTplLogo(e.target.value)}
            />
            <Input
              placeholder="Color marca (HEX ej. #D97A66)"
              value={tplColor}
              onChange={(e) => setTplColor(e.target.value)}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button onClick={() => void handleCreateTpl()}>Crear plantilla</Button>
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
                <strong>Nombre:</strong> {patient?.nombre ?? "—"}
              </div>
              <div>
                <strong>Edad:</strong> {patient?.edad ?? "—"}
              </div>
              <div>
                <strong>Género:</strong> {patient?.genero ?? "—"}
              </div>
              <div>
                <strong>ID:</strong> {patient?.id ?? "—"}
              </div>
            </div>
          </section>
        )}

        {incNotes && (
          <section>
            <h2 className="text-xl font-semibold">Notas</h2>
            {filteredNotes.length === 0 && (
              <div className="text-sm text-gray-600">Sin notas en el rango.</div>
            )}
            {filteredNotes.map((n) => (
              <div key={n.id} className="border rounded-lg p-3 mb-2">
                <div className="text-sm text-gray-600">
                  {fmtDateTime.format(new Date(n.created_at))} · {n.titulo || "(Sin título)"}
                </div>
                {n.contenido ? (
                  <pre className="whitespace-pre-wrap text-sm mt-1">{n.contenido}</pre>
                ) : null}
              </div>
            ))}
          </section>
        )}

        {incFiles && (
          <section>
            <h2 className="text-xl font-semibold">Archivos (listado)</h2>
            {files.length === 0 && <div className="text-sm text-gray-600">Sin archivos.</div>}
            {files.map((f) => {
              const when = fmtDateTime.format(
                new Date((f.updated_at || f.created_at) as string)
              );
              return (
                <div key={f.path} className="text-sm text-gray-700">
                  {f.name} · {humanSize(f.size as number)} · {when}
                </div>
              );
            })}
          </section>
        )}

        {incAudit && (
          <section>
            <h2 className="text-xl font-semibold">Actividad</h2>
            {audit.length === 0 && <div className="text-sm text-gray-600">Sin actividad.</div>}
            {audit.map((a) => (
              <div key={a.id} className="text-sm">
                {fmtDateTime.format(new Date(a.created_at as string))} · {a.action}
              </div>
            ))}
          </section>
        )}
      </div>

      <div className="flex justify-end">
        <ExportPDFButton targetRef={targetRef} fileName={pdfName} />
      </div>
    </div>
  );
}

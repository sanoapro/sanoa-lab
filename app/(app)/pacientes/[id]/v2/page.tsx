// app/(app)/pacientes/[id]/v2/page.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPatient, updatePatient, restorePatient, type Patient } from "@/lib/patients";
import {
  listNotes,
  createNote,
  updateNote,
  deleteNote,
  duplicateNote,
  type PatientNote,
} from "@/lib/patient-notes";
import { listAudit, fmtAuditRow, type AuditEntry } from "@/lib/audit";
import { listTemplates, createTemplate, deleteTemplate, type NoteTemplate } from "@/lib/note-templates";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Modal from "@/components/Modal";
import { showToast } from "@/components/Toaster";
import {
  ArrowLeft,
  Loader2,
  FilePlus2,
  Download,
  Copy,
  History,
} from "lucide-react";
import ExportPDFButton from "@/components/ExportPDFButton";
import NoteDiff from "@/components/NoteDiff";
import { listNoteVersions, type NoteVersion } from "@/lib/note-versions";

function tsNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(
    d.getHours(),
  )}${pad(d.getMinutes())}`;
}

export default function PatientDetailPageV2() {
  const router = useRouter();
  const params = useParams();
  const patientId = String((params as any).id);

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState<Patient | null>(null);

  // Editar paciente
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");
  const [genero, setGenero] = useState<"F" | "M" | "O">("O");

  // Notas
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [noteTitulo, setNoteTitulo] = useState("");
  const [noteContenido, setNoteContenido] = useState("");

  // Plantillas
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [tplName, setTplName] = useState("");
  const [tplScope, setTplScope] = useState<"personal" | "org">("personal");

  // Auditoría (general del paciente)
  const [audit, setAudit] = useState<AuditEntry[]>([]);

  // Motivo (auditoría fina por nota)
  const [openDeleteNote, setOpenDeleteNote] = useState<string | null>(null);
  const [openReason, setOpenReason] = useState<{ noteId: string; action: "save" | "delete" } | null>(null);
  const [reasonText, setReasonText] = useState("");

  // Historial de una nota
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);
  const isDeleted = !!patient?.deleted_at;

  async function loadAll() {
    setLoading(true);
    try {
      const p = await getPatient(patientId);
      if (!p) {
        showToast({ title: "No encontrado", description: "El paciente no existe.", variant: "destructive" });
        router.replace("/pacientes");
        return;
      }
      setPatient(p);
      setNombre(p.nombre);
      setEdad(p.edad ?? "");
      setGenero(p.genero as any);

      const [n, au, tpls] = await Promise.all([
        listNotes(patientId),
        listAudit(patientId),
        listTemplates(true),
      ]);
      setNotes(n);
      setAudit(au);
      setTemplates(tpls);
    } catch (e: unknown) {
      showToast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  async function savePatient() {
    setLoading(true);
    try {
      const updated = await updatePatient(patientId, {
        nombre: nombre.trim(),
        edad: typeof edad === "number" ? edad : null,
        genero,
      });
      setPatient(updated);
      showToast({ title: "Guardado", description: "Paciente actualizado." });
      setAudit(await listAudit(patientId));
    } catch (e: unknown) {
      showToast({ title: "Error al guardar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function onRestorePatient() {
    setLoading(true);
    try {
      const p = await restorePatient(patientId);
      setPatient(p);
      showToast({ title: "Restaurado", description: "Paciente restaurado." });
      setAudit(await listAudit(patientId));
    } catch (e: unknown) {
      showToast({ title: "Error al restaurar", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  // ---- Plantillas ----
  async function saveAsTemplate() {
    if (!tplName.trim() || (!noteTitulo.trim() && !noteContenido.trim())) {
      showToast({ title: "Valida", description: "Pon nombre y contenido/título." });
      return;
    }
    try {
      const tpl = await createTemplate(
        tplName.trim(),
        `${noteTitulo ? noteTitulo + "\n\n" : ""}${noteContenido}`,
        tplScope,
      );
      setTemplates([tpl, ...templates]);
      setTplName("");
      showToast({ title: "Plantilla guardada", description: "Ahora puedes reutilizarla." });
    } catch (e: any) {
      showToast({ title: "No se pudo guardar", description: e.message, variant: "destructive" });
    }
  }

  function applyTemplate(t: NoteTemplate) {
    const body = t.body ?? "";
    const [first, ...rest] = body.split("\n\n");
    if (first && rest.length > 0) {
      setNoteTitulo(first);
      setNoteContenido(rest.join("\n\n"));
    } else {
      setNoteContenido(body);
    }
  }

  // ---- Notas ----
  async function addNote() {
    if (!noteTitulo.trim() && !noteContenido.trim()) {
      showToast({ title: "Valida", description: "Título o contenido requerido." });
      return;
    }
    setLoading(true);
    try {
      const n = await createNote(patientId, { titulo: noteTitulo || null, contenido: noteContenido || null });
      setNotes([n, ...notes]);
      setNoteTitulo("");
      setNoteContenido("");
      showToast({ title: "Listo", description: "Nota creada." });

      // Notificación (opcional, al usuario actual)
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getUser();
      const to = data?.user?.email;
      if (to) {
        await fetch("/api/notify/email", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            to,
            subject: `Sanoa Lab: Nueva nota en ${patient?.nombre || "Paciente"}`,
            text: `Se creó una nota para "${patient?.nombre || "Paciente"}".`,
          }),
        }).catch(() => {});
      }

      setAudit(await listAudit(patientId));
    } catch (e: unknown) {
      showToast({ title: "Error al crear nota", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function askReason(noteId: string, action: "save" | "delete") {
    setReasonText("");
    setOpenReason({ noteId, action });
  }

  async function doSaveNote(noteId: string, titulo: string, contenido: string) {
    setLoading(true);
    try {
      // Versión con motivo (si tu lib lo soporta como 3er argumento)
      const nn = await updateNote(noteId, { titulo, contenido }, reasonText.trim() || null);
      setNotes((arr) => arr.map((x) => (x.id === noteId ? nn : x)));
      setOpenReason(null);
      setReasonText("");
      showToast({ title: "Guardado", description: "Nota actualizada (registrado en historial)." });
      setAudit(await listAudit(patientId));
    } catch (e: unknown) {
      showToast({ title: "Error al guardar nota", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function confirmDeleteNote(noteId: string) {
    setOpenDeleteNote(noteId);
  }

  async function doDeleteNote() {
    if (!openDeleteNote) return;
    setOpenReason({ noteId: openDeleteNote, action: "delete" });
    setOpenDeleteNote(null);
  }

  async function doDeleteWithReason() {
    if (!openReason) return;
    setLoading(true);
    try {
      // Versión con motivo (si tu lib lo soporta como 2do argumento)
      await deleteNote(openReason.noteId, reasonText.trim() || null);
      setNotes((arr) => arr.filter((x) => x.id !== openReason.noteId));
      setOpenReason(null);
      setReasonText("");
      showToast({ title: "Eliminada", description: "Nota movida a 'Eliminadas' (registrado en historial)." });
      setAudit(await listAudit(patientId));
    } catch (e: unknown) {
      showToast({ title: "Error al eliminar nota", description: (e as Error).message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function doDuplicate(noteId: string) {
    try {
      const dup = await duplicateNote(noteId);
      setNotes((arr) => [dup, ...arr]);
      showToast({ title: "Duplicada", description: "Se creó una copia de la nota." });
    } catch (e: any) {
      showToast({ title: "No se pudo duplicar", description: e.message, variant: "destructive" });
    }
  }

  // ---- Historial ----
  async function openHistoryFor(noteId: string) {
    setOpenHistory(noteId);
    setLoadingHistory(true);
    try {
      setVersions(await listNoteVersions(noteId));
    } catch (e: any) {
      showToast({ title: "Error al cargar historial", description: e.message, variant: "destructive" });
    } finally {
      setLoadingHistory(false);
    }
  }

  if (loading && !patient)
    return (
      <div className="max-w-5xl mx-auto p-6">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!patient) return null;

  const pdfName = `Paciente-${(patient?.nombre || "SinNombre")
    .replace(/\s+/g, "_")
    .trim()}-${tsNow()}.pdf`;

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-8">
      <div className="flex items-center justify-between">
        <button
          className="inline-flex items-center text-sm text-gray-600 hover:underline"
          onClick={() => router.push("/pacientes")}
        >
          <ArrowLeft className="w-4 h-4 mr-1" /> Volver
        </button>
        <div className="flex gap-2">
          <a
            href={`/api/export/paciente/${patientId}/csv`}
            className="inline-flex"
          >
            <Button variant="secondary" title="Exportar CSV">
              <Download className="w-4 h-4 mr-2" /> CSV
            </Button>
          </a>
          <ExportPDFButton targetRef={exportRef} fileName={pdfName} />
        </div>
      </div>

      {isDeleted && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div className="text-sm text-amber-800">
            Este paciente está en <strong>Eliminados</strong>. No se permiten nuevas notas ni editar hasta restaurar.
          </div>
          <Button variant="secondary" onClick={() => void onRestorePatient()}>
            Restaurar
          </Button>
        </div>
      )}

      {/* Contenido exportable */}
      <div ref={exportRef}>
        {/* Edición del paciente */}
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Paciente (v2)</h1>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm mb-1">Nombre</label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={isDeleted}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Edad</label>
              <Input
                type="number"
                inputMode="numeric"
                value={edad}
                onChange={(e) => setEdad(e.target.value === "" ? "" : Number(e.target.value))}
                disabled={isDeleted}
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Género</label>
              <select
                className="border rounded-md px-3 py-2 w-full"
                value={genero}
                onChange={(e) => setGenero(e.target.value as "F" | "M" | "O")}
                disabled={isDeleted}
              >
                <option value="O">Otro/Prefiero no decir</option>
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
              </select>
            </div>
          </div>
          <Button onClick={() => void savePatient()} disabled={loading || isDeleted}>
            Guardar cambios
          </Button>
        </section>

        {/* Plantillas de notas */}
        <section className="space-y-3 mt-8">
          <h2 className="text-xl font-semibold">Plantillas</h2>
          <div className="flex flex-wrap gap-2">
            {templates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 border rounded-full px-3 py-1">
                <button className="text-sm underline" onClick={() => applyTemplate(t)} title="Aplicar">
                  {t.name}
                </button>
                <button
                  className="text-xs text-gray-500"
                  onClick={() =>
                    deleteTemplate(t.id).then(() => setTemplates((arr) => arr.filter((x) => x.id !== t.id)))
                  }
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>
            ))}
            {templates.length === 0 && (
              <div className="text-sm text-gray-600">Aún no tienes plantillas.</div>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              placeholder="Nombre de plantilla…"
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
            <Button variant="secondary" onClick={() => void saveAsTemplate()} disabled={!tplName.trim()}>
              Guardar desde inputs
            </Button>
          </div>
        </section>

        {/* Notas */}
        <section className="space-y-3 mt-8">
          <h2 className="text-xl font-semibold">Notas</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <Button
              variant="secondary"
              onClick={() => {
                setNoteTitulo("Nota SOAP");
                setNoteContenido(`S - Subjetivo:\n\nO - Objetivo:\n\nA - Análisis:\n\nP - Plan:\n`);
              }}
              disabled={isDeleted}
            >
              <FilePlus2 className="w-4 h-4 mr-2" /> Insertar plantilla SOAP
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setNoteTitulo("Nota DARE");
                setNoteContenido(`D - Datos:\n\nA - Análisis:\n\nR - Respuesta:\n\nE - Evaluación:\n`);
              }}
              disabled={isDeleted}
            >
              <FilePlus2 className="w-4 h-4 mr-2" /> Insertar plantilla DARE
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              placeholder="Título (opcional)"
              value={noteTitulo}
              onChange={(e) => setNoteTitulo(e.target.value)}
              disabled={isDeleted}
            />
            <Input
              placeholder="Contenido (opcional)"
              value={noteContenido}
              onChange={(e) => setNoteContenido(e.target.value)}
              disabled={isDeleted}
            />
          </div>
          <div>
            <Button onClick={() => void addNote()} disabled={loading || isDeleted}>
              Agregar nota
            </Button>
          </div>

          <div className="border rounded-xl divide-y bg-white">
            {notes.length === 0 && <div className="p-4 text-sm text-gray-600">Sin notas aún.</div>}
            {notes.map((n) => (
              <NoteRow
                key={n.id}
                n={n}
                onAskReason={(id) => askReason(id, "save")}
                onAskDelete={confirmDeleteNote}
                onDuplicate={doDuplicate}
                onHistory={openHistoryFor}
                disabled={isDeleted}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Auditoría simple */}
      <section className="space-y-3 mt-8">
        <h2 className="text-xl font-semibold">Actividad (auditoría)</h2>
        <div className="border rounded-xl divide-y bg-white">
          {audit.length === 0 && <div className="p-4 text-sm text-gray-600">Aún no hay actividad.</div>}
          {audit.map((a) => (
            <div key={a.id} className="p-3 text-sm">
              {fmtAuditRow(a)}
            </div>
          ))}
        </div>
      </section>

      {/* Modal: confirmar eliminar (paso 1) */}
      <Modal open={!!openDeleteNote} onOpenChange={() => setOpenDeleteNote(null)} title="Eliminar nota">
        <p>¿Seguro que deseas eliminar esta nota? Después te pediremos un “motivo”.</p>
        <div className="pt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenDeleteNote(null)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={() => void doDeleteNote()}>
            Continuar
          </Button>
        </div>
      </Modal>

      {/* Modal: motivo de cambio */}
      <Modal open={!!openReason} onOpenChange={() => setOpenReason(null)} title="Motivo">
        <p className="text-sm text-gray-600">Ingresa un motivo breve (auditoría).</p>
        <Input
          placeholder="Ej. Corrección de error tipográfico"
          value={reasonText}
          onChange={(e) => setReasonText(e.target.value)}
        />
        <div className="pt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setOpenReason(null)}>
            Cancelar
          </Button>
          {openReason?.action === "save" && (
            <Button
              onClick={() => {
                const id = openReason?.noteId!;
                const comp = document.getElementById(`note-fields-${id}`) as HTMLDivElement | null;
                const titulo = (comp?.querySelector('input[data-k="t"]') as HTMLInputElement)?.value || "";
                const contenido = (comp?.querySelector('input[data-k="c"]') as HTMLInputElement)?.value || "";
                void doSaveNote(id, titulo, contenido);
              }}
            >
              Guardar
            </Button>
          )}
          {openReason?.action === "delete" && (
            <Button variant="destructive" onClick={() => void doDeleteWithReason()}>
              Eliminar
            </Button>
          )}
        </div>
      </Modal>

      {/* Modal: historial/diffs */}
      <Modal open={!!openHistory} onOpenChange={() => setOpenHistory(null)} title="Historial de la nota">
        <div className="max-h-[60vh] overflow-auto space-y-4">
          {loadingHistory && <div className="text-sm">Cargando…</div>}
          {!loadingHistory && versions.length === 0 && (
            <div className="text-sm text-gray-600">Sin versiones.</div>
          )}
          {!loadingHistory &&
            versions.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 bg-white">
                <div className="text-xs text-gray-600 mb-2">
                  {new Date(v.created_at).toLocaleString()} · acción: <strong>{v.action}</strong>
                  {v.reason ? (
                    <>
                      {" "}
                      · motivo: <em>{v.reason}</em>
                    </>
                  ) : null}
                </div>
                <div className="text-sm font-medium mb-1">Título</div>
                <NoteDiff before={v.before_titulo || ""} after={v.after_titulo || ""} />
                <div className="text-sm font-medium mt-3 mb-1">Contenido</div>
                <NoteDiff before={v.before_contenido || ""} after={v.after_contenido || ""} />
              </div>
            ))}
        </div>
        <div className="pt-3 flex justify-end">
          <Button variant="secondary" onClick={() => setOpenHistory(null)}>
            Cerrar
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function NoteRow(props: {
  n: PatientNote;
  disabled?: boolean;
  onAskReason: (id: string) => void;
  onAskDelete: (id: string) => void;
  onDuplicate: (id: string) => Promise<void>;
  onHistory: (id: string) => Promise<void>;
}) {
  const { n, disabled, onAskReason, onAskDelete, onDuplicate, onHistory } = props;
  const [titulo, setTitulo] = useState(n.titulo ?? "");
  const [contenido, setContenido] = useState(n.contenido ?? "");
  const changed = titulo !== (n.titulo ?? "") || contenido !== (n.contenido ?? "");

  return (
    <div id={`note-fields-${n.id}`} className="p-4 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          data-k="t"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Título"
          disabled={disabled}
        />
        <Input
          data-k="c"
          value={contenido}
          onChange={(e) => setContenido(e.target.value)}
          placeholder="Contenido"
          disabled={disabled}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => void onHistory(n.id)} title="Ver historial">
          <History className="w-4 h-4 mr-1" /> Historial
        </Button>
        <Button variant="secondary" onClick={() => void onDuplicate(n.id)} disabled={disabled} title="Duplicar">
          <Copy className="w-4 h-4 mr-1" /> Duplicar
        </Button>
        <Button variant="secondary" disabled={!changed || disabled} onClick={() => onAskReason(n.id)}>
          Guardar
        </Button>
        <Button variant="destructive" onClick={() => onAskDelete(n.id)} disabled={disabled} title="Eliminar nota">
          Eliminar
        </Button>
      </div>
    </div>
  );
}

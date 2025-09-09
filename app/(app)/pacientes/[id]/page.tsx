"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getPatient, updatePatient, type Patient } from "@/lib/patients";
import { listNotes, createNote, deleteNote, type PatientNote } from "@/lib/patient-notes";
import { listPatientFiles, uploadPatientFile, getSignedUrl, deletePatientFile, type PatientFile } from "@/lib/patient-files";
import { showToast } from "@/components/Toaster";
import Modal from "@/components/Modal";
import { useNotesRealtime } from "@/hooks/useNotesRealtime";
import ExportPDFButton from "@/components/ExportPDFButton";

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>();

  // Paciente
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  // Editar Paciente
  const [openEdit, setOpenEdit] = useState(false);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");
  const [genero, setGenero] = useState<"F" | "M" | "O">("O");
  const [savingEdit, setSavingEdit] = useState(false);

  // Notas
  const [notes, setNotes] = useState<PatientNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Archivos
  const [files, setFiles] = useState<PatientFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Área exportable
  const printRef = useRef<HTMLDivElement>(null);

  // Carga paciente
  useEffect(() => {
    (async () => {
      try {
        const p = await getPatient(id);
        setPatient(p);
        setNombre(p.nombre);
        setEdad(p.edad);
        setGenero(p.genero);
      } catch (e: any) {
        console.error(e);
        showToast(e?.message || "No se pudo cargar el paciente.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // Notas: listar y realtime
  const refreshNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const data = await listNotes(id);
      setNotes(data);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudieron cargar las notas.", "error");
    } finally {
      setLoadingNotes(false);
    }
  }, [id]);

  useEffect(() => { refreshNotes(); }, [refreshNotes]);
  useNotesRealtime(id, () => { refreshNotes(); }, 250);

  // Archivos: listar
  const refreshFiles = useCallback( async () => {
    setLoadingFiles(true);
    try {
      const data = await listPatientFiles(id);
      setFiles(data);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudieron cargar los archivos.", "error");
    } finally {
      setLoadingFiles(false);
    }
  }, [id]);

  useEffect(() => { refreshFiles(); }, [refreshFiles]);

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    const text = noteText.trim();
    if (text.length < 2) { showToast("Escribe al menos 2 caracteres.", "info"); return; }
    setSavingNote(true);
    try {
      const n = await createNote(id, text);
      setNotes(prev => [n, ...prev]);
      setNoteText("");
      showToast("Nota guardada.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo guardar la nota.", "error");
    } finally {
      setSavingNote(false);
    }
  }

  async function onDeleteNote(nid: string) {
    if (!confirm("¿Eliminar nota?")) return;
    try {
      await deleteNote(nid);
      setNotes(prev => prev.filter(n => n.id !== nid));
      showToast("Nota eliminada.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo eliminar la nota.", "error");
    }
  }

  function openEditModal() {
    if (!patient) return;
    setNombre(patient.nombre);
    setEdad(patient.edad);
    setGenero(patient.genero);
    setOpenEdit(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    const n = (nombre || "").trim();
    const eNum = typeof(edad) === "string" ? Number(edad || 0) : edad;
    if (!n) { showToast("El nombre es obligatorio.", "info"); return; }
    if (!Number.isFinite(eNum) || eNum < 0) { showToast("Edad inválida.", "error"); return; }

    try {
      setSavingEdit(true);
      const updated = await updatePatient(id, { nombre: n, edad: eNum, genero });
      setPatient(updated);
      setOpenEdit(false);
      showToast("Datos actualizados.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "No se pudo actualizar.", "error");
    } finally {
      setSavingEdit(false);
    }
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await uploadPatientFile(id, file);
      await refreshFiles();
      (e.target as HTMLInputElement).value = "";
      showToast("Archivo subido.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "No se pudo subir el archivo.", "error");
    } finally {
      setUploading(false);
    }
  }

  async function onView(pf: PatientFile) {
    try {
      const url = await getSignedUrl(pf, 300);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo generar el enlace.", "error");
    }
  }

  async function onCopy(pf: PatientFile) {
    try {
      const url = await getSignedUrl(pf, 300);
      await navigator.clipboard.writeText(url);
      showToast("Enlace copiado (300s).", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo copiar el enlace.", "error");
    }
  }

  async function onDeleteFile(idRec: string) {
    if (!confirm("¿Eliminar archivo?")) return;
    try {
      await deletePatientFile(idRec);
      setFiles(prev => prev.filter(f => f.id !== idRec));
      showToast("Archivo eliminado.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo eliminar.", "error");
    }
  }

  if (loading) {
    return <main className="p-6 md:p-10"><p>Cargando…</p></main>;
  }

  if (!patient) {
    return (
      <main className="p-6 md:p-10">
        <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-6">
          <p className="text-red-600">Paciente no encontrado.</p>
          <Link href="/pacientes" className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]">
            <ColorEmoji token="atras" size={16} /> Volver
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 md:p-10 space-y-6">
      {/* === ÁREA EXPORTABLE: encabezado + datos + notas === */}
      <div ref={printRef} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
            <ColorEmoji token="usuario" size={24} /> {patient.nombre}
          </h1>
          {/* Botones de acción (NO exportar) */}
          <div className="flex items-center gap-2" data-html2canvas-ignore="true">
            <ExportPDFButton
              targetRef={printRef}
              filename={`Paciente-${patient.nombre}.pdf`}
            />
            <button
              onClick={openEditModal}
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
            >
              <ColorEmoji token="puzzle" size={16} /> Editar
            </button>
            <Link href="/pacientes" className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]">
              <ColorEmoji token="atras" size={16} /> Volver
            </Link>
          </div>
        </div>

        {/* Datos básicos */}
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h2 className="font-semibold text-[var(--color-brand-text)]">Datos básicos</h2>
              <p className="text-[var(--color-brand-bluegray)] mt-1 text-sm">
                Edad: {patient.edad} · Género: {patient.genero}
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-[var(--color-brand-text)]">Creación</h2>
              <p className="text-[var(--color-brand-bluegray)] mt-1 text-sm">
                {new Date(patient.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </section>

        {/* Notas clínicas */}
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="puzzle" size={18} /> Notas clínicas
            </h2>

            {/* Formulario (NO exportar) */}
            <form onSubmit={onAddNote} className="space-y-3" data-html2canvas-ignore="true">
              <textarea
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Escribe una nota clínica breve…"
                rows={3}
                className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  disabled={savingNote}
                  className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  <ColorEmoji token="guardar" size={16} /> {savingNote ? "Guardando…" : "Añadir nota"}
                </button>
                <button
                  type="button"
                  onClick={refreshNotes}
                  className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
                >
                  <ColorEmoji token="refrescar" size={16} /> Actualizar
                </button>
              </div>
            </form>

            <div className="h-px bg-[var(--color-brand-border)]" />

            {loadingNotes ? (
              <p className="text-[var(--color-brand-bluegray)]">Cargando notas…</p>
            ) : notes.length === 0 ? (
              <p className="text-[var(--color-brand-bluegray)]">Aún no hay notas.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map(n => (
                  <li key={n.id} className="rounded-xl border border-[var(--color-brand-border)] bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-[var(--color-brand-text)] whitespace-pre-wrap">
                        {n.content}
                      </div>
                      {/* Botón borrar (NO exportar) */}
                      <button
                        onClick={() => onDeleteNote(n.id)}
                        className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                        title="Eliminar nota"
                        data-html2canvas-ignore="true"
                      >
                        <ColorEmoji token="borrar" size={14} /> Borrar
                      </button>
                    </div>
                    <div className="mt-2 text-xs text-[var(--color-brand-bluegray)]">
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
      {/* === FIN ÁREA EXPORTABLE === */}

      {/* Archivos clínicos (no se incluyen en el PDF) */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
            <ColorEmoji token="carpeta" size={18} /> Archivos clínicos
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-brand-border)] bg-[var(--color-brand-background)] px-4 py-2 cursor-pointer hover:opacity-90">
              <ColorEmoji token="subir" size={18} /> {uploading ? "Subiendo…" : "Subir archivo"}
              <input type="file" onChange={onUpload} className="hidden" />
            </label>
            <button
              type="button"
              onClick={refreshFiles}
              className="rounded-xl border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
            >
              <ColorEmoji token="refrescar" size={16} /> Actualizar
            </button>
          </div>

          <div className="h-px bg-[var(--color-brand-border)]" />

          {loadingFiles ? (
            <p className="text-[var(--color-brand-bluegray)]">Cargando archivos…</p>
          ) : files.length === 0 ? (
            <p className="text-[var(--color-brand-bluegray)]">Aún no hay archivos.</p>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {files.map(f => (
                <li key={f.id} className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                      <ColorEmoji token="archivo" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[var(--color-brand-text)] text-sm font-medium" title={f.file_name}>{f.file_name}</div>
                      <div className="text-xs text-[var(--color-brand-bluegray)]">{f.mime_type || "desconocido"} · {f.size ? `${(f.size/1024).toFixed(1)} KB` : ""}</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => onView(f)} className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1">
                          <ColorEmoji token="ver" size={14} /> Ver
                        </button>
                        <button onClick={() => onCopy(f)} className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1">
                          <ColorEmoji token="link" size={14} /> Copiar link
                        </button>
                        <button onClick={() => onDeleteFile(f.id)} className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1">
                          <ColorEmoji token="borrar" size={14} /> Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Modal Editar paciente */}
      <Modal
        open={openEdit}
        onClose={() => setOpenEdit(false)}
        title="Editar paciente"
        widthClass="max-w-xl"
      >
        <form onSubmit={onSaveEdit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-[var(--color-brand-text)]/80">Nombre</span>
            <input
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              placeholder="Nombre completo"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Edad</span>
              <input
                value={edad}
                onChange={(e) => setEdad(e.target.value === "" ? "" : Number(e.target.value))}
                type="number" min={0}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              />
            </label>
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Género</span>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              >
                <option value="F">Femenino</option>
                <option value="M">Masculino</option>
                <option value="O">Otro</option>
              </select>
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpenEdit(false)}
              className="rounded-md border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)]"
            >
              Cancelar
            </button>
            <button
              disabled={savingEdit}
              className="rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <ColorEmoji token="guardar" size={16} /> {savingEdit ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

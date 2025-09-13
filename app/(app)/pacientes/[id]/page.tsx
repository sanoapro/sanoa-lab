cat > app/(app)/pacientes/[id]/page.tsx <<'EOF'
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { getPatient, updatePatient, restorePatient, type Patient } from "@/lib/patients";
import { listNotes, createNote, deleteNote, type PatientNote } from "@/lib/patient-notes";
import {
  listPatientFiles,
  uploadPatientFile,
  getSignedUrl,
  deletePatientFile,
  type PatientFile,
} from "@/lib/patient-files";
import { listShares, addShare, revokeShare, type PatientShare } from "@/lib/patient-shares";
import { listAudit, fmtAuditRow, type AuditEntry } from "@/lib/audit";
import { showToast } from "@/components/Toaster";
import Modal from "@/components/Modal";
import { useNotesRealtime } from "@/hooks/useNotesRealtime";
import ExportPDFButton from "@/components/ExportPDFButton";

type PendingNote = PatientNote & { pending?: boolean };
type PendingFile = PatientFile & { pending?: boolean };

function tsNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export default function PacienteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const supabase = getSupabaseBrowser();

  const [meId, setMeId] = useState<string | null>(null);
  const [meEmail, setMeEmail] = useState<string | null>(null);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);

  const [shares, setShares] = useState<PatientShare[]>([]);
  const isOwner = patient && meId ? patient.user_id === meId : false;
  const myShare = shares.find(
    (s) => s.grantee_email.toLowerCase() === (meEmail || "").toLowerCase(),
  );
  const canEdit = Boolean(isOwner || myShare?.can_edit);
  const isDeleted = !!patient?.deleted_at;

  const [openEdit, setOpenEdit] = useState(false);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");
  const [genero, setGenero] = useState<"F" | "M" | "O">("O");
  const [savingEdit, setSavingEdit] = useState(false);

  const [notes, setNotes] = useState<PendingNote[]>([]);
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);

  const [files, setFiles] = useState<PendingFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [shareEmail, setShareEmail] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);

  // Modal de confirmación para borrar nota
  const [confirmNoteId, setConfirmNoteId] = useState<string | null>(null);

  // Área exportable
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMeId(data.user?.id ?? null);
      setMeEmail(data.user?.email ?? null);
    })();
  }, [supabase]);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPatient(id);
        setPatient(p);
        setNombre(p?.nombre ?? "");
        setEdad(p?.edad ?? "");
        setGenero((p?.genero as "F" | "M" | "O") ?? "O");
      } catch (e: any) {
        console.error(e);
        showToast(e?.message || "No se pudo cargar el paciente.", "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

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

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  useNotesRealtime(
    id,
    () => {
      refreshNotes();
    },
    250,
  );

  const refreshFiles = useCallback(async () => {
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

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  const refreshShares = useCallback(async () => {
    try {
      const data = await listShares(id);
      setShares(data);
    } catch (e: any) {
      console.error(e);
    }
  }, [id]);

  useEffect(() => {
    refreshShares();
  }, [refreshShares]);

  const refreshAudits = useCallback(async () => {
    setLoadingAudits(true);
    try {
      const data = await listAudit(id, 200);
      setAudits(data);
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo cargar la actividad.", "error");
    } finally {
      setLoadingAudits(false);
    }
  }, [id]);

  useEffect(() => {
    refreshAudits();
  }, [refreshAudits]);

  // Al terminar el replay de la cola → refresca notas/archivos y limpia pendientes
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const t = (e.data || {}).type;
      if (t === "queue:replay-success") {
        refreshNotes();
        refreshFiles();
      }
    };
    navigator.serviceWorker?.addEventListener?.("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener?.("message", onMsg);
  }, [refreshNotes, refreshFiles]);

  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para agregar notas.", "error");
      return;
    }
    const text = noteText.trim();
    if (text.length < 2) {
      showToast("Escribe al menos 2 caracteres.", "info");
      return;
    }
    setSavingNote(true);
    try {
      const n = await createNote(id, { titulo: null, contenido: text });
      setNotes((prev) => [n as PendingNote, ...prev]);
      setNoteText("");
      showToast("Nota guardada.", "success");
    } catch (e: any) {
      // Optimista: offline → agrega placeholder pendiente
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const temp: PendingNote = {
          id: `local-${Date.now()}`,
          patient_id: id,
          user_id: meId || "me",
          titulo: null,
          contenido: text + " (pendiente…)",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          pending: true,
        } as any;
        setNotes((prev) => [temp, ...prev]);
        setNoteText("");
        showToast("Nota encolada (sin conexión).", "info");
      } else {
        console.error(e);
        showToast(e?.message || "No se pudo guardar la nota.", "error");
      }
    } finally {
      setSavingNote(false);
    }
  }

  // Abrir modal de confirmación de borrado
  function askDeleteNote(nid: string) {
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para borrar notas.", "error");
      return;
    }
    setConfirmNoteId(nid);
  }

  // Ejecutar borrado confirmado
  async function doDeleteNote() {
    const nid = confirmNoteId;
    if (!nid) return;
    const local = nid.startsWith("local-");
    try {
      if (local) {
        setNotes((prev) => prev.filter((n) => n.id !== nid));
      } else {
        await deleteNote(nid);
        setNotes((prev) => prev.filter((n) => n.id !== nid));
      }
      showToast("Nota eliminada.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo eliminar la nota.", "error");
    } finally {
      setConfirmNoteId(null);
    }
  }

  function openEditModal() {
    if (!patient) return;
    setNombre(patient.nombre);
    setEdad(patient?.edad ?? "");
    setGenero((patient?.genero as "F" | "M" | "O") ?? "O");
    setOpenEdit(true);
  }

  async function onSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para editar.", "error");
      return;
    }
    const n = (nombre || "").trim();
    const eNum = typeof edad === "string" ? Number(edad || 0) : edad;
    if (!n) {
      showToast("El nombre es obligatorio.", "info");
      return;
    }
    if (!(eNum === "" || (Number.isFinite(eNum) && (eNum as number) >= 0))) {
      showToast("Edad inválida.", "error");
      return;
    }

    try {
      setSavingEdit(true);
      const updated = await updatePatient(id, { nombre: n, edad: eNum === "" ? null : (eNum as number), genero: genero as any });
      setPatient(updated);
      setOpenEdit(false);
      showToast("Datos actualizados.", "success");
      // refrescamos actividad por si tu backend la registra al editar
      refreshAudits();
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
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para subir archivos.", "error");
      return;
    }
    setUploading(true);
    try {
      await uploadPatientFile(id, file);
      await refreshFiles();
      (e.target as HTMLInputElement).value = "";
      showToast("Archivo subido.", "success");
    } catch (err: any) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        // Optimista: archivo pendiente
        const temp: PendingFile = {
          id: `local-${Date.now()}`,
          patient_id: id,
          file_name: file.name,
          size: file.size,
          mime_type: file.type || "desconocido",
          created_at: new Date().toISOString(),
          pending: true,
        } as any;
        setFiles((prev) => [temp, ...prev]);
        (e.target as HTMLInputElement).value = "";
        showToast("Archivo encolado (sin conexión).", "info");
      } else {
        console.error(err);
        showToast(err?.message || "No se pudo subir el archivo.", "error");
      }
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
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo copiar el enlace.", "error");
      return;
    }
    showToast("Enlace copiado (300s).", "success");
  }

  async function onDeleteFile(idRec: string) {
    const local = idRec.startsWith("local-");
    if (local) {
      setFiles((prev) => prev.filter((f) => f.id !== idRec));
      return;
    }
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para eliminar archivos.", "error");
      return;
    }
    if (!confirm("¿Eliminar archivo?")) return;
    try {
      await deletePatientFile(idRec);
      setFiles((prev) => prev.filter((f) => f.id !== idRec));
      showToast("Archivo eliminado.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo eliminar.", "error");
    }
  }

  async function onShare(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwner || isDeleted) {
      showToast("Solo el dueño puede compartir.", "error");
      return;
    }
    const email = shareEmail.trim();
    if (!/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      showToast("Email inválido.", "error");
      return;
    }
    setSharing(true);
    try {
      await addShare(id, email, shareCanEdit);
      setShareEmail("");
      setShareCanEdit(false);
      await refreshShares();
      showToast("Acceso compartido.", "success");
    } catch (err: any) {
      console.error(err);
      showToast(err?.message || "No se pudo compartir.", "error");
    } finally {
      setSharing(false);
    }
  }

  async function onRevoke(shareId: string) {
    if (!isOwner || isDeleted) return;
    if (!confirm("¿Quitar acceso?")) return;
    try {
      await revokeShare(shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      showToast("Acceso revocado.", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo revocar.", "error");
    }
  }

  async function onRestore() {
    try {
      const p = await restorePatient(id);
      setPatient(p);
      showToast("Paciente restaurado.", "success");
      refreshAudits();
    } catch (e: any) {
      console.error(e);
      showToast(e?.message || "No se pudo restaurar.", "error");
    }
  }

  if (loading)
    return (
      <main className="p-6 md:p-10">
        <p>Cargando…</p>
      </main>
    );

  if (!patient) {
    return (
      <main className="p-6 md:p-10">
        <div className="rounded-2xl border border-[var(--color-brand-border)] bg-white p-6">
          <p className="text-red-600">Paciente no encontrado.</p>
          <Link
            href="/pacientes"
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
          >
            <ColorEmoji token="atras" size={16} /> Volver
          </Link>
        </div>
      </main>
    );
  }

  const pdfName = `Paciente-${(patient?.nombre || "SinNombre").replace(/\s+/g,"_")}-${tsNow()}.pdf`;

  return (
    <main className="p-6 md:p-10 space-y-6">
      {/* Banner de eliminado con Restaurar */}
      {isDeleted && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="text-sm text-amber-800">
            Este paciente está en <strong>Eliminados</strong>. No se permiten nuevas notas, archivos ni compartir hasta restaurar.
          </div>
          <button
            onClick={() => void onRestore()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 hover:bg-[var(--color-brand-background)]"
          >
            <ColorEmoji token="refrescar" size={16} /> Restaurar
          </button>
        </div>
      )}

      {/* === ÁREA EXPORTABLE === */}
      <div ref={printRef} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-text)] flex items-center gap-3">
            <ColorEmoji token="usuario" size={24} /> {patient.nombre}
          </h1>
          <div className="flex flex-wrap items-center gap-2" data-html2canvas-ignore="true">
            <ExportPDFButton targetRef={printRef} fileName={pdfName} />
            {canEdit && !isDeleted && (
              <button
                onClick={openEditModal}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
              >
                <ColorEmoji token="puzzle" size={16} /> Editar
              </button>
            )}
            <Link
              href="/pacientes"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
            >
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

            <form onSubmit={onAddNote} className="space-y-3" data-html2canvas-ignore="true">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder={canEdit && !isDeleted ? "Escribe una nota clínica breve…" : "Solo lectura"}
                rows={3}
                disabled={!canEdit || isDeleted}
                className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 disabled:opacity-60"
              />
              <div className="flex gap-2">
                <button
                  disabled={savingNote || !canEdit || isDeleted}
                  className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
                >
                  <ColorEmoji token="guardar" size={16} />{" "}
                  {savingNote ? "Guardando…" : "Añadir nota"}
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
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-xl border bg-white p-4 ${n.pending ? "opacity-80 border-dashed" : "border-[var(--color-brand-border)]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-[var(--color-brand-text)] whitespace-pre-wrap">
                        {n.titulo ? <div className="font-medium mb-1">{n.titulo}</div> : null}
                        {n.contenido}
                        {n.pending && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-[var(--color-brand-bluegray)]">
                            <ColorEmoji token="refrescar" size={14} /> Pendiente
                          </span>
                        )}
                      </div>
                      {canEdit && !isDeleted && (
                        <button
                          onClick={() => askDeleteNote(n.id)}
                          className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                          title="Eliminar nota"
                          data-html2canvas-ignore="true"
                        >
                          <ColorEmoji token="borrar" size={14} /> Borrar
                        </button>
                      )}
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

      {/* Archivos clínicos */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
            <ColorEmoji token="carpeta" size={18} /> Archivos clínicos
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <label
              className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-brand-border)] bg-[var(--color-brand-background)] px-4 py-2 ${(!canEdit || isDeleted) ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:opacity-90"}`}
            >
              <ColorEmoji token="subir" size={18} /> {uploading ? "Subiendo…" : "Subir archivo"}
              <input type="file" onChange={onUpload} className="hidden" disabled={!canEdit || isDeleted} />
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
              {files.map((f) => (
                <li
                  key={f.id}
                  className={`rounded-2xl border p-4 bg-white ${f.pending ? "opacity-80 border-dashed" : "border-[var(--color-brand-border)]"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                      <ColorEmoji token="archivo" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[var(--color-brand-text)] text-sm font-medium"
                        title={f.file_name}
                      >
                        {f.file_name}{" "}
                        {f.pending && (
                          <span className="ml-2 text-xs text-[var(--color-brand-bluegray)]">
                            (Pendiente)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-brand-bluegray)]">
                        {f.mime_type || "desconocido"} ·{" "}
                        {f.size ? `${(f.size / 1024).toFixed(1)} KB` : ""}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!f.pending ? (
                          <>
                            <button
                              onClick={() => onView(f)}
                              className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1"
                            >
                              <ColorEmoji token="ver" size={14} /> Ver
                            </button>
                            <button
                              onClick={() => onCopy(f)}
                              className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1"
                            >
                              <ColorEmoji token="link" size={14} /> Copiar link
                            </button>
                            {canEdit && !isDeleted && (
                              <button
                                onClick={() => onDeleteFile(f.id)}
                                className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                              >
                                <ColorEmoji token="borrar" size={14} /> Eliminar
                              </button>
                            )}
                          </>
                        ) : (
                          <button
                            onClick={() => onDeleteFile(f.id)}
                            className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs inline-flex items-center gap-1"
                          >
                            <ColorEmoji token="borrar" size={14} /> Quitar pendiente
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Compartir (solo dueño) */}
      {isOwner && (
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="compartir" size={18} /> Compartir acceso
            </h2>

            <form onSubmit={onShare} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <input
                type="email"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                placeholder="email@dominio.com"
                className="sm:col-span-3 rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                disabled={isDeleted}
              />
              <label className="inline-flex items-center gap-2 px-2">
                <input
                  type="checkbox"
                  checked={shareCanEdit}
                  onChange={(e) => setShareCanEdit(e.target.checked)}
                  disabled={isDeleted}
                />
                Puede editar
              </label>
              <button
                className="rounded-xl bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                disabled={sharing || isDeleted}
              >
                <ColorEmoji token="enviar" size={16} /> {sharing ? "Compartiendo…" : "Compartir"}
              </button>
            </form>

            <div className="h-px bg-[var(--color-brand-border)]" />

            {shares.length === 0 ? (
              <p className="text-[var(--color-brand-bluegray)]">
                Aún no has compartido este paciente.
              </p>
            ) : (
              <ul className="space-y-2">
                {shares.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[var(--color-brand-text)] truncate">
                        {s.grantee_email}
                      </div>
                      <div className="text-xs text-[var(--color-brand-bluegray)]">
                        {s.can_edit ? "Puede editar" : "Solo lectura"}
                      </div>
                    </div>
                    <button
                      onClick={() => onRevoke(s.id)}
                      className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                      disabled={isDeleted}
                    >
                      <ColorEmoji token="borrar" size={14} /> Revocar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      {/* Actividad */}
      <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="actividad" size={18} /> Actividad
            </h2>
            <button
              type="button"
              onClick={refreshAudits}
              className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
            >
              <ColorEmoji token="refrescar" size={16} /> Actualizar
            </button>
          </div>

          {loadingAudits ? (
            <p className="text-[var(--color-brand-bluegray)]">Cargando actividad…</p>
          ) : audits.length === 0 ? (
            <p className="text-[var(--color-brand-bluegray)]">Sin eventos aún.</p>
          ) : (
            <ul className="space-y-2">
              {audits.map((a) => (
                <li
                  key={a.id}
                  className="rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-2 text-sm text-[var(--color-brand-text)]"
                >
                  {fmtAuditRow(a)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Modal Editar */}
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
              disabled={!canEdit || isDeleted}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Edad</span>
              <input
                value={edad}
                onChange={(e) => setEdad(e.target.value === "" ? "" : Number(e.target.value))}
                type="number"
                min={0}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                disabled={!canEdit || isDeleted}
              />
            </label>
            <label className="block">
              <span className="text-sm text-[var(--color-brand-text)]/80">Género</span>
              <select
                value={genero}
                onChange={(e) => setGenero(e.target.value as any)}
                className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                disabled={!canEdit || isDeleted}
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
              disabled={savingEdit || !canEdit || isDeleted}
              className="rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
            >
              <ColorEmoji token="guardar" size={16} />{" "}
              {savingEdit ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación: eliminar nota */}
      <Modal
        open={!!confirmNoteId}
        onClose={() => setConfirmNoteId(null)}
        title="Eliminar nota"
        widthClass="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-brand-text)]">
            ¿Seguro que deseas eliminar esta nota? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmNoteId(null)}
            className="rounded-md border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void doDeleteNote()}
            className="rounded-md bg-red-600 px-4 py-2 text-white hover:opacity-90"
          >
            Eliminar
          </button>
        </div>
      </Modal>
    </main>
  );
}
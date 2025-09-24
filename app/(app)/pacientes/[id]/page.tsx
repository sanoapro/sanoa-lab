"use client";
import { Button } from "@/components/ui/button";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import ColorEmoji from "@/components/ColorEmoji";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

import { getPatient, updatePatient, restorePatient, type Patient } from "@/lib/patients";
import {
  listNotes,
  createNote,
  deleteNote,
  updateNote,
  duplicateNote,
  type PatientNote,
} from "@/lib/patient-notes";
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
import {
  getTemplate, // (SOAP/DARE rápidas)
  listTemplates, // plantillas persistentes
  createTemplate,
  deleteTemplate,
  type NoteTemplate,
} from "@/lib/note-templates";
import { listAppointmentsByPatient, unlinkAppointment, type AppointmentLink } from "@/lib/appointments";
import { getCalRawByUid } from "@/lib/cal-raw";

// Etiquetas
import {
  listMyTags,
  listTagsOfPatient,
  assignTag,
  unassignTag,
  createTag,
  type Tag,
} from "@/lib/tags";

// === Historial de notas (tomado de V2) ===
import { listNoteVersions, type NoteVersion } from "@/lib/note-versions";
import NoteDiff from "@/components/NoteDiff";

type PendingNote = PatientNote & { pending?: boolean };
type PendingFile = PatientFile & { pending?: boolean };

function tsNow() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(
    d.getMinutes(),
  )}`;
}

// Normaliza errores (mejorado)
function toErrorMessage(e: unknown, fallback = "Ocurrió un error"): string {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === "string" && e.trim()) return e;

  // Respuesta HTTP fetch
  if (e && typeof e === "object" && "status" in (e as any) && "statusText" in (e as any)) {
    const res = e as Response;
    return `HTTP ${res.status} ${res.statusText}`.trim();
  }

  // Objetos comunes de Supabase/PostgREST/tu API
  if (e && typeof e === "object") {
    const any = e as any;
    const parts: string[] = [];
    if (typeof any.message === "string" && any.message) parts.push(any.message);
    if (typeof any.error_description === "string" && any.error_description) parts.push(any.error_description);
    if (typeof any.error === "string" && any.error) parts.push(any.error);
    if (typeof any.details === "string" && any.details) parts.push(any.details);
    if (typeof any.hint === "string" && any.hint) parts.push(any.hint);
    if (typeof any.code === "string" && any.code) parts.push(`code: ${any.code}`);
    if (parts.length) return parts.join(" · ");
  }

  // Último intento
  try {
    const s = JSON.stringify(e);
    if (s && s !== "{}") return s;
  } catch {}

  return fallback;
}

// === helpers para APIs con "motivo" (compatibles con tu lib de V2) ===
async function updateNoteWithReason(
  noteId: string,
  data: { titulo: string | null; contenido: string | null },
  reason: string | null,
) {
  // TS-friendly aunque la firma original no declare el 3er parámetro
  return await (updateNote as any)(noteId, data, reason);
}

async function deleteNoteWithReason(noteId: string, reason: string | null) {
  return await (deleteNote as any)(noteId, reason);
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
    (s) => (s.grantee_email || "").toLowerCase() === (meEmail || "").toLowerCase(),
  );
  const canEdit = Boolean(isOwner || myShare?.can_edit);
  const isDeleted = !!patient?.deleted_at;

  const [openEdit, setOpenEdit] = useState(false);
  const [nombre, setNombre] = useState("");
  const [edad, setEdad] = useState<number | "">("");
  const [genero, setGenero] = useState<"F" | "M" | "O">("O");
  const [savingEdit, setSavingEdit] = useState(false);

  const [notes, setNotes] = useState<PendingNote[]>([]);
  const [noteTitulo, setNoteTitulo] = useState("");
  const [noteContenido, setNoteContenido] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [loadingNotes, setLoadingNotes] = useState(true);

  // Edición de nota
  const [editNoteOpen, setEditNoteOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editTitulo, setEditTitulo] = useState("");
  const [editContenido, setEditContenido] = useState("");
  const [savingNoteEdit, setSavingNoteEdit] = useState(false);

  // Motivo de cambio / eliminación
  const [openReason, setOpenReason] = useState<{ noteId: string; action: "save" | "delete" } | null>(
    null,
  );
  const [reasonText, setReasonText] = useState("");

  // Historial de nota
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const [versions, setVersions] = useState<NoteVersion[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Archivos
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Compartir
  const [shareEmail, setShareEmail] = useState("");
  const [shareCanEdit, setShareCanEdit] = useState(false);
  const [sharing, setSharing] = useState(false);

  // Auditoría
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loadingAudits, setLoadingAudits] = useState(true);

  // Agenda
  const [appointments, setAppointments] = useState<AppointmentLink[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);

  // Confirmar borrado de nota (paso 1)
  const [confirmNoteId, setConfirmNoteId] = useState<string | null>(null);

  // Exportable
  const printRef = useRef<HTMLDivElement>(null);

  // Plantillas persistentes
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [tplName, setTplName] = useState("");
  const [tplScope, setTplScope] = useState<"personal" | "org">("personal");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  // Etiquetas
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [ptTags, setPtTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [loadingTags, setLoadingTags] = useState(false);

  // helper etiquetas
  const hasTag = useCallback((tid: string) => ptTags.some((t) => t.id === tid), [ptTags]);

  // === Autenticación ===
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setMeId(data.user?.id ?? null);
      setMeEmail(data.user?.email ?? null);
    })();
  }, [supabase]);

  // === Paciente ===
  useEffect(() => {
    (async () => {
      try {
        const p = await getPatient(id);
        setPatient(p);
        setNombre(p?.nombre ?? "");
        setEdad(p?.edad ?? "");
        setGenero((p?.genero as "F" | "M" | "O") ?? "O");
      } catch (e: unknown) {
        console.error("[getPatient]", toErrorMessage(e, "No se pudo cargar el paciente."));
        showToast(toErrorMessage(e, "No se pudo cargar el paciente."), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  // === Notas ===
  const refreshNotes = useCallback(async () => {
    setLoadingNotes(true);
    try {
      const data = await listNotes(id);
      setNotes(data);
    } catch (e: unknown) {
      console.error("[listNotes]", toErrorMessage(e, "No se pudieron cargar las notas."));
      showToast(toErrorMessage(e, "No se pudieron cargar las notas."), "error");
    } finally {
      setLoadingNotes(false);
    }
  }, [id]);

  useEffect(() => {
    refreshNotes();
  }, [refreshNotes]);

  // realtime
  useNotesRealtime(
    id,
    () => {
      refreshNotes();
    },
    250,
  );

  // === Archivos ===
  const refreshFiles = useCallback(async () => {
    setLoadingFiles(true);
    try {
      const data = await listPatientFiles(id);
      setFiles(data);
    } catch (e: unknown) {
      console.error("[listPatientFiles]", toErrorMessage(e, "No se pudieron cargar los archivos."));
      showToast(toErrorMessage(e, "No se pudieron cargar los archivos."), "error");
    } finally {
      setLoadingFiles(false);
    }
  }, [id]);

  useEffect(() => {
    refreshFiles();
  }, [refreshFiles]);

  // === Compartir ===
  const refreshShares = useCallback(async () => {
    try {
      const data = await listShares(id);
      setShares(data);
    } catch (e: unknown) {
      console.warn("[listShares]", toErrorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    refreshShares();
  }, [refreshShares]);

  // === Auditoría ===
  const refreshAudits = useCallback(async () => {
    setLoadingAudits(true);
    try {
      const data = await listAudit(id, 200);
      setAudits(data);
    } catch (e: unknown) {
      const msg = toErrorMessage(e, "No se pudo cargar la actividad.");
      // No es crítico → warn para no ensuciar la consola con "errores"
      console.warn("[listAudit]", msg);
      showToast(msg, "error");
    } finally {
      setLoadingAudits(false);
    }
  }, [id]);

  useEffect(() => {
    refreshAudits();
  }, [refreshAudits]);

  // === Agenda ===
  const refreshAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const ap = await listAppointmentsByPatient(id);
      setAppointments(ap || []);
    } catch (e: unknown) {
      const msg = toErrorMessage(e, "No se pudieron cargar la agenda.");
      console.error("[listAppointmentsByPatient]", msg);
      showToast(msg, "error");
    } finally {
      setLoadingAppointments(false);
    }
  }, [id]);

  useEffect(() => {
    refreshAppointments();
  }, [refreshAppointments]);

  // === Plantillas persistentes ===
  const refreshTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const list = await listTemplates?.(true);
      setTemplates(Array.isArray(list) ? list : []);
    } catch (e: unknown) {
      console.warn("[listTemplates]", toErrorMessage(e));
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  useEffect(() => {
    refreshTemplates();
  }, [refreshTemplates]);

  // === Etiquetas ===
  const refreshTags = useCallback(async () => {
    setLoadingTags(true);
    try {
      const [mine, assigned] = await Promise.all([listMyTags?.() ?? [], listTagsOfPatient?.(id) ?? []]);
      setAllTags(Array.isArray(mine) ? mine : []);
      setPtTags(Array.isArray(assigned) ? assigned : []);
    } catch (e: unknown) {
      console.warn("[tags]", toErrorMessage(e));
    } finally {
      setLoadingTags(false);
    }
  }, [id]);

  useEffect(() => {
    refreshTags();
  }, [refreshTags]);

  // === SW queue replay ===
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      const t = (e.data || ({} as any)).type;
      if (t === "queue:replay-success") {
        refreshNotes();
        refreshFiles();
      }
    };
    navigator.serviceWorker?.addEventListener?.("message", onMsg);
    return () => navigator.serviceWorker?.removeEventListener?.("message", onMsg);
  }, [refreshNotes, refreshFiles]);

  // === Plantillas rápidas ===
  function insertTemplate(key: "SOAP" | "DARE") {
    const t = getTemplate(key);
    setNoteTitulo(t.titulo || "");
    setNoteContenido(t.contenido || "");
  }

  // === Notas: crear ===
  async function onAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para agregar notas.", "error");
      return;
    }
    const titulo = noteTitulo.trim();
    const contenido = noteContenido.trim();
    if (!titulo && !contenido) {
      showToast("Título o contenido requerido.", "info");
      return;
    }
    setSavingNote(true);
    try {
      const n = await createNote(id, { titulo: titulo || null, contenido: contenido || null });
      setNotes((prev) => [n as PendingNote, ...prev]);
      setNoteTitulo("");
      setNoteContenido("");
      showToast("Nota guardada.", "success");
      refreshAudits();
    } catch (e: unknown) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        const temp: PendingNote = {
          id: `local-${Date.now()}`,
          patient_id: id,
          user_id: meId || "me",
          titulo: titulo || null,
          contenido: (contenido || "") + " (pendiente…)",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          pending: true,
        } as any;
        setNotes((prev) => [temp, ...prev]);
        setNoteTitulo("");
        setNoteContenido("");
        showToast("Nota encolada (sin conexión).", "info");
      } else {
        console.error("[createNote]", toErrorMessage(e, "No se pudo guardar la nota."));
        showToast(toErrorMessage(e, "No se pudo guardar la nota."), "error");
      }
    } finally {
      setSavingNote(false);
    }
  }

  // === Notas: editar (abre modal edición) ===
  function openEditNote(n: PatientNote) {
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para editar notas.", "error");
      return;
    }
    setEditingNoteId(n.id);
    setEditTitulo(n.titulo || "");
    setEditContenido(n.contenido || "");
    setEditNoteOpen(true);
  }

  // Al guardar desde el modal de edición → pedimos motivo
  function onSaveEditNote(e: React.FormEvent) {
    e.preventDefault();
    if (!editingNoteId) return;
    setOpenReason({ noteId: editingNoteId, action: "save" });
  }

  // === Notas: duplicar ===
  async function onDuplicateNote(nid: string) {
    try {
      const dup = await duplicateNote(nid);
      setNotes((arr) => [dup as PendingNote, ...arr]);
      showToast("Nota duplicada.", "success");
    } catch (e: unknown) {
      console.error("[duplicateNote]", toErrorMessage(e, "No se pudo duplicar la nota."));
      showToast(toErrorMessage(e, "No se pudo duplicar la nota."), "error");
    }
  }

  // === Notas: borrar (paso 1: confirmar) ===
  function askDeleteNote(nid: string) {
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para borrar notas.", "error");
      return;
    }
    setConfirmNoteId(nid);
  }

  // === Notas: borrar (paso 2: tras confirmar, pedimos motivo) ===
  function doDeleteNote() {
    const nid = confirmNoteId;
    if (!nid) return;
    setConfirmNoteId(null);
    setOpenReason({ noteId: nid, action: "delete" });
  }

  // === Guardar con motivo (desde modal "Motivo") ===
  async function doSaveWithReason() {
    if (!openReason || openReason.action !== "save" || !editingNoteId) return;
    setSavingNoteEdit(true);
    try {
      const nn = await updateNoteWithReason(
        editingNoteId,
        {
          titulo: (editTitulo || "").trim() || null,
          contenido: (editContenido || "").trim() || null,
        },
        reasonText.trim() || null,
      );
      setNotes((prev) => prev.map((x) => (x.id === editingNoteId ? (nn as PendingNote) : x)));
      setEditNoteOpen(false);
      setEditingNoteId(null);
      showToast("Nota actualizada.", "success");
      refreshAudits();
    } catch (e: unknown) {
      console.error("[updateNoteWithReason]", toErrorMessage(e, "No se pudo actualizar la nota."));
      showToast(toErrorMessage(e, "No se pudo actualizar la nota."), "error");
    } finally {
      setSavingNoteEdit(false);
      setOpenReason(null);
      setReasonText("");
    }
  }

  // === Eliminar con motivo (desde modal "Motivo") ===
  async function doDeleteWithReason() {
    if (!openReason || openReason.action !== "delete") return;
    const nid = openReason.noteId;
    try {
      await deleteNoteWithReason(nid, reasonText.trim() || null);
      setNotes((prev) => prev.filter((n) => n.id !== nid));
      showToast("Nota eliminada.", "success");
      refreshAudits();
    } catch (e: unknown) {
      console.error("[deleteNoteWithReason]", toErrorMessage(e, "No se pudo eliminar la nota."));
      showToast(toErrorMessage(e, "No se pudo eliminar la nota."), "error");
    } finally {
      setOpenReason(null);
      setReasonText("");
    }
  }

  // === Historial de una nota ===
  async function openHistoryFor(nid: string) {
    setOpenHistory(nid);
    setLoadingHistory(true);
    try {
      const v = await listNoteVersions(nid);
      setVersions(Array.isArray(v) ? v : []);
    } catch (e: unknown) {
      console.error("[listNoteVersions]", toErrorMessage(e, "No se pudo cargar el historial."));
      showToast(toErrorMessage(e, "No se pudo cargar el historial."), "error");
    } finally {
      setLoadingHistory(false);
    }
  }

  // === Editar paciente ===
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
      const updated = await updatePatient(id, {
        nombre: n,
        edad: eNum === "" ? null : (eNum as number),
        genero: genero as any,
      });
      setPatient(updated);
      setOpenEdit(false);
      showToast("Datos actualizados.", "success");
      refreshAudits();
    } catch (e: unknown) {
      console.error("[updatePatient]", toErrorMessage(e, "No se pudo actualizar."));
      showToast(toErrorMessage(e, "No se pudo actualizar."), "error");
    } finally {
      setSavingEdit(false);
    }
  }

  // === Archivos ===
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
    } catch (err: unknown) {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
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
        console.error("[uploadPatientFile]", toErrorMessage(err, "No se pudo subir el archivo."));
        showToast(toErrorMessage(err, "No se pudo subir el archivo."), "error");
      }
    } finally {
      setUploading(false);
    }
  }

  async function onView(pf: PatientFile) {
    try {
      const url = await getSignedUrl(pf, 300);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: unknown) {
      console.error("[getSignedUrl:view]", toErrorMessage(e, "No se pudo generar el enlace."));
      showToast(toErrorMessage(e, "No se pudo generar el enlace."), "error");
    }
  }

  async function onCopy(pf: PatientFile) {
    try {
      const url = await getSignedUrl(pf, 300);
      await navigator.clipboard.writeText(url);
    } catch (e: unknown) {
      console.error("[getSignedUrl:copy]", toErrorMessage(e, "No se pudo copiar el enlace."));
      showToast(toErrorMessage(e, "No se pudo copiar el enlace."), "error");
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
    } catch (e: unknown) {
      console.error("[deletePatientFile]", toErrorMessage(e, "No se pudo eliminar."));
      showToast(toErrorMessage(e, "No se pudo eliminar."), "error");
    }
  }

  // === Compartir ===
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
    } catch (e: unknown) {
      console.error("[addShare]", toErrorMessage(e, "No se pudo compartir."));
      showToast(toErrorMessage(e, "No se pudo compartir."), "error");
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
    } catch (e: unknown) {
      console.error("[revokeShare]", toErrorMessage(e, "No se pudo revocar."));
      showToast(toErrorMessage(e, "No se pudo revocar."), "error");
    }
  }

  async function onRestore() {
    try {
      const p = await restorePatient(id);
      setPatient(p);
      showToast("Paciente restaurado.", "success");
      refreshAudits();
    } catch (e: unknown) {
      console.error("[restorePatient]", toErrorMessage(e, "No se pudo restaurar."));
      showToast(toErrorMessage(e, "No se pudo restaurar."), "error");
    }
  }

  // === Agenda ===
  async function onUnlinkAppointment(appId: string) {
    if (!confirm("¿Desvincular esta cita del paciente?")) return;
    try {
      await unlinkAppointment(appId);
      setAppointments((prev) => prev.filter((a) => a.id !== appId));
      showToast("Cita desvinculada.", "success");
    } catch (e: unknown) {
      console.error("[unlinkAppointment]", toErrorMessage(e, "No se pudo desvincular la cita."));
      showToast(toErrorMessage(e, "No se pudo desvincular la cita."), "error");
    }
  }

  async function createNoteFromBooking(calUid: string) {
    if (!canEdit || isDeleted) {
      showToast("No tienes permisos para crear notas.", "error");
      return;
    }
    try {
      const raw: any = await getCalRawByUid(calUid);
      const ap = appointments.find((a) => (a as any).cal_uid === calUid) || null;

      const start = new Date(ap?.start || raw?.start || "");
      const end = new Date(ap?.end || raw?.end || "");
      const title = ap?.title || raw?.payload?.title || raw?.payload?.eventTitle || "Cita";
      const status = (ap as any)?.status || raw?.status || raw?.payload?.status || "UNKNOWN";
      const meetingUrl =
        ap?.meeting_url ||
        raw?.payload?.videoCallUrl ||
        raw?.payload?.meetingUrl ||
        raw?.payload?.location ||
        "";

      const hosts = raw?.payload?.hosts || (raw?.payload?.organizer ? [raw?.payload?.organizer] : []);
      const attendees = raw?.payload?.attendees || [];

      const hostsStr = hosts
        .map((h: any) => `${h?.name || ""}${h?.email ? ` <${h.email}>` : ""}`)
        .filter(Boolean)
        .join(", ");

      const attStr = attendees
        .map((a: any) => `${a?.name || ""}${a?.email ? ` <${a.email}>` : ""}`)
        .filter(Boolean)
        .join(", ");

      const noteTitle = `Cita: ${title} — ${isNaN(start.getTime()) ? "" : start.toLocaleString()}`.trim();
      const noteBody = [
        "Resumen de cita",
        `- Estado: ${status}`,
        `- Inicio: ${isNaN(start.getTime()) ? "—" : start.toLocaleString()}`,
        `- Fin: ${isNaN(end.getTime()) ? "—" : end.toLocaleString()}`,
        `- Enlace: ${meetingUrl || "—"}`,
        `- Hosts: ${hostsStr || "—"}`,
        `- Asistentes: ${attStr || "—"}`,
        `- UID: ${calUid}`,
        "",
        "Notas clínicas:",
        "- Motivo / Objetivo:",
        "- Observaciones:",
        "- Impresión clínica:",
        "- Plan y seguimiento:",
      ].join("\n");

      const n = await createNote(id, { titulo: noteTitle, contenido: noteBody });
      setNotes((arr) => [n as PendingNote, ...arr]);
      showToast("Nota creada desde cita.", "success");
      refreshAudits();
    } catch (e: unknown) {
      console.error("[createNoteFromBooking]", toErrorMessage(e, "No se pudo crear la nota desde la cita."));
      showToast(toErrorMessage(e, "No se pudo crear la nota desde la cita."), "error");
    }
  }

  // === Export CSV ===
  function csvURL() {
    return `/api/export/paciente/${id}/csv`;
  }

  if (loading) {
    return (
      <main className="p-6 md:p-10">
        <p>Cargando…</p>
      </main>
    );
  }

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

  const pdfName = `Paciente-${(patient?.nombre || "SinNombre").replace(/\s+/g, "_")}-${tsNow()}.pdf`;

  return (
    <main className="p-6 md:p-10 space-y-6">
      {/* Banner de eliminado con Restaurar */}
      {isDeleted && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-center justify-between">
          <div className="text-sm text-amber-800">
            Este paciente está en <strong>Eliminados</strong>. No se permiten nuevas notas, archivos ni compartir hasta
            restaurar.
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
        </div>

        <div className="flex flex-wrap items-center gap-2" data-html2canvas-ignore="true">
          {/* CSV */}
          <a
            href={csvURL()}
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
          >
            <ColorEmoji token="descargar" size={16} /> CSV
          </a>

          {/* SIN botón a V2 */}

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

        {/* Etiquetas */}
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-3">
            <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="etiquetas" size={18} /> Etiquetas
            </h2>

            {loadingTags ? (
              <p className="text-[var(--color-brand-bluegray)]">Cargando etiquetas…</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  {allTags.length === 0 ? (
                    <span className="text-sm text-[var(--color-brand-bluegray)]">Aún no tienes etiquetas.</span>
                  ) : (
                    allTags.map((t) => {
                      const active = hasTag(t.id);
                      return (
                        <button
                          key={t.id}
                          onClick={async () => {
                            if (!canEdit || isDeleted) return;
                            try {
                              if (active) {
                                await unassignTag(id, t.id);
                                setPtTags((arr) => arr.filter((x) => x.id !== t.id));
                              } else {
                                await assignTag(id, t.id);
                                setPtTags((arr) => [...arr, t]);
                              }
                            } catch (e: unknown) {
                              showToast(toErrorMessage(e, "No se pudo actualizar la etiqueta."), "error");
                            }
                          }}
                          disabled={!canEdit || isDeleted}
                          className={`px-3 py-1 rounded-full text-sm border ${
                            active
                              ? "bg-[var(--color-brand-primary)] text-white border-[var(--color-brand-primary)]"
                              : "bg-white text-[var(--color-brand-text)]"
                          }`}
                        >
                          {t.name}
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="flex gap-2 items-center" data-html2canvas-ignore="true">
                  <input
                    placeholder="Nueva etiqueta…"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    disabled={!canEdit || isDeleted}
                    className="rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
                  />
                  <button
                    onClick={async () => {
                      const name = newTagName.trim();
                      if (!name) return;
                      try {
                        const t = await createTag(name);
                        setAllTags((arr) => [...arr, t]);
                        await assignTag(id, t.id);
                        setPtTags((arr) => [...arr, t]);
                        setNewTagName("");
                      } catch (e: unknown) {
                        showToast(toErrorMessage(e, "No se pudo crear/asignar la etiqueta."), "error");
                      }
                    }}
                    disabled={!canEdit || isDeleted || !newTagName.trim()}
                    className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
                  >
                    <ColorEmoji token="agregar" size={16} /> Crear y asignar
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Notas clínicas */}
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="puzzle" size={18} /> Notas clínicas
            </h2>

            {/* Plantillas rápidas */}
            <div className="flex flex-wrap gap-2" data-html2canvas-ignore="true">
              <button
                type="button"
                onClick={() => insertTemplate("SOAP")}
                disabled={!canEdit || isDeleted}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] disabled:opacity-60"
              >
                <ColorEmoji token="puzzle" size={16} /> Insertar plantilla SOAP
              </button>
              <button
                type="button"
                onClick={() => insertTemplate("DARE")}
                disabled={!canEdit || isDeleted}
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] disabled:opacity-60"
              >
                <ColorEmoji token="puzzle" size={16} /> Insertar plantilla DARE
              </button>
            </div>

            {/* Plantillas persistentes */}
            <div className="rounded-xl border border-[var(--color-brand-border)] bg-white/80 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-medium text-[var(--color-brand-text)]">Plantillas guardadas</div>
                <button
                  type="button"
                  onClick={refreshTemplates}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-brand-border)] px-2 py-1 hover:bg-[var(--color-brand-background)]"
                >
                  <ColorEmoji token="refrescar" size={14} /> Actualizar
                </button>
              </div>

              {loadingTemplates ? (
                <div className="text-sm text-[var(--color-brand-bluegray)]">Cargando plantillas…</div>
              ) : templates.length === 0 ? (
                <div className="text-sm text-[var(--color-brand-bluegray)]">Aún no tienes plantillas guardadas.</div>
              ) : (
                <ul className="flex flex-wrap gap-2">
                  {templates.map((t) => (
                    <li key={t.id} className="flex items-center gap-2 rounded-full border px-3 py-1 bg-white">
                      <button
                        type="button"
                        onClick={() => {
                          const body = t.body ?? "";
                          const [first, ...rest] = body.split("\n\n");
                          if (first && rest.length > 0) {
                            setNoteTitulo(first);
                            setNoteContenido(rest.join("\n\n"));
                          } else {
                            setNoteContenido(body);
                          }
                        }}
                        className="text-sm underline"
                        title="Aplicar plantilla"
                      >
                        {t.name}
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await deleteTemplate(t.id);
                            setTemplates((arr) => arr.filter((x) => x.id !== t.id));
                          } catch (e: unknown) {
                            showToast(toErrorMessage(e, "No se pudo eliminar la plantilla."), "error");
                          }
                        }}
                        className="text-xs text-[var(--color-brand-bluegray)]"
                        title="Eliminar plantilla"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" data-html2canvas-ignore="true">
                <input
                  placeholder="Nombre de plantilla…"
                  value={tplName}
                  onChange={(e) => setTplName(e.target.value)}
                  className="rounded-lg border border-[var(--color-brand-border)] bg-white px-3 py-2"
                />
                <select
                  value={tplScope}
                  onChange={(e) => setTplScope(e.target.value as "personal" | "org")}
                  className="rounded-lg border border-[var(--color-brand-border)] bg-white px-3 py-2"
                >
                  <option value="personal">Personal</option>
                  <option value="org">Organización activa</option>
                </select>
                <button
                  type="button"
                  onClick={async () => {
                    if (!tplName.trim() || (!noteTitulo.trim() && !noteContenido.trim())) {
                      showToast("Pon nombre y contenido/título para guardar plantilla.", "info");
                      return;
                    }
                    try {
                      const tpl = await createTemplate(
                        tplName.trim(),
                        `${noteTitulo ? noteTitulo + "\n\n" : ""}${noteContenido}`,
                        tplScope,
                      );
                      setTemplates((arr) => [tpl, ...arr]);
                      setTplName("");
                      showToast("Plantilla guardada.", "success");
                    } catch (e: unknown) {
                      showToast(toErrorMessage(e, "No se pudo guardar la plantilla."), "error");
                    }
                  }}
                  className="rounded-lg border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)]"
                >
                  Guardar como plantilla
                </button>
              </div>
            </div>

            {/* Inputs para nueva nota */}
            <form onSubmit={onAddNote} className="space-y-3" data-html2canvas-ignore="true">
              <input
                value={noteTitulo}
                onChange={(e) => setNoteTitulo(e.target.value)}
                placeholder={canEdit && !isDeleted ? "Título (opcional)…" : "Solo lectura"}
                disabled={!canEdit || isDeleted}
                className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 disabled:opacity-60"
              />
              <textarea
                value={noteContenido}
                onChange={(e) => setNoteContenido(e.target.value)}
                placeholder={canEdit && !isDeleted ? "Contenido de la nota…" : "Solo lectura"}
                rows={3}
                disabled={!canEdit || isDeleted}
                className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2 disabled:opacity-60"
              />
              <div className="flex gap-2">
                <button
                  disabled={savingNote || !canEdit || isDeleted}
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
                {notes.map((n) => (
                  <li
                    key={n.id}
                    className={`rounded-xl border bg-white p-4 ${
                      n.pending ? "opacity-80 border-dashed" : "border-[var(--color-brand-border)]"
                    }`}
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
                        <div className="flex flex-wrap gap-2" data-html2canvas-ignore="true">
                          {/* Historial */}
                          <button
                            onClick={() => void openHistoryFor(n.id)}
                            className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1"
                            title="Historial de cambios"
                          >
                            <ColorEmoji token="actividad" size={14} /> Historial
                          </button>

                          {/* Duplicar */}
                          <button
                            onClick={() => void onDuplicateNote(n.id)}
                            className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1"
                            title="Duplicar nota"
                          >
                            <ColorEmoji token="copiar" size={14} /> Duplicar
                          </button>

                          <button
                            onClick={() => openEditNote(n)}
                            className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1"
                            title="Editar nota"
                          >
                            <ColorEmoji token="puzzle" size={14} /> Editar
                          </button>
                          <button
                            onClick={() => askDeleteNote(n.id)}
                            className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                            title="Eliminar nota"
                          >
                            <ColorEmoji token="borrar" size={14} /> Borrar
                          </button>
                        </div>
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

        {/* Agenda */}
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
                <ColorEmoji token="calendario" size={18} /> Agenda
              </h2>
              <button
                type="button"
                onClick={refreshAppointments}
                className="rounded-xl border border-[var(--color-brand-border)] px-3 py-2 hover:bg-[var(--color-brand-background)] inline-flex items-center gap-2"
              >
                <ColorEmoji token="refrescar" size={16} /> Actualizar
              </button>
            </div>

            {loadingAppointments ? (
              <p className="text-[var(--color-brand-bluegray)]">Cargando agenda…</p>
            ) : appointments.length === 0 ? (
              <p className="text-[var(--color-brand-bluegray)]">Este paciente aún no tiene citas vinculadas.</p>
            ) : (
              <ul className="space-y-2">
                {appointments.map((a: any) => (
                  <li
                    key={a.id}
                    className="flex items-start justify-between rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[var(--color-brand-text)] truncate font-medium">
                        {a.title || "Cita"}
                      </div>
                      <div className="text-xs text-[var(--color-brand-bluegray)]">
                        {new Date(a.start).toLocaleString()} – {new Date(a.end).toLocaleTimeString()}
                        {a.status ? ` · ${a.status}` : ""}
                      </div>
                      {a.meeting_url && (
                        <div className="text-xs text-[var(--color-brand-bluegray)] break-all">{a.meeting_url}</div>
                      )}
                    </div>
                    <div className="flex gap-2" data-html2canvas-ignore="true">
                      {a.meeting_url && (
                        <button
                          onClick={() =>
                            window.open(a.meeting_url as string, "_blank", "noopener,noreferrer")
                          }
                          className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1"
                        >
                          <ColorEmoji token="link" size={14} /> Abrir
                        </button>
                      )}
                      <button
                        onClick={() => void createNoteFromBooking(a.cal_uid)}
                        className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs hover:bg-[var(--color-brand-background)] inline-flex items-center gap-1 disabled:opacity-60"
                        disabled={isDeleted || !a?.cal_uid}
                        title={a?.cal_uid ? "Crear nota desde esta cita" : "Sin UID de cita"}
                      >
                        <ColorEmoji token="puzzle" size={14} /> Crear nota
                      </button>
                      <button
                        onClick={() => void onUnlinkAppointment(a.id)}
                        className="rounded-md border border-red-300 text-red-700 px-2 py-1 text-xs hover:bg-red-50 inline-flex items-center gap-1 disabled:opacity-60"
                        disabled={isDeleted}
                        title="Desvincular cita"
                      >
                        <ColorEmoji token="borrar" size={14} /> Desvincular
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs text-[var(--color-brand-bluegray)]">
              Para vincular nuevas citas, ve a <span className="underline">/agenda</span> → “Vincular a paciente”.
            </p>
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

          <div className="flex flex-wrap items-center gap-3" data-html2canvas-ignore="true">
            <label
              className={`inline-flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-brand-border)] bg-[var(--color-brand-background)] px-4 py-2 ${
                !canEdit || isDeleted ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:opacity-90"
              }`}
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
              {files.map((f: any) => (
                <li
                  key={f.id}
                  className={`rounded-2xl border p-4 bg-white ${
                    f.pending ? "opacity-80 border-dashed" : "border-[var(--color-brand-border)]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl p-3 border border-[var(--color-brand-border)] bg-[var(--color-brand-background)]">
                      <ColorEmoji token="archivo" size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[var(--color-brand-text)] text-sm font-medium" title={f.file_name}>
                        {f.file_name}{" "}
                        {f.pending && (
                          <span className="ml-2 text-xs text-[var(--color-brand-bluegray)]">(Pendiente)</span>
                        )}
                      </div>
                      <div className="text-xs text-[var(--color-brand-bluegray)]">
                        {f.mime_type || "desconocido"} · {f.size ? `${(f.size / 1024).toFixed(1)} KB` : ""}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2" data-html2canvas-ignore="true">
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

      {/* Permisos por paciente (simple) */}
      <section className="space-y-3 mt-8">
        <h2 className="text-xl font-semibold">Permisos del paciente (simple)</h2>
        <p className="text-sm text-gray-600">
          Para uso rápido: requiere conocer el <code>user_id</code> del usuario (puedes listar usuarios en Supabase Auth).
          En próximas etapas lo haremos por email con invitación.
        </p>
        {/* Aquí podrías insertar una UI más completa si lo deseas */}
      </section>

      {/* Compartir (solo dueño) */}
      {isOwner && (
        <section className="rounded-3xl bg-white/95 border border-[var(--color-brand-border)] shadow-[0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden">
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--color-brand-text)] flex items-center gap-2">
              <ColorEmoji token="compartir" size={18} /> Compartir acceso
            </h2>

            <form onSubmit={onShare} className="grid grid-cols-1 sm:grid-cols-5 gap-3" data-html2canvas-ignore="true">
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
              <p className="text-[var(--color-brand-bluegray)]">Aún no has compartido este paciente.</p>
            ) : (
              <ul className="space-y-2">
                {shares.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-brand-border)] bg-white px-4 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-[var(--color-brand-text)] truncate">{s.grantee_email}</div>
                      <div className="text-xs text-[var(--color-brand-bluegray)]">
                        {s.can_edit ? "Puede editar" : "Solo lectura"}
                      </div>
                    </div>
                    <button
                      onClick={() => onRevoke(s.id)}
                      className="rounded-md border border-[var(--color-brand-border)] px-2 py-1 text-xs text-red-600 hover:bg-red-50 inline-flex items-center gap-1"
                      disabled={isDeleted}
                      data-html2canvas-ignore="true"
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

      {/* Modal Editar paciente */}
      <Modal open={openEdit} onClose={() => setOpenEdit(false)} title="Editar paciente" widthClass="max-w-xl">
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
              <ColorEmoji token="guardar" size={16} /> {savingEdit ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmación: eliminar nota (paso 1) */}
      <Modal open={!!confirmNoteId} onClose={() => setConfirmNoteId(null)} title="Eliminar nota" widthClass="max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-brand-text)]">
            ¿Seguro que deseas eliminar esta nota? Después te pediremos un motivo breve para la auditoría.
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

      {/* Modal Editar nota (paso de edición) */}
      <Modal open={editNoteOpen} onClose={() => setEditNoteOpen(false)} title="Editar nota" widthClass="max-w-md">
        <form onSubmit={onSaveEditNote} className="space-y-3">
          <label className="block">
            <span className="text-sm text-[var(--color-brand-text)]/80">Título</span>
            <input
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              disabled={!canEdit || isDeleted}
            />
          </label>
          <label className="block">
            <span className="text-sm text-[var(--color-brand-text)]/80">Contenido</span>
            <textarea
              rows={6}
              value={editContenido}
              onChange={(e) => setEditContenido(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
              disabled={!canEdit || isDeleted}
            />
          </label>
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditNoteOpen(false)}
              className="rounded-md border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)]"
            >
              Cancelar
            </button>
            <button
              disabled={savingNoteEdit || !canEdit || isDeleted}
              className="rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
              title="Se solicitará un motivo"
            >
              <ColorEmoji token="guardar" size={16} /> {savingNoteEdit ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Motivo (paso final: guardar/eliminar con razón) */}
      <Modal open={!!openReason} onClose={() => setOpenReason(null)} title="Motivo" widthClass="max-w-md">
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-brand-bluegray)]">
            Ingresa un motivo breve para la auditoría (ej. “Corrección de typo”).
          </p>
          <input
            value={reasonText}
            onChange={(e) => setReasonText(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-brand-border)] bg-white px-3 py-2"
            placeholder="Motivo (opcional)"
          />
        </div>
        <div className="pt-3 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpenReason(null)}
            className="rounded-md border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)]"
          >
            Cancelar
          </button>
          {openReason?.action === "save" ? (
            <button
              type="button"
              onClick={() => void doSaveWithReason()}
              className="rounded-md bg-[var(--color-brand-primary)] px-4 py-2 text-white hover:opacity-90"
            >
              Guardar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void doDeleteWithReason()}
              className="rounded-md bg-red-600 px-4 py-2 text-white hover:opacity-90"
            >
              Eliminar
            </button>
          )}
        </div>
      </Modal>

      {/* Modal Historial/diffs */}
      <Modal open={!!openHistory} onClose={() => setOpenHistory(null)} title="Historial de la nota" widthClass="max-w-2xl">
        <div className="max-h-[60vh] overflow-auto space-y-4">
          {loadingHistory && <div className="text-sm">Cargando…</div>}
          {!loadingHistory && versions.length === 0 && (
            <div className="text-sm text-[var(--color-brand-bluegray)]">Sin versiones.</div>
          )}
          {!loadingHistory &&
            versions.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 bg-white">
                <div className="text-xs text-[var(--color-brand-bluegray)] mb-2">
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
          <button
            type="button"
            onClick={() => setOpenHistory(null)}
            className="rounded-md border border-[var(--color-brand-border)] px-4 py-2 hover:bg-[var(--color-brand-background)]"
          >
            Cerrar
          </button>
        </div>
      </Modal>
    </main>
  );
}

// lib/patient-notes.ts
import { getSupabaseBrowser } from "./supabase-browser";

export interface PatientNote {
  id: string;
  patient_id: string;
  user_id: string;
  org_id?: string | null;
  titulo: string | null;
  contenido: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface NoteInput {
  titulo?: string | null;
  contenido?: string | null;
}

/** Convierte fila DB -> modelo UI */
function mapDbToUi(row: any): PatientNote {
  let titulo: string | null = null;
  let contenido: string | null = null;
  if (typeof row?.content === "string") {
    try {
      const j = JSON.parse(row.content);
      titulo = j?.titulo ?? null;
      contenido = j?.contenido ?? null;
    } catch {
      contenido = row.content;
    }
  } else if (row?.content && typeof row.content === "object") {
    titulo = row.content.titulo ?? null;
    contenido = row.content.contenido ?? null;
  }
  return {
    id: row.id,
    patient_id: row.patient_id,
    user_id: row.user_id,
    org_id: row.org_id ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted_at: row.deleted_at ?? null,
    titulo,
    contenido,
  };
}

/** Convierte modelo UI -> payload DB (guarda JSON en `content`) */
function mapUiToDbPayload(input: NoteInput) {
  return {
    content: JSON.stringify({ titulo: input.titulo ?? null, contenido: input.contenido ?? null }),
  };
}

/** Cache simple para saber si existe deleted_at */
let _softDeleteSupported: boolean | null = null;
async function notesSoftDeleteSupported(): Promise<boolean> {
  if (_softDeleteSupported !== null) return _softDeleteSupported;
  const supabase = getSupabaseBrowser();
  try {
    const { error } = await supabase.from("patient_notes").select("deleted_at").limit(1);
    _softDeleteSupported = !error;
  } catch {
    _softDeleteSupported = false;
  }
  return _softDeleteSupported!;
}

/** LISTAR */
export async function listNotes(
  patientId: string,
  opts: { includeDeleted?: boolean } = {},
): Promise<PatientNote[]> {
  const supabase = getSupabaseBrowser();
  let q = supabase
    .from("patient_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  const hasSoft = await notesSoftDeleteSupported();
  if (hasSoft && !opts.includeDeleted) q = q.is("deleted_at", null);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map(mapDbToUi);
}

/** CREAR */
export async function createNote(patientId: string, input: NoteInput): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const { data: auth, error: eAuth } = await supabase.auth.getUser();
  if (eAuth || !auth?.user) throw new Error("No hay sesión activa.");

  const payload = {
    patient_id: patientId,
    user_id: auth.user.id,
    ...mapUiToDbPayload({ titulo: input.titulo ?? null, contenido: input.contenido ?? null }),
  };

  const { data, error } = await supabase.from("patient_notes").insert(payload).select("*").single();
  if (error) throw error;
  return mapDbToUi(data);
}

/** ACTUALIZAR */
export async function updateNote(id: string, patch: NoteInput): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const payload = mapUiToDbPayload({
    ...(typeof patch.titulo !== "undefined" ? { titulo: patch.titulo } : {}),
    ...(typeof patch.contenido !== "undefined" ? { contenido: patch.contenido } : {}),
  });

  const { data, error } = await supabase
    .from("patient_notes")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDbToUi(data);
}

/** BORRAR (soft si existe columna; si no, hard) */
export async function deleteNote(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const hasSoft = await notesSoftDeleteSupported();
  if (hasSoft) {
    const { error } = await supabase
      .from("patient_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("patient_notes").delete().eq("id", id);
    if (error) throw error;
  }
}

/** RESTAURAR (requiere deleted_at) */
export async function restoreNote(id: string): Promise<PatientNote> {
  const hasSoft = await notesSoftDeleteSupported();
  if (!hasSoft) throw new Error("Restaurar no soportado: falta 'deleted_at' en patient_notes.");
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_notes")
    .update({ deleted_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return mapDbToUi(data);
}

/** DUPLICAR */
export async function duplicateNote(noteId: string): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const { data: original, error: e1 } = await supabase
    .from("patient_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();
  if (e1) throw e1;
  if (!original) throw new Error("Nota no encontrada.");

  const { data: auth, error: eAuth } = await supabase.auth.getUser();
  if (eAuth || !auth?.user) throw new Error("No hay sesión activa.");

  const now = new Date();
  // Título de la copia: usa el título original si existe (deserializando)
  let orig = mapDbToUi(original);
  const copyTitle = orig.titulo
    ? `${orig.titulo} (copia ${now.toLocaleString()})`
    : `Copia ${now.toLocaleString()}`;

  const payload = {
    patient_id: original.patient_id,
    user_id: auth.user.id,
    ...mapUiToDbPayload({ titulo: copyTitle, contenido: orig.contenido ?? null }),
  };

  const { data, error } = await supabase.from("patient_notes").insert(payload).select("*").single();
  if (error) throw error;
  return mapDbToUi(data);
}

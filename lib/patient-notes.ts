import { getSupabaseBrowser } from "./supabase-browser";

export interface PatientNote {
  id: string;
  patient_id: string;
  user_id: string;
  titulo: string | null;
  contenido: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface NoteInput {
  titulo?: string | null;
  contenido?: string | null;
}

/**
 * Lista notas de un paciente. Por defecto excluye las borradas (soft-delete).
 * Usa listNotes(patientId, { includeDeleted: true }) para incluirlas.
 */
export async function listNotes(
  patientId: string,
  opts: { includeDeleted?: boolean } = {},
): Promise<PatientNote[]> {
  const supabase = getSupabaseBrowser();

  let query = supabase
    .from("patient_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });

  if (!opts.includeDeleted) {
    query = query.is("deleted_at", null);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as PatientNote[];
}

/** Crea una nota (título y/o contenido opcional) */
export async function createNote(
  patientId: string,
  input: NoteInput,
): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const { data: auth, error: eAuth } = await supabase.auth.getUser();
  if (eAuth || !auth.user) throw new Error("No hay sesión activa.");

  const payload = {
    patient_id: patientId,
    user_id: auth.user.id,
    titulo: input.titulo ?? null,
    contenido: input.contenido ?? null,
  };

  const { data, error } = await supabase
    .from("patient_notes")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;
  return data as PatientNote;
}

/** Actualiza campos de una nota (parcial) */
export async function updateNote(
  id: string,
  patch: NoteInput,
): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_notes")
    .update({
      ...(typeof patch.titulo !== "undefined" ? { titulo: patch.titulo } : {}),
      ...(typeof patch.contenido !== "undefined" ? { contenido: patch.contenido } : {}),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as PatientNote;
}

/** Soft-delete: marca deleted_at (no borra físicamente) */
export async function deleteNote(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("patient_notes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/** Restaura una nota (borra deleted_at) */
export async function restoreNote(id: string): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_notes")
    .update({ deleted_at: null })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientNote;
}

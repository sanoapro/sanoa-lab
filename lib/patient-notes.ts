// /workspaces/sanoa-lab/lib/patient-notes.ts
import { getSupabaseBrowser } from "./supabase-browser";

export interface PatientNote {
  id: string;
  patient_id: string;
  user_id: string;
  titulo: string | null;
  contenido: string | null;
  created_at: string;
  updated_at: string;
  /** Puede no existir si tu DB aún no tiene esta columna */
  deleted_at?: string | null;
}

export interface NoteInput {
  titulo?: string | null;
  contenido?: string | null;
}

/** Cache local para no checar el esquema en cada llamada */
let _softDeleteSupported: boolean | null = null;

/** Detecta si existe la columna deleted_at en patient_notes (para soft-delete) */
async function notesSoftDeleteSupported(): Promise<boolean> {
  if (_softDeleteSupported !== null) return _softDeleteSupported;
  const supabase = getSupabaseBrowser();
  try {
    const { error } = await supabase.from("patient_notes").select("deleted_at").limit(1);
    if (error) {
      const msg = String((error as any)?.message || "").toLowerCase();
      _softDeleteSupported = !(msg.includes("deleted_at") && msg.includes("does not exist"));
    } else {
      _softDeleteSupported = true;
    }
  } catch {
    // Ante errores inesperados, asumimos que sí existe para no romper UX
    _softDeleteSupported = true;
  }
  return _softDeleteSupported!;
}

/** Heurística para detectar que una RPC no existe y degradar sin romper UX */
function isMissingRpc(err: unknown, rpcName: string): boolean {
  const s = String((err as any)?.message || (err as any)?.details || "").toLowerCase();
  return s.includes("function") && s.includes(rpcName.toLowerCase()) && s.includes("does not exist");
}

/**
 * Lista notas de un paciente. Por defecto excluye las borradas (soft-delete),
 * siempre que la columna 'deleted_at' exista en la tabla.
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

  const hasSoft = await notesSoftDeleteSupported();
  if (hasSoft && !opts.includeDeleted) {
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
  if (eAuth || !auth?.user) throw new Error("No hay sesión activa.");

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

/**
 * Actualiza campos de una nota (parcial).
 * Si se proporciona `reason`, intenta usar la RPC `update_note_with_reason`.
 * Si la RPC no existe, degrada al update normal.
 */
export async function updateNote(
  id: string,
  patch: NoteInput,
  reason?: string | null,
): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();

  // Intento con RPC si llega reason
  if (typeof reason !== "undefined" && reason !== null) {
    try {
      const { data, error } = await supabase
        .rpc("update_note_with_reason", {
          p_note_id: id,
          p_titulo: typeof patch.titulo !== "undefined" ? patch.titulo : null,
          p_contenido: typeof patch.contenido !== "undefined" ? patch.contenido : null,
          p_reason: reason,
        })
        .single();
      if (error) {
        if (!isMissingRpc(error, "update_note_with_reason")) throw error;
        // Si la RPC no existe, caemos al update normal
      } else {
        return data as PatientNote;
      }
    } catch (e) {
      if (!isMissingRpc(e, "update_note_with_reason")) throw e;
      // degradación silenciosa a update normal
    }
  }

  // Update normal (compatibilidad)
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

/**
 * Borra una nota.
 * - Con `reason`: intenta RPC `delete_note_with_reason`; si no existe, degrada a soft/hard-delete.
 * - Sin `reason`: comportamiento original (soft-delete si existe columna; si no, hard-delete).
 */
export async function deleteNote(id: string, reason?: string | null): Promise<void> {
  const supabase = getSupabaseBrowser();

  if (typeof reason !== "undefined" && reason !== null) {
    try {
      const { error } = await supabase.rpc("delete_note_with_reason", {
        p_note_id: id,
        p_reason: reason,
      });
      if (error) {
        if (!isMissingRpc(error, "delete_note_with_reason")) throw error;
        // si la RPC no existe, degradamos
      } else {
        return;
      }
    } catch (e) {
      if (!isMissingRpc(e, "delete_note_with_reason")) throw e;
      // degradación silenciosa
    }
  }

  // Comportamiento original (soft/hard delete)
  const hasSoft = await notesSoftDeleteSupported();

  if (hasSoft) {
    const { error } = await supabase
      .from("patient_notes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id);
    if (error) throw error;
    return;
  }

  // Fallback si no hay columna
  const { error } = await supabase.from("patient_notes").delete().eq("id", id);
  if (error) throw error;
}

/** Restaura una nota (borra deleted_at). Requiere que exista la columna. */
export async function restoreNote(id: string): Promise<PatientNote> {
  const hasSoft = await notesSoftDeleteSupported();
  if (!hasSoft) {
    throw new Error("Restaurar no soportado: la columna 'deleted_at' no existe en 'patient_notes'.");
  }
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

/** Duplica una nota (misma paciente, copia título/contenido; autor = usuario actual) */
export async function duplicateNote(noteId: string): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();

  // 1) Obtener la nota original
  const { data: original, error: e1 } = await supabase
    .from("patient_notes")
    .select("*")
    .eq("id", noteId)
    .maybeSingle();
  if (e1) throw e1;
  if (!original) throw new Error("Nota no encontrada.");

  // 2) Usuario actual como autor de la copia
  const { data: auth, error: eAuth } = await supabase.auth.getUser();
  if (eAuth || !auth?.user) throw new Error("No hay sesión activa.");

  // 3) Construir la copia
  const now = new Date();
  const copyTitle = original.titulo
    ? `${original.titulo} (copia ${now.toLocaleString()})`
    : `Copia ${now.toLocaleString()}`;

  const payload = {
    patient_id: original.patient_id,
    user_id: auth.user.id,
    titulo: copyTitle,
    contenido: original.contenido ?? null,
  };

  // 4) Insertar y devolver
  const { data, error } = await supabase
    .from("patient_notes")
    .insert(payload)
    .select("*")
    .single();
  if (error) throw error;

  return data as PatientNote;
}

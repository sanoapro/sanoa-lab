import { getSupabaseBrowser } from "./supabase-browser";

export interface PatientNote {
  id: string;
  patient_id: string;
  user_id: string;
  titulo: string | null;
  contenido: string | null;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  titulo?: string | null;
  contenido?: string | null;
}

export async function listNotes(patientId: string): Promise<PatientNote[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientNote[];
}

export async function createNote(patientId: string, input: NoteInput): Promise<PatientNote> {
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

export async function updateNote(id: string, patch: NoteInput): Promise<PatientNote> {
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

export async function deleteNote(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patient_notes").delete().eq("id", id);
  if (error) throw error;
}

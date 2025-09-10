import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type PatientNote = {
  id: string;
  user_id: string;
  patient_id: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export async function listNotes(patientId: string, limit = 200): Promise<PatientNote[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_notes")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as PatientNote[];
}

export async function createNote(patientId: string, content: string): Promise<PatientNote> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_notes")
    .insert({ patient_id: patientId, content } as any)
    .select("*")
    .single();
  if (error) throw error;
  return data as PatientNote;
}

export async function deleteNote(noteId: string): Promise<boolean> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patient_notes").delete().eq("id", noteId);
  if (error) throw error;
  return true;
}

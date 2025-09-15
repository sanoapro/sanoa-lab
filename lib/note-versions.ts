import { getSupabaseBrowser } from "./supabase-browser";

export interface NoteVersion {
  id: string;
  note_id: string;
  patient_id: string;
  action: "insert" | "update" | "delete";
  edited_by: string | null;
  reason: string | null;
  before_titulo: string | null;
  after_titulo: string | null;
  before_contenido: string | null;
  after_contenido: string | null;
  created_at: string;
}

export async function listNoteVersions(noteId: string): Promise<NoteVersion[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_note_versions")
    .select("*")
    .eq("note_id", noteId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as NoteVersion[];
}

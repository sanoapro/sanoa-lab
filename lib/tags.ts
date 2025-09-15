import { getSupabaseBrowser } from "./supabase-browser";

export interface Tag {
  id: string;
  owner_id: string;
  name: string;
  color: string | null;
  kind: "tag" | "dx";
  created_at: string;
}

export async function listMyTags(kind?: "tag" | "dx"): Promise<Tag[]> {
  const supabase = getSupabaseBrowser();
  let q = supabase.from("tags").select("*").order("name", { ascending: true });
  if (kind) q = q.eq("kind", kind);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Tag[];
}

export async function createTag(name: string, opts?: { color?: string | null; kind?: "tag" | "dx" }): Promise<Tag> {
  const supabase = getSupabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("No hay sesión.");
  const payload = {
    owner_id: auth.user.id,
    name: name.trim(),
    color: opts?.color ?? null,
    kind: opts?.kind ?? "tag",
  };
  const { data, error } = await supabase.from("tags").insert(payload).select("*").single();
  if (error) throw error;
  return data as Tag;
}

export async function assignTag(patientId: string, tagId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patient_tags").insert({ patient_id: patientId, tag_id: tagId });
  if (error) throw error;
}

export async function unassignTag(patientId: string, tagId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patient_tags").delete().eq("patient_id", patientId).eq("tag_id", tagId);
  if (error) throw error;
}

export async function listTagsOfPatient(patientId: string): Promise<Tag[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_tags")
    .select("tags(*)")
    .eq("patient_id", patientId);
  if (error) throw error;
  return (data ?? []).map((r: any) => r.tags as Tag);
}
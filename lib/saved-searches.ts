import { getSupabaseBrowser } from "./supabase-browser";
import type { AdvancedSearchPayload } from "./search-advanced";

export interface SavedSearch {
  id: string;
  owner_id: string;
  org_id: string | null;
  name: string;
  payload: AdvancedSearchPayload;
  created_at: string;
}

export async function listSavedSearches(): Promise<SavedSearch[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("saved_searches")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SavedSearch[];
}

export async function createSavedSearch(
  name: string,
  payload: AdvancedSearchPayload,
  scope: "personal" | "org" = "personal",
): Promise<SavedSearch> {
  const supabase = getSupabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("No hay sesión.");
  const org = scope === "org" ? localStorage.getItem("activeOrgId") || null : null;
  const { data, error } = await supabase
    .from("saved_searches")
    .insert({
      owner_id: auth.user.id,
      org_id: org,
      name,
      payload,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as SavedSearch;
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("saved_searches").delete().eq("id", id);
  if (error) throw error;
}

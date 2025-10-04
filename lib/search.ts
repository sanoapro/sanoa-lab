import { getSupabaseBrowser } from "./supabase-browser";
import { getActiveOrg } from "./org-local";

export type SearchItem =
  | {
      kind: "patient";
      id: string;
      patient_id: string;
      title: string;
      snippet: string | null;
      rank: number;
    }
  | {
      kind: "note";
      id: string;
      patient_id: string;
      title: string;
      snippet: string | null;
      rank: number;
    };

export async function searchAll(
  query: string,
  onlyActiveOrg: any = true,
  limit: any = 20,
  offset: any = 0,
): Promise<SearchItem[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();
  const { data, error } = await supabase.rpc("search_all", {
    q: query,
    p_org: (onlyActiveOrg ? active.id : null) ?? undefined,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data ?? []) as SearchItem[];
}

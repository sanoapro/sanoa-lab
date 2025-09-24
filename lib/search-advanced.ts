import { getSupabaseBrowser } from "./supabase-browser";
import { getActiveOrg } from "./org-local";

export type Gender = "F" | "M" | "O";
export type Mode = "any" | "all";

export type AdvancedSearchPayload = {
  q: string;
  tagsAny: string[];
  tagsAll: string[];
  genero: Gender | "ALL";
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  onlyOrg: boolean;
};

export type SearchItem =
  | {
      kind: "patient";
      id: string;
      patient_id: string;
      title: string;
      snippet: string | null;
      rank: number;
      created_at: string;
    }
  | {
      kind: "note";
      id: string;
      patient_id: string;
      title: string;
      snippet: string | null;
      rank: number;
      created_at: string;
    };

async function getPatientIdsByTags(tagIds: string[], mode: Mode): Promise<string[] | null> {
  if (!tagIds.length) return null;
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase.rpc("patients_ids_by_tags", { tag_ids: tagIds, mode });
  if (error) throw error;
  return (data ?? []).map((r: any) => r.patient_id as string);
}

export async function searchAdvanced(
  p: AdvancedSearchPayload,
  limit = 40,
  offset = 0,
): Promise<SearchItem[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();

  // Resolvemos ids por etiquetas (según ANY/ALL seleccionado)
  const tags = p.tagsAll.length ? p.tagsAll : p.tagsAny;
  const mode: Mode = p.tagsAll.length ? "all" : "any";
  const patientIds = await getPatientIdsByTags(tags, mode);

  // Fechas a timestamptz
  const fromTs = p.from ? new Date(p.from + "T00:00:00Z").toISOString() : null;
  const toTs = p.to ? new Date(p.to + "T23:59:59Z").toISOString() : null;
  const genero = p.genero === "ALL" ? null : p.genero;

  const { data, error } = await supabase.rpc("search_all_plus", {
    q: p.q ?? "",
    p_org: p.onlyOrg ? active.id : null,
    p_patient_ids: patientIds,
    p_from: fromTs,
    p_to: toTs,
    p_genero: genero,
    p_limit: limit,
    p_offset: offset,
  });
  if (error) throw error;
  return (data ?? []) as SearchItem[];
}

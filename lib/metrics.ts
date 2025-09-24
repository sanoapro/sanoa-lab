import { getSupabaseBrowser } from "./supabase-browser";
import { getActiveOrg } from "./org-local";

export interface TagMetric {
  tag_id: string;
  tag_name: string;
  total: number;
}
export interface MonthMetric {
  month_start: string;
  total: number;
}

export async function metricsPatientsByTag(
  from?: string,
  to?: string,
  onlyOrg = true,
): Promise<TagMetric[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();
  const { data, error } = await supabase.rpc("metrics_patients_by_tag", {
    p_org: onlyOrg ? active.id : null,
    p_from: from ? new Date(from + "T00:00:00Z").toISOString() : null,
    p_to: to ? new Date(to + "T23:59:59Z").toISOString() : null,
  });
  if (error) throw error;
  return (data ?? []) as TagMetric[];
}

export async function metricsNewPatientsByMonth(
  months = 12,
  onlyOrg = true,
): Promise<MonthMetric[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();
  const { data, error } = await supabase.rpc("metrics_new_patients_by_month", {
    p_org: onlyOrg ? active.id : null,
    months,
  });
  if (error) throw error;
  return (data ?? []) as MonthMetric[];
}

export async function metricsNotesByMonth(months = 12, onlyOrg = true): Promise<MonthMetric[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();
  const { data, error } = await supabase.rpc("metrics_notes_by_month", {
    p_org: onlyOrg ? active.id : null,
    months,
  });
  if (error) throw error;
  return (data ?? []) as MonthMetric[];
}

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

function toISODateStart(d?: string): string | undefined {
  if (!d) return undefined;
  // YYYY-MM-DDT00:00:00Z
  return new Date(`${d}T00:00:00Z`).toISOString();
}

function toISODateEnd(d?: string): string | undefined {
  if (!d) return undefined;
  // YYYY-MM-DDT23:59:59Z
  return new Date(`${d}T23:59:59Z`).toISOString();
}

export async function metricsPatientsByTag(
  from?: string,
  to?: string,
  onlyOrg: boolean = true,
): Promise<TagMetric[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();

  const { data, error } = await supabase.rpc("metrics_patients_by_tag", {
    // ⬇️ usar undefined cuando no se envía el parámetro
    p_org: onlyOrg && active.id ? active.id : undefined,
    p_from: toISODateStart(from),
    p_to: toISODateEnd(to),
  });
  if (error) throw error;
  return (data ?? []) as TagMetric[];
}

export async function metricsNewPatientsByMonth(
  months: number = 12,
  onlyOrg: boolean = true,
): Promise<MonthMetric[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();

  const { data, error } = await supabase.rpc("metrics_new_patients_by_month", {
    p_org: onlyOrg && active.id ? active.id : undefined,
    months,
  });
  if (error) throw error;
  return (data ?? []) as MonthMetric[];
}

export async function metricsNotesByMonth(
  months: number = 12,
  onlyOrg: boolean = true,
): Promise<MonthMetric[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();

  const { data, error } = await supabase.rpc("metrics_notes_by_month", {
    p_org: onlyOrg && active.id ? active.id : undefined,
    months,
  });
  if (error) throw error;
  return (data ?? []) as MonthMetric[];
}

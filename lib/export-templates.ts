import { getSupabaseBrowser } from "./supabase-browser";
import { getActiveOrg } from "./org-local";

export interface ExportTemplate {
  id: string;
  owner_id: string;
  org_id: string | null;
  name: string;
  cover_title: string;
  cover_subtitle: string | null;
  logo_url: string | null;
  brand_hex: string | null;
  created_at: string;
}

export async function listExportTemplates(includeOrg = true): Promise<ExportTemplate[]> {
  const supabase = getSupabaseBrowser();
  const active = getActiveOrg();
  let q = supabase.from("export_templates").select("*").order("created_at", { ascending: false });
  if (includeOrg && active.id) {
    const { data, error } = await q.or(
      `owner_id.eq.${(await supabase.auth.getUser()).data.user?.id},org_id.eq.${active.id}`,
    );
    if (error) throw error;
    return (data ?? []) as ExportTemplate[];
  }
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ExportTemplate[];
}

export async function createExportTemplate(
  name: string,
  cover_title: string,
  cover_subtitle: string | null,
  logo_url: string | null,
  brand_hex: string | null,
  scope: "personal" | "org" = "personal",
): Promise<ExportTemplate> {
  const supabase = getSupabaseBrowser();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("No hay sesión.");
  const active = getActiveOrg();
  const { data, error } = await supabase
    .from("export_templates")
    .insert({
      owner_id: auth.user.id,
      org_id: scope === "org" ? (active.id ?? null) : null,
      name,
      cover_title,
      cover_subtitle,
      logo_url,
      brand_hex,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ExportTemplate;
}

export async function deleteExportTemplate(id: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("export_templates").delete().eq("id", id);
  if (error) throw error;
}

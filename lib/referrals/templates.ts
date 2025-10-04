import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type ReferralTemplateContent = {
  meta?: {
    specialty?: string | null;
    summary?: string | null;
  } | null;
  to_specialty?: string | null;
  to_doctor_name?: string | null;
  reason?: string | null;
  summary?: string | null;
  plan?: string | null;
};

export type ReferralTemplate = {
  id: string;
  org_id: string;
  name: string;
  content: ReferralTemplateContent;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function listReferralTemplates(orgId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("referral_templates")
    .select("id, org_id, name, content, active:is_active, created_at, updated_at")
    .eq("org_id", orgId)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data as unknown) as ReferralTemplate[]) ?? [];
}

export async function upsertReferralTemplate(payload: {
  id?: string;
  org_id: string;
  name: string;
  content: ReferralTemplateContent;
  active?: boolean;
}) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("referral_templates")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function toggleReferralTemplate(id: string, next: boolean) {
  const supabase = getSupabaseBrowser();
  const supabaseAny = supabase as any;
  const { error } = await supabaseAny
    .from("referral_templates")
    .update({ is_active: next })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteReferralTemplate(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("referral_templates").delete().eq("id", id);
  if (error) throw error;
}

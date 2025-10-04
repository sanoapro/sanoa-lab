import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type PrescriptionTemplateContent = {
  meta?: {
    specialty?: string | null;
    summary?: string | null;
  } | null;
  notes?: string | null;
  items: Array<{
    drug: string;
    dose: string;
    route: string;
    frequency: string;
    duration: string;
    instructions?: string | null;
  }>;
};

export type PrescriptionTemplate = {
  id: string;
  org_id: string;
  name: string;
  content: PrescriptionTemplateContent;
  active: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function listPrescriptionTemplates(orgId: string) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("prescription_templates")
    .select("id, org_id, name, content, active:is_active, created_at, updated_at")
    .eq("org_id", orgId)
    .order("name", { ascending: true });
  if (error) throw error;
  return ((data as unknown) as PrescriptionTemplate[]) ?? [];
}

export async function upsertPrescriptionTemplate(payload: {
  id?: string;
  org_id: string;
  name: string;
  content: PrescriptionTemplateContent;
  active?: boolean;
}) {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("prescription_templates")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();
  if (error) throw error;
  return data as { id: string };
}

export async function togglePrescriptionTemplate(id: string, next: boolean) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase
    .from("prescription_templates")
    .update({ active: next })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePrescriptionTemplate(id: string) {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("prescription_templates").delete().eq("id", id);
  if (error) throw error;
}

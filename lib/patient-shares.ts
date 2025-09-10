import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type PatientShare = {
  id: string;
  owner_id: string;
  patient_id: string;
  grantee_email: string;
  can_edit: boolean;
  created_at: string;
};

export async function listShares(patientId: string): Promise<PatientShare[]> {
  const supabase = getSupabaseBrowser() as any;
  const { data, error } = await supabase
    .from("patient_shares")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error)
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  return (data || []) as PatientShare[];
}

export async function addShare(patientId: string, email: string, canEdit: boolean) {
  const supabase = getSupabaseBrowser() as any;
  const { data: me } = await supabase.auth.getUser();
  if (!me?.user) throw new Error("No hay sesión.");
  const payload = {
    owner_id: me.user.id,
    patient_id: patientId,
    grantee_email: email.trim(),
    can_edit: !!canEdit,
  };
  const { data, error } = await supabase
    .from("patient_shares")
    .insert(payload)
    .select("*")
    .single();
  if (error)
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  return data as PatientShare;
}

export async function revokeShare(shareId: string) {
  const supabase = getSupabaseBrowser() as any;
  const { error } = await supabase.from("patient_shares").delete().eq("id", shareId);
  if (error)
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  return true;
}

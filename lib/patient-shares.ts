import { getSupabaseBrowser } from "./supabase-browser";

export type SharePermission = "read" | "write";

export interface PatientShare {
  id: string;
  patient_id: string;
  owner_id: string;
  shared_with_email: string | null;
  shared_with_user_id: string | null;
  permission: SharePermission;
  created_at: string;
}

export async function listShares(patientId: string): Promise<PatientShare[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("patient_shares")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientShare[];
}

/** Comparte por email o por user_id (pasa UNO de los dos) */
export async function addShare(params: {
  patientId: string;
  email?: string;
  userId?: string;
  permission?: SharePermission;
}): Promise<PatientShare> {
  const supabase = getSupabaseBrowser();
  const { data: auth, error: eAuth } = await supabase.auth.getUser();
  if (eAuth || !auth.user) throw new Error("No hay sesión activa.");

  if (!params.email && !params.userId) throw new Error("Debes indicar email o userId.");

  const payload = {
    patient_id: params.patientId,
    owner_id: auth.user.id,
    shared_with_email: params.email ?? null,
    shared_with_user_id: params.userId ?? null,
    permission: params.permission ?? "read",
  };

  const { data, error } = await supabase.from("patient_shares").insert(payload).select("*").single();
  if (error) throw error;
  return data as PatientShare;
}

export async function revokeShare(shareId: string): Promise<void> {
  const supabase = getSupabaseBrowser();
  const { error } = await supabase.from("patient_shares").delete().eq("id", shareId);
  if (error) throw error;
}

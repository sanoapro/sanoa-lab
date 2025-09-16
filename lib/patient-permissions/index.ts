import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type PatientPermission = {
  id: string;
  patient_id: string;
  user_id: string;
  can_read: boolean;
  can_edit_notes: boolean;
  can_manage_files: boolean;
  can_share: boolean;
  created_at: string;
};

export async function listPatientPermissions(patientId: string): Promise<PatientPermission[]> {
  const supa = getSupabaseBrowser();
  const { data, error } = await supa.from("patient_permissions").select("*").eq("patient_id", patientId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PatientPermission[];
}

/** Requiere que el usuario ya exista (user_id). Si quieres invitar por email, primero crea el usuario (o maneja invitación aparte). */
export async function upsertPatientPermission(patientId: string, userId: string, perms: Partial<Omit<PatientPermission, "id"|"patient_id"|"user_id"|"created_at">>): Promise<void> {
  const supa = getSupabaseBrowser();
  const patch = {
    patient_id: patientId,
    user_id: userId,
    can_read: perms.can_read ?? true,
    can_edit_notes: !!perms.can_edit_notes,
    can_manage_files: !!perms.can_manage_files,
    can_share: !!perms.can_share,
  };
  const { error } = await supa.from("patient_permissions").upsert(patch, { onConflict: "patient_id,user_id" });
  if (error) throw error;
}

export async function removePatientPermission(id: string): Promise<void> {
  const supa = getSupabaseBrowser();
  const { error } = await supa.from("patient_permissions").delete().eq("id", id);
  if (error) throw error;
}
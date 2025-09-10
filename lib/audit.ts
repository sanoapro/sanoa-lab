import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type AuditEntry = {
  id: string;
  patient_id: string;
  actor_id: string | null;
  actor_email: string | null;
  entity: "patients" | "patient_notes" | "patient_files" | string;
  entity_id: string;
  action: "create" | "update" | "delete" | string;
  data: any | null;
  created_at: string;
};

export async function listAudit(patientId: string, limit = 200): Promise<AuditEntry[]> {
  const supabase = getSupabaseBrowser();
  const { data, error } = await supabase
    .from("audit_log")
    .select("*")
    .eq("patient_id", patientId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error)
    throw new Error(
      (error as any)?.message ?? (error as any)?.details ?? (error as any)?.hint ?? "Unknown error",
    );
  return (data || []) as AuditEntry[];
}

export function fmtAuditRow(a: AuditEntry) {
  const who = a.actor_email || "Usuario";
  const when = new Date(a.created_at).toLocaleString();
  const entityMap: Record<string, string> = {
    patients: "Paciente",
    patient_notes: "Nota",
    patient_files: "Archivo",
  };
  const what = entityMap[a.entity] || a.entity;
  const actionMap: Record<string, string> = {
    create: "creó",
    update: "actualizó",
    delete: "eliminó",
  };
  const verb = actionMap[a.action] || a.action;
  return `${who} ${verb} ${what} — ${when}`;
}

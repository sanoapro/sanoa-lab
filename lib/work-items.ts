import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type WorkStatus = "open" | "done";

export type WorkItem = {
  id: string;
  org_id: string;
  patient_id: string;
  title: string;
  description: string | null;
  status: WorkStatus;
  due_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

const supa = () => getSupabaseBrowser();

/** Lista tareas por org; filtros opcionales */
export async function listWorkItems(opts: {
  orgId: string;
  status?: WorkStatus | "all";
  patientId?: string;
  limit?: number;
}): Promise<WorkItem[]> {
  const { orgId, status = "open", patientId, limit = 200 } = opts;
  let q = supa()
    .from("work_items")
    .select("*")
    .eq("org_id", orgId)
    .order("due_at", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") q = q.eq("status", status);
  if (patientId) q = q.eq("patient_id", patientId);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as WorkItem[];
}

/** Crear tarea */
export async function createWorkItem(input: {
  orgId: string;
  patientId: string;
  title: string;
  description?: string;
  dueAt?: string | null; // ISO o null
}): Promise<string> {
  const { data, error } = await supa()
    .from("work_items")
    .insert({
      org_id: input.orgId,
      patient_id: input.patientId,
      title: input.title,
      description: input.description ?? null,
      due_at: input.dueAt ?? null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data!.id as string;
}

/** Cambiar estado */
export async function setWorkStatus(id: string, status: WorkStatus): Promise<void> {
  const { error } = await supa().from("work_items").update({ status }).eq("id", id);
  if (error) throw error;
}

/** Editar campos (título, desc, due_at) */
export async function updateWorkItem(
  id: string,
  patch: Partial<Pick<WorkItem, "title" | "description" | "due_at">>,
) {
  const { error } = await supa().from("work_items").update(patch).eq("id", id);
  if (error) throw error;
}

/** Borrar tarea */
export async function deleteWorkItem(id: string) {
  const { error } = await supa().from("work_items").delete().eq("id", id);
  if (error) throw error;
}

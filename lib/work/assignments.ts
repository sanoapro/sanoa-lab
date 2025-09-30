// lib/work/assignments.ts
export type WorkAssignment = {
  id: string;
  org_id: string;
  patient_id: string;
  provider_id: string;
  module: "mente" | "equilibrio" | "sonrisa" | "pulso" | "general";
  template_id: string | null;
  title: string;
  content: any;
  due_at: string | null;
  frequency: "once" | "daily" | "weekly" | "monthly";
  occurrences: number | null;
  notes: string | null;
  status: "active" | "paused" | "completed" | "canceled";
  last_done_at: string | null;
  created_at?: string;
};

export async function listAssignments(params: {
  org_id: string;
  patient_id?: string;
  module?: WorkAssignment["module"];
  status?: WorkAssignment["status"];
  page?: number;
  limit?: number;
}) {
  const url = new URL("/api/work/assignments", window.location.origin);
  url.searchParams.set("org_id", params.org_id);
  if (params.patient_id) url.searchParams.set("patient_id", params.patient_id);
  if (params.module) url.searchParams.set("module", params.module);
  if (params.status) url.searchParams.set("status", params.status);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.limit) url.searchParams.set("limit", String(params.limit));
  const r = await fetch(url.toString(), { cache: "no-store" });
  const j = await r.json();
  return j?.ok ? j.data : { items: [], meta: { page: 1, pageSize: 50, total: 0 } };
}

export async function assignWork(input: {
  org_id: string;
  patient_ids: string[];
  provider_id?: string;
  module: WorkAssignment["module"];
  template_id?: string;
  title?: string;
  content?: any;
  due_at?: string;
  frequency?: WorkAssignment["frequency"];
  occurrences?: number;
  notes?: string;
}) {
  const r = await fetch("/api/work/assign", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return await r.json();
}

export async function logEvent(input: {
  org_id: string;
  assignment_id: string;
  kind: "completed" | "note" | "skipped";
  payload?: any;
}) {
  const r = await fetch("/api/work/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  return await r.json();
}

export async function patchAssignment(
  id: string,
  patch: Partial<Pick<WorkAssignment, "title" | "content" | "due_at" | "status" | "notes">>,
) {
  const r = await fetch(`/api/work/assignments/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  return await r.json();
}

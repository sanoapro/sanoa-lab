// lib/work/templates.ts
export type WorkTemplate = {
  id: string;
  org_id: string;
  module: "mente" | "equilibrio" | "sonrisa" | "pulso" | "general";
  title: string;
  content: any;
  tags: string[];
  is_active: boolean;
  created_by?: string | null;
  created_at?: string;
};

export async function listTemplates(params: {
  org_id: string;
  module?: WorkTemplate["module"];
  q?: string;
  active?: boolean;
}) {
  const url = new URL("/api/work/templates", window.location.origin);
  url.searchParams.set("org_id", params.org_id);
  if (params.module) url.searchParams.set("module", params.module);
  if (params.q) url.searchParams.set("q", params.q);
  if (typeof params.active === "boolean") url.searchParams.set("active", String(params.active));
  const r = await fetch(url.toString(), { cache: "no-store" });
  const j = await r.json();
  return j?.ok ? (j.data as WorkTemplate[]) : [];
}

export async function createTemplate(
  input: Omit<WorkTemplate, "id" | "created_at" | "created_by">,
) {
  const r = await fetch("/api/work/templates", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const j = await r.json();
  return j;
}

export async function updateTemplate(
  id: string,
  patch: Partial<Pick<WorkTemplate, "title" | "content" | "tags" | "is_active">>,
) {
  const r = await fetch(`/api/work/templates/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  const j = await r.json();
  return j;
}

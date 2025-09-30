// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError } from "@/lib/http/validate";

const QuerySchema = z.object({
  org_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(),
  module: z.enum(["mente", "equilibrio", "sonrisa", "pulso", "general"]).optional(),
  status: z.enum(["active", "paused", "completed", "canceled"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  page: z.coerce.number().int().min(1).default(1),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const parsed = QuerySchema.safeParse({
    org_id: qp.get("org_id"),
    patient_id: qp.get("patient_id") || undefined,
    module: qp.get("module") || undefined,
    status: qp.get("status") || undefined,
    limit: qp.get("limit") || undefined,
    page: qp.get("page") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }
  const { org_id, patient_id, module, status, limit, page } = parsed.data;

  let sel = supa
    .from("work_assignments")
    .select("id, org_id, patient_id, provider_id, module, title, content, due_at, frequency, occurrences, notes, status, last_done_at, created_at", { count: "exact" })
    .eq("org_id", org_id);

  if (patient_id) sel = sel.eq("patient_id", patient_id);
  if (module) sel = sel.eq("module", module);
  if (status) sel = sel.eq("status", status);

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await sel.order("created_at", { ascending: false }).range(from, to);
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk({ items: data, meta: { page, pageSize: limit, total: count ?? 0 } });
}

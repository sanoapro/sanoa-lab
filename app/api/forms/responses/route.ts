// MODE: session (user-scoped, cookies)
// GET /api/forms/responses?org_id&patient_id&template_id&page&pageSize
// POST body { org_id, patient_id, template_id, answers }
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import {
  jsonOk,
  jsonError,
  parseJson,
  parseOrError,
  parsePageQuery,
  readOrgIdFromQuery,
} from "@/lib/http/validate";

const CreateSchema = z.object({
  org_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  template_id: z.string().uuid(),
  answers: z.any(),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const q = readOrgIdFromQuery(req);
  if (!q.ok) return jsonError(q.error.code, q.error.message, 400);

  const sp = new URL(req.url).searchParams;
  const { page, pageSize } = parsePageQuery(req);
  const patient_id = sp.get("patient_id");
  const template_id = sp.get("template_id");

  let sel = supa.from("form_responses").select("*", { count: "exact" }).eq("org_id", q.org_id);
  if (patient_id) sel = sel.eq("patient_id", patient_id);
  if (template_id) sel = sel.eq("template_id", template_id);

  sel = sel
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await sel;
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk(data, { page, pageSize, total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(CreateSchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const row: any = {
    ...parsed.data,
    submitted_by: req.headers.get("x-user-id") || "system",
  };

  const { data, error } = await supa
    .from("form_responses")
    .insert(row)
    .select("id")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk<{ id: string }>(data);
}

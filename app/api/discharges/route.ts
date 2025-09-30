import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parsePageQuery, readOrgIdFromQuery } from "@/lib/http/validate";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const q = readOrgIdFromQuery(req);
  if (!q.ok) return jsonError(q.error.code, q.error.message, 400);

  const { page, pageSize } = parsePageQuery(req);
  const sp = new URL(req.url).searchParams;
  const patient_id = sp.get("patient_id");

  let sel = supa.from("discharges").select("*", { count: "exact" }).eq("org_id", q.org_id);
  if (patient_id) sel = sel.eq("patient_id", patient_id);
  sel = sel.order("created_at", { ascending: false }).range((page - 1) * pageSize, page * pageSize - 1);

  const { data, error, count } = await sel;
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data, { page, pageSize, total: count ?? 0 });
}

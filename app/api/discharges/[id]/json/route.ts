// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, readOrgIdFromQuery } from "@/lib/http/validate";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const id = ctx.params.id;

  let q = supa.from("discharges").select("*").eq("id", id).limit(1);
  const org = readOrgIdFromQuery(req);
  if (org.ok) q = q.eq("org_id", org.org_id);

  const { data, error } = await q.single();
  if (error) return jsonError("NOT_FOUND", "Alta no encontrada", 404);
  return jsonOk(data);
}

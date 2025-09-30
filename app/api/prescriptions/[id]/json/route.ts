// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, readOrgIdFromQuery } from "@/lib/http/validate";

export async function GET(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const id = ctx.params.id;

  const q = supa.from("prescriptions").select("*").eq("id", id).limit(1);
  const q2 = (() => {
    const org = readOrgIdFromQuery(req);
    return org.ok ? q.eq("org_id", org.org_id) : q;
  })();

  const { data, error } = await q2.single();
  if (error) return jsonError(error.code ?? "DB_ERROR", error.message, 404);
  return jsonOk(data);
}

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError, readOrgIdFromQuery } from "@/lib/http/validate";

const UpsertSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().uuid(),
  name: z.string().min(1),
  schema: z.any(), // JSON de definición del formulario
  is_active: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const q = readOrgIdFromQuery(req);
  if (!q.ok) return jsonError(q.error.code, q.error.message, 400);

  const { data, error } = await supa.from("form_templates").select("*").eq("org_id", q.org_id).order("name");
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(UpsertSchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data, error } = await supa.from("form_templates").upsert(parsed.data, { onConflict: "id" }).select("id").single();
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk<{ id: string }>(data);
}

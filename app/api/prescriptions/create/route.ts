import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  content: z.any(), // JSON de indicaciones
  letterhead_url: z.string().url().optional(),
  signature_name: z.string().optional(),
  notes: z.string().max(10_000).optional(),
  status: z.enum(["draft", "signed"]).default("signed"),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data, error } = await supa.from("prescriptions").insert(parsed.data).select("id").single();
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk<{ id: string }>(data);
}

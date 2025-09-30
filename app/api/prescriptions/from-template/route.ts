// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const BodySchema = z.object({
  org_id: z.string().uuid(),
  template_id: z.string().uuid(),
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  overrides: z.any().optional(), // para reemplazos simples si aplica
  status: z.enum(["draft", "signed"]).default("signed"),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();

  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  // Cargar la plantilla en el mismo org
  const { data: tpl, error: e1 } = await supa
    .from("prescription_templates")
    .select("content")
    .eq("id", parsed.data.template_id)
    .eq("org_id", parsed.data.org_id)
    .single();

  if (e1 || !tpl) return jsonError("NOT_FOUND", "Plantilla no encontrada", 404);

  // Combinar overrides simples
  const content = parsed.data.overrides
    ? { ...tpl.content, ...parsed.data.overrides }
    : tpl.content;

  const insert = {
    org_id: parsed.data.org_id,
    patient_id: parsed.data.patient_id,
    provider_id: parsed.data.provider_id,
    content,
    status: parsed.data.status,
  };

  const { data, error } = await supa.from("prescriptions").insert(insert).select("id").single();

  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk<{ id: string }>(data);
}

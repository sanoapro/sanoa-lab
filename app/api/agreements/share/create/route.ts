// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const Body = z.object({
  org_id: z.string().uuid(),
  template_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(), // requerido para specialist_patient
  provider_id: z.string().uuid().optional(), // si no se manda, se toma del usuario
  expires_in_hours: z.coerce.number().int().min(1).max(720).default(168), // 7d
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const supaAny = supa as any;
  const raw = await parseJson(req);
  const p = parseOrError(Body, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  const provider_id = p.data.provider_id ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "Sin sesión", 401);

  const { data: tplRow, error: eTpl } = await supaAny
    .from("agreements_templates")
    .select("id, org_id, type, title, version, provider_id")
    .eq("id", p.data.template_id)
    .eq("org_id", p.data.org_id)
    .maybeSingle();
  const tpl = tplRow as any;
  if (eTpl) return jsonError("DB_ERROR", eTpl.message, 400);
  if (!tpl) return jsonError("NOT_FOUND", "Template no encontrado", 404);

  if (tpl.type === "specialist_patient" && !p.data.patient_id) {
    return jsonError("BAD_REQUEST", "patient_id requerido para specialist_patient", 400);
  }

  const token = crypto.randomUUID();
  const expires_at = new Date(Date.now() + p.data.expires_in_hours * 3600 * 1000).toISOString();

  const rec = {
    token,
    org_id: p.data.org_id,
    template_id: p.data.template_id,
    type: tpl.type,
    patient_id: p.data.patient_id ?? null,
    provider_id,
    expires_at,
    status: "pending" as const,
  };

  const { error } = await supaAny.from("agreements_links").insert(rec as any);
  if (error) return jsonError("DB_ERROR", error.message, 400);

  const url = `${new URL(req.url).origin}/share/agreement/${token}`;
  return jsonOk({ token, url, expires_at });
}

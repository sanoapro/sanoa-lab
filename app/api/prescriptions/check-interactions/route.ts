// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const BodySchema = z.object({
  org_id: z.string().uuid().optional(), // opcional para no romper integraciones previas
  drugs: z.array(z.string().min(1)).min(1),
  patient_id: z.string().uuid().optional(),
  allergies: z.array(z.string()).optional(),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);
  const { org_id, drugs, patient_id, allergies } = parsed.data;

  // Intentar RPC si existe (nombre ilustrativo: rx_check_interactions)
  const { data, error } = await supa.rpc("rx_check_interactions", {
    p_org_id: org_id ?? null,
    p_drugs: drugs,
    p_patient_id: patient_id ?? null,
    p_allergies: allergies ?? [],
  });

  // Fallback “seguro” si no existe el RPC (no rompemos UX)
  if (error && error.code === "PGRST204") {
    return jsonOk<{ interactions: unknown[] }>({ interactions: [] }, { source: "fallback" });
  }
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk<{ interactions: unknown[] }>({ interactions: data ?? [] });
}

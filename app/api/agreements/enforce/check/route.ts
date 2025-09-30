// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

/** Verifica si ya existe un acceptance SP (especialista↔paciente) vigente. */
const Body = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  patient_id: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const p = parseOrError(Body, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  // buscar última aceptación del tipo specialist_patient para pares (provider, patient)
  const { data, error } = await supa
    .from("agreements_acceptances")
    .select("id, accepted_at")
    .eq("org_id", p.data.org_id)
    .eq("signer_type", "patient")
    .eq("specialist_id", p.data.provider_id)
    .eq("patient_id", p.data.patient_id)
    .order("accepted_at", { ascending: false })
    .limit(1);

  if (error) return jsonError("DB_ERROR", error.message, 400);

  const required = !data || data.length === 0;
  return jsonOk({ required, last_accepted_at: data?.[0]?.accepted_at ?? null });
}

// app/api/agreements/share/accept/route.ts
// MODE: service (no session, no cookies)
// POST { token, patient_name? } -> marca aceptación como paciente
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { jsonError, jsonOk, parseJson } from "@/lib/http/validate";

export async function POST(req: NextRequest) {
  const svc = createServiceClient();
  const body = await parseJson<{ token?: string; patient_name?: string }>(req);
  const token = body?.token;
  if (!token) return jsonError("BAD_REQUEST", "Falta token", 400);

  const { data: acc } = await svc
    .from("agreements_acceptances")
    .select("id, status, token_expires_at, name_snapshot")
    .eq("token", token)
    .maybeSingle();

  if (!acc) return jsonError("NOT_FOUND", "Solicitud no encontrada", 404);
  if (acc.status !== "pending")
    return jsonError("CONFLICT", "La solicitud ya no está disponible", 409);
  if (acc.token_expires_at && new Date(acc.token_expires_at) < new Date())
    return jsonError("EXPIRED", "El enlace ha expirado", 410);

  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

  const name_snapshot = {
    ...(acc.name_snapshot || {}),
    patient_name: (body?.patient_name || acc.name_snapshot?.patient_name || "Paciente").toString(),
  };

  const { error: eUp } = await svc
    .from("agreements_acceptances")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
      accepted_role: "patient",
      accepted_by: null,
      name_snapshot,
      user_agent: ua,
      ip_addr: ip,
    })
    .eq("id", acc.id);

  if (eUp) return jsonError("DB_ERROR", "No se pudo registrar aceptación", 500);
  return jsonOk({ accepted: true });
}

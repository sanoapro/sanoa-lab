// app/api/agreements/share/get/route.ts
// MODE: service (no session, no cookies)
// GET ?token=...  -> devuelve título/cuerpo renderizado con snapshot de nombres
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/http/validate";

function interpolate(body: string, map: Record<string, string>): string {
  return body.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => map[k] ?? `{{${k}}}`);
}

export async function GET(req: NextRequest) {
  const svc = createServiceClient();
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  if (!token) return jsonError("BAD_REQUEST", "Falta token", 400);

  const { data: acc } = await svc
    .from("agreements_acceptances")
    .select("id, status, token_expires_at, template_id, name_snapshot, template_version")
    .eq("token", token)
    .maybeSingle();

  if (!acc) return jsonError("NOT_FOUND", "Solicitud no encontrada", 404);
  if (acc.status !== "pending")
    return jsonError("CONFLICT", "La solicitud ya no está disponible", 409);
  if (acc.token_expires_at && new Date(acc.token_expires_at) < new Date())
    return jsonError("EXPIRED", "El enlace ha expirado", 410);

  const { data: tmpl } = await svc
    .from("agreements_templates")
    .select("title, body")
    .eq("id", acc.template_id)
    .maybeSingle();
  if (!tmpl) return jsonError("NOT_FOUND", "Plantilla no disponible", 404);

  const map: Record<string, string> = {
    SPECIALIST_NAME: acc.name_snapshot?.specialist_name || "Especialista",
    PATIENT_NAME: acc.name_snapshot?.patient_name || "Paciente",
    DATE_ISO: new Date().toISOString().slice(0, 10),
    DATE_LONG: new Date().toLocaleDateString("es-MX", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
  const body = interpolate(tmpl.body, map);
  return jsonOk({ title: tmpl.title, body });
}

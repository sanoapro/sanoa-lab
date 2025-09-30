// MODE: service (no session, no cookies) — acceso por token
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError } from "@/lib/http/validate";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const svc = createServiceClient();
  const token = params.token;

  const { data: link, error } = await svc
    .from("agreements_links")
    .select(
      "token, org_id, template_id, type, patient_id, provider_id, expires_at, used_at, status",
    )
    .eq("token", token)
    .single();
  if (error) return jsonError("NOT_FOUND", "Token inválido", 404);

  const now = new Date();
  if (link.used_at) return jsonError("ALREADY_USED", "Este enlace ya fue utilizado", 410);
  if (link.expires_at && new Date(link.expires_at) < now)
    return jsonError("EXPIRED", "Enlace expirado", 410);

  const { data: tpl, error: eTpl } = await svc
    .from("agreements_templates")
    .select("id, org_id, type, title, description, content, provider_id")
    .eq("id", link.template_id)
    .single();
  if (eTpl) return jsonError("DB_ERROR", eTpl.message, 400);

  // Entregamos sólo lo necesario para visualizar
  return jsonOk({
    token: link.token,
    type: link.type,
    org_id: link.org_id,
    template: {
      id: tpl.id,
      title: tpl.title,
      description: tpl.description,
      content: tpl.content,
    },
  });
}

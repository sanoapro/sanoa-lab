// MODE: service (no session, no cookies) — aceptación por token
import { NextRequest } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const Body = z.object({
  full_name: z.string().min(2),
  accept: z.literal(true), // debe ser true explícito
  extra: z.any().optional(), // respuestas/checkboxes marcadas
});

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const svc = createServiceClient();
  const svcAny = svc as any;
  const token = params.token;
  const raw = await parseJson(req);
  const p = parseOrError(Body, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  const { data: link, error } = await svcAny
    .from("agreements_links")
    .select("*")
    .eq("token", token)
    .single();
  if (error) return jsonError("NOT_FOUND", "Token inválido", 404);

  const now = new Date();
  if (link.used_at) return jsonError("ALREADY_USED", "Este enlace ya fue utilizado", 410);
  if (link.expires_at && new Date(link.expires_at) < now)
    return jsonError("EXPIRED", "Enlace expirado", 410);

  const { data: tpl, error: eTpl } = await svcAny
    .from("agreements_templates")
    .select("id, org_id, type, version, title, content, provider_id")
    .eq("id", (link as any)?.template_id)
    .single();
  if (eTpl) return jsonError("DB_ERROR", eTpl.message, 400);

  // Registrar aceptación (snapshot del contenido)
  const tplData = (tpl ?? {}) as any;
  const linkData = (link ?? {}) as any;
  const acceptance = {
    org_id: linkData.org_id,
    template_id: linkData.template_id,
    patient_id: linkData.patient_id,
    specialist_id: linkData.provider_id,
    signer_type: linkData.type === "specialist_platform" ? "specialist" : "patient",
    signer_id:
      linkData.type === "specialist_platform" ? linkData.provider_id : linkData.patient_id,
    signer_name: p.data.full_name,
    accepted_at: new Date().toISOString(),
    contract_type: tplData?.type ?? linkData.type,
    template_version: tplData?.version ?? linkData?.template_version ?? null,
    snapshot: {
      title: tplData?.title,
      content: tplData?.content,
      selections: p.data.extra ?? {},
    },
    ip: req.headers.get("x-forwarded-for") || null,
    user_agent: req.headers.get("user-agent") || null,
  } as any;

  const { error: eAcc } = await svcAny.from("agreements_acceptances").insert(acceptance);
  if (eAcc) return jsonError("DB_ERROR", eAcc.message, 400);

  const { error: eUpd } = await svcAny
    .from("agreements_links")
    .update({ used_at: new Date().toISOString(), status: "accepted" })
    .eq("token", token);
  if (eUpd) return jsonError("DB_ERROR", eUpd.message, 400);

  return jsonOk({ accepted: true });
}

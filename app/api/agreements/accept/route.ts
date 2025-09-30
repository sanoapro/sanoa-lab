// app/api/agreements/accept/route.ts
// MODE: session (user-scoped, cookies)
// POST { org_id, locale? } -> Acepta specialist_platform del usuario actual
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, jsonOk, parseJson } from "@/lib/http/validate";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson<{ org_id?: string; locale?: string }>(req);
  const org_id = body?.org_id;
  const locale = body?.locale || "es-MX";
  if (!org_id) return jsonError("BAD_REQUEST", "Falta org_id", 400);

  const { data: auth } = await supa.auth.getUser();
  const specialist_id = auth?.user?.id || null;
  if (!specialist_id) return jsonError("UNAUTHORIZED", "Sesión requerida", 401);

  const specialist_name =
    (auth?.user?.user_metadata?.full_name as string) ||
    (auth?.user?.user_metadata?.name as string) ||
    (auth?.user?.email as string) ||
    "Especialista";

  // Verificar miembro org
  const { data: mem } = await supa
    .from("org_members")
    .select("role")
    .eq("org_id", org_id)
    .eq("user_id", specialist_id)
    .maybeSingle();
  if (!mem) return jsonError("FORBIDDEN", "No perteneces a la organización", 403);

  // Plantilla activa specialist_platform
  const { data: tmpl } = await supa
    .from("agreements_templates")
    .select("id, version")
    .eq("type", "specialist_platform")
    .eq("locale", locale)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!tmpl) return jsonError("NOT_FOUND", "Plantilla no encontrada", 404);

  // Insert aceptación (si no existe previa aceptada)
  const name_snapshot = { specialist_name };
  const { error: eIns } = await supa.from("agreements_acceptances").insert({
    org_id,
    specialist_id,
    contract_type: "specialist_platform",
    template_id: tmpl.id,
    template_version: tmpl.version,
    status: "accepted",
    accepted_at: new Date().toISOString(),
    accepted_role: "specialist",
    accepted_by: specialist_id,
    name_snapshot,
    created_by: specialist_id,
  });

  if (eIns) return jsonError("DB_ERROR", "No se pudo registrar aceptación", 500);
  return jsonOk({ accepted: true });
}

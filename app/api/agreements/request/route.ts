// app/api/agreements/request/route.ts
// MODE: session (user-scoped, cookies)
// POST { org_id, patient_id, locale? } -> crea solicitud specialist_patient con token
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, jsonOk, parseJson } from "@/lib/http/validate";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson<{
    org_id?: string;
    patient_id?: string;
    locale?: string;
  }>(req);

  const org_id = body?.org_id;
  const patient_id = body?.patient_id;
  const locale = body?.locale || "es-MX";

  if (!org_id) return jsonError("BAD_REQUEST", "Falta org_id", 400);
  if (!patient_id) return jsonError("BAD_REQUEST", "Falta patient_id", 400);

  // Usuario
  const { data: auth } = await supa.auth.getUser();
  const specialist_id = auth?.user?.id || null;
  if (!specialist_id) return jsonError("UNAUTHORIZED", "Sesión requerida", 401);
  const specialist_name =
    (auth?.user?.user_metadata?.full_name as string) ||
    (auth?.user?.user_metadata?.name as string) ||
    (auth?.user?.email as string) ||
    "Especialista";

  // Verificar miembro de la org
  const { data: mem } = await supa
    .from("org_members")
    .select("role")
    .eq("org_id", org_id)
    .eq("user_id", specialist_id)
    .maybeSingle();
  if (!mem) return jsonError("FORBIDDEN", "No perteneces a la organización", 403);

  // Paciente
  const { data: p } = await supa
    .from("patients")
    .select("id, full_name, name, display")
    .eq("id", patient_id)
    .eq("org_id", org_id)
    .maybeSingle();
  if (!p) return jsonError("NOT_FOUND", "Paciente no encontrado", 404);

  const patient_name = (p?.full_name || p?.name || p?.display || "").trim() || "Paciente";

  // Plantilla activa specialist_patient
  const { data: tmpl } = await supa
    .from("agreements_templates")
    .select("id, version, body, title")
    .eq("type", "specialist_patient")
    .eq("locale", locale)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!tmpl) return jsonError("NOT_FOUND", "Plantilla no encontrada", 404);

  const token = randomBytes(24).toString("base64url");
  const expires_at = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(); // 14 días

  const name_snapshot = {
    specialist_name,
    patient_name,
  };

  const { data: ins, error: eIns } = await supa
    .from("agreements_acceptances")
    .insert({
      org_id,
      specialist_id,
      patient_id,
      contract_type: "specialist_patient",
      template_id: tmpl.id,
      template_version: tmpl.version,
      status: "pending",
      token,
      token_expires_at: expires_at,
      name_snapshot,
      created_by: specialist_id,
    })
    .select("id")
    .maybeSingle();

  if (eIns || !ins) return jsonError("DB_ERROR", "No se pudo crear solicitud", 500);

  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ""}/share/agreement/${token}`;
  return jsonOk({ id: ins.id, url, token_expires_at: expires_at });
}

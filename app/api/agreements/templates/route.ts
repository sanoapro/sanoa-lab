// app/api/agreements/templates/route.ts
// MODE: session (user-scoped, cookies)
// GET ?org_id=...&type=specialist_patient|specialist_platform|patient_platform&locale=es-MX&patient_id=...&populateNames=true
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonError, jsonOk } from "@/lib/http/validate";

const TYPE_MAP = new Set(["specialist_patient", "specialist_platform", "patient_platform"]);

function interpolate(body: string, map: Record<string, string>): string {
  return body.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, k) => (map[k] ?? `{{${k}}}`));
}

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id");
  const type = searchParams.get("type") || "specialist_patient";
  const locale = searchParams.get("locale") || "es-MX";
  const patient_id = searchParams.get("patient_id");
  const populate = (searchParams.get("populateNames") || "true") === "true";

  if (!org_id) return jsonError("BAD_REQUEST", "Falta org_id", 400);
  if (!TYPE_MAP.has(type)) return jsonError("BAD_REQUEST", "type inválido", 400);

  // Usuario (especialista)
  const { data: auth } = await supa.auth.getUser();
  const specialist_id = auth?.user?.id || null;
  if (!specialist_id) return jsonError("UNAUTHORIZED", "Sesión requerida", 401);
  const specialist_name =
    (auth?.user?.user_metadata?.full_name as string) ||
    (auth?.user?.user_metadata?.name as string) ||
    (auth?.user?.email as string) ||
    "Especialista";

  // Paciente (si aplica)
  let patient_name = "";
  if (patient_id) {
    const { data: p } = await supa
      .from("patients")
      .select("id, full_name, name, display")
      .eq("id", patient_id)
      .eq("org_id", org_id)
      .maybeSingle();
    patient_name = (p?.full_name || p?.name || p?.display || "").trim();
  }

  // Plantilla activa
  const { data: tmpl, error: eT } = await supa
    .from("agreements_templates")
    .select("id, type, version, locale, title, body, is_active")
    .eq("type", type)
    .eq("locale", locale)
    .eq("is_active", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (eT || !tmpl) return jsonError("NOT_FOUND", "Plantilla no encontrada/activa", 404);

  const now = new Date();
  const map = populate
    ? {
        SPECIALIST_NAME: specialist_name,
        PATIENT_NAME: patient_name || "Paciente",
        DATE_ISO: now.toISOString().slice(0, 10),
        DATE_LONG: now.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" }),
      }
    : {};

  const body = populate ? interpolate(tmpl.body, map) : tmpl.body;

  return jsonOk({
    template_id: tmpl.id,
    type: tmpl.type,
    version: tmpl.version,
    locale: tmpl.locale,
    title: tmpl.title,
    body,
    map,
  });
}

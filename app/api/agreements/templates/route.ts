// app/api/agreements/templates/route.ts
// MODE: session (user-scoped, cookies)

import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

/** -----------------------------
 * Utils
 * ------------------------------ */
function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function interpolate(body: string, map: Record<string, string>): string {
  return body.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_: any, k: any) => map[k] ?? `{{${k}}}`);
}

/** -----------------------------
 * Schemas
 * ------------------------------ */
const ListQuery = z.object({
  org_id: z.string().uuid(),
  type: z.enum(["specialist_patient", "specialist_platform", "patient_platform"]).optional(),
  q: z.string().trim().optional(),
  include_inactive: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v: any) => v === "true"),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  /** Optional preview helpers */
  locale: z.string().trim().default("es-MX"),
  patient_id: z.string().uuid().optional(),
  populateNames: z
    .union([z.literal("true"), z.literal("false")])
    .optional()
    .transform((v: any) => (v == null ? true : v === "true")),
});

const UpsertBody = z.object({
  org_id: z.string().uuid(),
  id: z.string().uuid().optional(),
  type: z.enum(["specialist_patient", "specialist_platform", "patient_platform"]),
  title: z.string().min(3),
  slug: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  content: z.any().optional(), // JSON: e.g. { body?: string, clauses?: [...], notes?: string }
  is_active: z.boolean().optional().default(true),
  provider_id: z.string().uuid().nullable().optional(), // null => template scoped to org
});

/** -----------------------------
 * GET — list + optional preview interpolation
 * ------------------------------ */
export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const parsed = ListQuery.safeParse({
    org_id: qp.get("org_id"),
    type: qp.get("type") || undefined,
    q: qp.get("q") || undefined,
    include_inactive: qp.get("include_inactive") || undefined,
    limit: qp.get("limit") || undefined,
    offset: qp.get("offset") || undefined,
    locale: qp.get("locale") || undefined,
    patient_id: qp.get("patient_id") || undefined,
    populateNames: qp.get("populateNames") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }
  const q = parsed.data;

  // Base select
  let sel = supa
    .from("agreements_templates")
    .select("*", { count: "exact" })
    .eq("org_id", q.org_id)
    .order("updated_at", { ascending: false })
    .range(q.offset, q.offset + q.limit - 1);

  if (q.type) sel = sel.eq("type", q.type);
  if (!q.include_inactive) sel = sel.eq("is_active", true);
  if (q.q && q.q.trim()) sel = sel.ilike("title", `%${q.q.trim()}%`);

  const { data, error, count } = await sel;
  if (error) return jsonError("DB_ERROR", error.message, 400);

  // Optional preview interpolation (non-destructive)
  let previewVars: Record<string, string> | null = null;
  if (q.populateNames) {
    // Provider (current user)
    const { data: au } = await supa.auth.getUser();
    let providerName = "Especialista";
    if (au?.user?.id) {
      const { data: prof } = await supa
        .from("profiles")
        .select("full_name")
        .eq("id", au.user.id)
        .maybeSingle();
      if (prof?.full_name) providerName = prof.full_name;
    }

    // Patient
    let patientName = "Paciente";
    if (q.patient_id) {
      const { data: pat } = await supa
        .from("patients")
        .select("full_name")
        .eq("id", q.patient_id)
        .maybeSingle();
      if (pat?.full_name) patientName = pat.full_name;
    }

    // Org
    let orgName = "Clínica";
    {
      const { data: org } = await supa
        .from("organizations")
        .select("name")
        .eq("id", q.org_id)
        .maybeSingle();
      if (org?.name) orgName = org.name;
    }

    const dt = new Date().toLocaleString(q.locale || "es-MX");
    previewVars = {
      PATIENT_NAME: patientName,
      PROVIDER_NAME: providerName,
      ORG_NAME: orgName,
      TODAY: dt,
    };
  }

  const rows =
    (data ?? []).map((t: any) => {
      if (!previewVars) return t;
      // If content has a string body, add preview; else try to stringify
      try {
        if (typeof t.content === "string") {
          return { ...t, preview: interpolate(t.content, previewVars) };
        }
        if (t?.content?.body && typeof t.content.body === "string") {
          return { ...t, preview: interpolate(t.content.body, previewVars) };
        }
        return t;
      } catch {
        return t;
      }
    }) ?? [];

  return jsonOk(rows, { total: count ?? 0, previewVars: previewVars ?? undefined });
}

/** -----------------------------
 * POST — upsert (create/update)
 * ------------------------------ */
export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const parsed = parseOrError(UpsertBody, raw);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data: au } = await supa.auth.getUser();
  if (!au?.user?.id) return jsonError("UNAUTHORIZED", "No autenticado", 401);

  const payload: Record<string, any> = {
    org_id: parsed.data.org_id,
    type: parsed.data.type,
    title: parsed.data.title,
    slug: parsed.data.slug ? slugify(parsed.data.slug) : slugify(parsed.data.title),
    description: parsed.data.description ?? null,
    content: parsed.data.content ?? {},
    is_active: parsed.data.is_active ?? true,
    provider_id: parsed.data.provider_id ?? null,
    created_by: au.user.id,
  };

  if (raw && raw.id) {
    // Update by id + org
    const { data, error } = await supa
      .from("agreements_templates")
      .update(payload)
      .eq("id", parsed.data.id!)
      .eq("org_id", parsed.data.org_id)
      .select("*")
      .single();
    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk(data);
  } else {
    // Upsert by unique (org_id, slug, provider_id)
    const { data, error } = await supa
      .from("agreements_templates")
      .upsert(payload, { onConflict: "org_id,slug,provider_id" })
      .select("*")
      .single();
    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk(data);
  }
}

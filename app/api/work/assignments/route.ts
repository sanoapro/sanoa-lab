// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const ListQuery = z.object({
  org_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(),
  provider_id: z.string().uuid().optional(),
  module: z.enum(["mente","equilibrio","sonrisa","pulso","general"]).optional(),
  status: z.enum(["active","completed","canceled"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const AssignBody = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(),
  items: z.array(z.object({
    patient_id: z.string().uuid(),
    template_id: z.string().uuid().optional(),
    module: z.enum(["mente","equilibrio","sonrisa","pulso","general"]).optional(),
    title: z.string().min(3).optional(),
    details: z.any().optional(),
    due_at: z.string().datetime().optional(),
  })).min(1),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const parsed = ListQuery.safeParse({
    org_id: qp.get("org_id"),
    patient_id: qp.get("patient_id") || undefined,
    provider_id: qp.get("provider_id") || undefined,
    module: qp.get("module") || undefined,
    status: qp.get("status") || undefined,
    from: qp.get("from") || undefined,
    to: qp.get("to") || undefined,
    limit: qp.get("limit") || undefined,
    offset: qp.get("offset") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  let q = supa
    .from("work_assignments")
    .select("*", { count: "exact" })
    .eq("org_id", parsed.data.org_id)
    .order("created_at", { ascending: false })
    .range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

  if (parsed.data.patient_id) q = q.eq("patient_id", parsed.data.patient_id);
  if (parsed.data.provider_id) q = q.eq("provider_id", parsed.data.provider_id);
  if (parsed.data.module) q = q.eq("module", parsed.data.module);
  if (parsed.data.status) q = q.eq("status", parsed.data.status);
  if (parsed.data.from) q = q.gte("due_at", parsed.data.from);
  if (parsed.data.to) q = q.lte("due_at", parsed.data.to);

  const { data, error, count } = await q;
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data ?? [], { total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const p = parseOrError(AssignBody, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  const provider_id = p.data.provider_id ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "Sin sesión", 401);

  const out: any[] = [];
  for (const it of p.data.items) {
    let title = it.title ?? null;
    let details = it.details ?? {};
    let module = it.module ?? "general";
    let template_id = it.template_id ?? null;

    if (template_id) {
      const { data: tpl, error } = await supa
        .from("work_templates")
        .select("id, module, title, content")
        .eq("id", template_id)
        .eq("org_id", p.data.org_id)
        .maybeSingle();
      if (error) return jsonError("DB_ERROR", error.message, 400);
      if (!tpl) return jsonError("NOT_FOUND", "Plantilla no encontrada", 404);
      title = title ?? tpl.title;
      details = Object.keys(details || {}).length ? details : (tpl.content ?? {});
      module = tpl.module as any;
    }

    out.push({
      org_id: p.data.org_id,
      patient_id: it.patient_id,
      provider_id,
      module,
      template_id,
      title: title ?? "Tarea",
      details,
      due_at: it.due_at ?? null,
      status: "active",
    });
  }

  const { data, error } = await supa.from("work_assignments").insert(out).select("*");
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const ListQuery = z.object({
  org_id: z.string().uuid(),
  patient_id: z.string().uuid().optional(),
  provider_id: z.string().uuid().optional(),
  module: z.enum(["mente", "equilibrio", "sonrisa", "pulso", "general"]).optional(),
  status: z.enum(["active", "completed", "canceled"]).optional(),
  from: z.string().datetime().optional(), // filtra por due_at >= from
  to: z.string().datetime().optional(), // filtra por due_at <= to
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});

const AssignBody = z.object({
  org_id: z.string().uuid(),
  provider_id: z.string().uuid().optional(),
  items: z
    .array(
      z.object({
        patient_id: z.string().uuid(),
        template_id: z.string().uuid().optional(),
        module: z.enum(["mente", "equilibrio", "sonrisa", "pulso", "general"]).optional(),
        title: z.string().min(3).optional(),
        details: z.any().optional(),
        due_at: z.string().datetime().optional(),
      }),
    )
    .min(1),
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
    const msg = parsed.error.issues.map((i: any) => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  const {
    org_id,
    patient_id,
    provider_id,
    module: moduleFilter,
    status,
    from,
    to,
    limit,
    offset,
  } = parsed.data;

  let sel = supa
    .from("work_assignments")
    .select("*", { count: "exact" })
    .eq("org_id", org_id)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (patient_id) sel = sel.eq("patient_id", patient_id);
  if (provider_id) sel = sel.eq("provider_id", provider_id);
  if (moduleFilter) sel = sel.eq("module", moduleFilter);
  if (status) sel = sel.eq("status", status);
  if (from) sel = sel.gte("due_at", from);
  if (to) sel = sel.lte("due_at", to);

  const { data, error, count } = await sel;
  if (error) return jsonError("DB_ERROR", error.message, 400);

  return jsonOk(data ?? [], { total: count ?? 0, limit, offset });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const p = parseOrError(AssignBody, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  // proveedor por defecto: usuario logueado
  const { data: me } = await supa.auth.getUser();
  const provider_id = p.data.provider_id ?? me?.user?.id ?? null;
  if (!provider_id) return jsonError("UNAUTHORIZED", "Sin sesión", 401);

  const out: any[] = [];

  for (const it of p.data.items) {
    let title = it.title ?? null;
    let details = it.details ?? {};
    let taskModule = it.module ?? "general";
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
      taskModule = (tpl.module as any) ?? taskModule;
    }

    out.push({
      org_id: p.data.org_id,
      patient_id: it.patient_id,
      provider_id,
      module: taskModule,
      template_id,
      title: title ?? "Tarea",
      details,
      due_at: it.due_at ?? null,
      status: "active",
    });
  }

  const { data, error } = await supa.from("work_assignments").insert(out).select("*");

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data ?? []);
}

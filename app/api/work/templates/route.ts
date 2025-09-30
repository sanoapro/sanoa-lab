// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const ListQuery = z.object({
  org_id: z.string().uuid(),
  module: z.enum(["mente","equilibrio","sonrisa","pulso","general"]).optional(),
  q: z.string().trim().optional(),
  limit: z.coerce.number().int().min(1).max(200).default(100),
  offset: z.coerce.number().int().min(0).default(0),
  include_inactive: z.union([z.literal("true"), z.literal("false")]).optional()
    .transform(v => v === "true"),
});

const UpsertBody = z.object({
  org_id: z.string().uuid(),
  id: z.string().uuid().optional(),
  module: z.enum(["mente","equilibrio","sonrisa","pulso","general"]),
  title: z.string().min(3),
  slug: z.string().trim().min(2).optional(),
  description: z.string().optional(),
  content: z.any().optional(), // JSON libre
  is_active: z.boolean().optional().default(true),
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const parsed = ListQuery.safeParse({
    org_id: qp.get("org_id"),
    module: qp.get("module") || undefined,
    q: qp.get("q") || undefined,
    limit: qp.get("limit") || undefined,
    offset: qp.get("offset") || undefined,
    include_inactive: qp.get("include_inactive") || undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }

  let q = supa
    .from("work_templates")
    .select("*", { count: "exact" })
    .eq("org_id", parsed.data.org_id)
    .order("updated_at", { ascending: false })
    .range(parsed.data.offset, parsed.data.offset + parsed.data.limit - 1);

  if (parsed.data.module) q = q.eq("module", parsed.data.module);
  if (!parsed.data.include_inactive) q = q.eq("is_active", true);
  if (parsed.data.q) q = q.ilike("title", `%${parsed.data.q}%`);

  const { data, error, count } = await q;
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data ?? [], { total: count ?? 0 });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const p = parseOrError(UpsertBody, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  const creator = me?.user?.id ?? null;
  if (!creator) return jsonError("UNAUTHORIZED", "Sin sesión", 401);

  const payload = {
    org_id: p.data.org_id,
    module: p.data.module,
    title: p.data.title,
    slug: p.data.slug ? slugify(p.data.slug) : slugify(p.data.title),
    description: p.data.description ?? null,
    content: p.data.content ?? {},
    is_active: p.data.is_active ?? true,
    created_by: creator,
  };

  if (p.data.id) {
    const { data, error } = await supa
      .from("work_templates")
      .update(payload)
      .eq("id", p.data.id)
      .eq("org_id", p.data.org_id)
      .select("*")
      .single();
    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk(data);
  } else {
    const { data, error } = await supa
      .from("work_templates")
      .upsert(payload, { onConflict: "org_id,slug" })
      .select("*")
      .single();
    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk(data);
  }
}

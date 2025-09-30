// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const QuerySchema = z.object({
  org_id: z.string().uuid(),
  module: z.enum(["mente", "equilibrio", "sonrisa", "pulso", "general"]).optional(),
  q: z.string().optional(),
  active: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

const BodySchema = z.object({
  org_id: z.string().uuid(),
  module: z.enum(["mente", "equilibrio", "sonrisa", "pulso", "general"]).default("general"),
  title: z.string().min(1).max(200),
  content: z.any(),           // JSON de ejercicios/tareas
  tags: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const qp = new URL(req.url).searchParams;
  const parsed = QuerySchema.safeParse({
    org_id: qp.get("org_id"),
    module: qp.get("module") || undefined,
    q: qp.get("q") || undefined,
    active: qp.get("active") ?? undefined,
    limit: qp.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ");
    return jsonError("VALIDATION_ERROR", msg, 400);
  }
  const { org_id, module, q, active, limit } = parsed.data;

  let sel = supa
    .from("work_templates")
    .select("id, org_id, module, title, content, tags, is_active, created_by, created_at")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (module) sel = sel.eq("module", module);
  if (typeof active === "boolean") sel = sel.eq("is_active", active);
  if (q && q.trim()) sel = sel.ilike("title", `%${q.trim()}%`);

  const { data, error } = await sel;
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data, error } = await supa
    .from("work_templates")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk<{ id: string }>(data);
}

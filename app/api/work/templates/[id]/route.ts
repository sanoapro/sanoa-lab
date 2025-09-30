// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const { data, error } = await supa
    .from("work_templates")
    .select("*")
    .eq("id", ctx.params.id)
    .single();
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(PatchSchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const { data, error } = await supa
    .from("work_templates")
    .update(parsed.data)
    .eq("id", ctx.params.id)
    .select("*")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const { error } = await supa.from("work_templates").delete().eq("id", ctx.params.id);
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk({ deleted: true });
}

// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  due_at: z.string().datetime().nullable().optional(),
  status: z.enum(["active", "paused", "completed", "canceled"]).optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const body = await parseJson(req);
  const parsed = parseOrError(PatchSchema, body);
  if (!parsed.ok) return jsonError(parsed.error.code, parsed.error.message, 400);

  const update = { ...parsed.data } as any;
  if (update.status === "completed" && !update.due_at) {
    update.last_done_at = new Date().toISOString();
  }

  const { data, error } = await supa
    .from("work_assignments")
    .update(update)
    .eq("id", ctx.params.id)
    .select("*")
    .single();

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const { data, error } = await supa
    .from("work_assignments")
    .select("*")
    .eq("id", ctx.params.id)
    .single();
  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk(data);
}

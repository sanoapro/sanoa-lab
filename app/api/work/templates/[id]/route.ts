// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

// ===== Schemas =====
const IdParams = z.object({ id: z.string().uuid() });

const PatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.any().optional(),
  tags: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

const DeleteBody = z.object({
  org_id: z.string().uuid(),
  hard_delete: z.boolean().optional(),
});

// ===== Handlers =====

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const pp = IdParams.safeParse(ctx.params);
    if (!pp.success) return jsonError("VALIDATION_ERROR", "id inválido", 400);

    const supa = await getSupabaseServer();
    const { data, error } = await supa
      .from("work_templates")
      .select("*")
      .eq("id", pp.data.id)
      .single();

    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk(data);
  } catch (e: any) {
    return jsonError("UNEXPECTED", e?.message ?? "Unexpected error", 500);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const pp = IdParams.safeParse(ctx.params);
    if (!pp.success) return jsonError("VALIDATION_ERROR", "id inválido", 400);

    const supa = await getSupabaseServer();
    const body = await parseJson(req);
    const parsed = parseOrError(PatchSchema, body);
    if (!parsed.ok) return jsonError("VALIDATION_ERROR", parsed.error.message, 400);

    const { data, error } = await supa
      .from("work_templates")
      .update(parsed.data)
      .eq("id", pp.data.id)
      .select("*")
      .single();

    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk(data);
  } catch (e: any) {
    return jsonError("UNEXPECTED", e?.message ?? "Unexpected error", 500);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: { id: string } }) {
  try {
    const pp = IdParams.safeParse(ctx.params);
    if (!pp.success) return jsonError("VALIDATION_ERROR", "id inválido", 400);

    const supa = await getSupabaseServer();

    // Body: org_id requerido; hard_delete opcional
    const raw = await parseJson(req);
    const parsed = parseOrError(DeleteBody, raw);
    if (!parsed.ok) return jsonError("VALIDATION_ERROR", "org_id requerido", 400);

    const { org_id, hard_delete } = parsed.data;

    if (hard_delete) {
      const { error } = await supa
        .from("work_templates")
        .delete()
        .eq("id", pp.data.id)
        .eq("org_id", org_id);

      if (error) return jsonError("DB_ERROR", error.message, 400);
      return jsonOk({ deleted: true });
    } else {
      const { error } = await supa
        .from("work_templates")
        .update({ is_active: false })
        .eq("id", pp.data.id)
        .eq("org_id", org_id);

      if (error) return jsonError("DB_ERROR", error.message, 400);
      return jsonOk({ deleted: true, soft: true });
    }
  } catch (e: any) {
    return jsonError("UNEXPECTED", e?.message ?? "Unexpected error", 500);
  }
}

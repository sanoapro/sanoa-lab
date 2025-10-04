import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, serverError, notFound } from "@/lib/api/responses";

const templateSchema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().min(1).optional(),
  name: z.string().min(1, "name requerido"),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        code: z.string().optional().nullable(),
        name: z.string().min(1, "name requerido"),
        notes: z.string().optional().nullable(),
      }),
    )
    .default([]),
  is_active: z.boolean().optional(),
});

const deleteSchema = z.object({
  id: z.string().min(1, "id requerido"),
  org_id: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const orgId = new URL(req.url).searchParams.get("org_id") || undefined;

    let query = supa
      .from("lab_test_templates")
      .select("id, org_id, name, notes, items, is_active, created_at")
      .order("created_at", { ascending: false });

    if (orgId) {
      query = query.eq("org_id", orgId);
    }

    const { data, error } = await query;
    if (error) {
      return dbError(error);
    }

    return ok({ rows: data ?? [] });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const json = await req.json().catch(() => null);
    const parsed = templateSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const { id, org_id, name, notes = "", items, is_active = true } = parsed.data;
    const nowIso = new Date().toISOString();
    const basePayload = {
      org_id: org_id ?? null,
      name,
      notes,
      items,
      is_active,
      updated_at: nowIso,
    };

    if (id) {
      const { data, error } = await supa
        .from("lab_test_templates")
        .update(basePayload)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      if (error) {
        return dbError(error);
      }

      if (!data) {
        return notFound("Plantilla no encontrada");
      }

      return ok({ id: data.id });
    }

    const insertPayload = {
      ...basePayload,
      created_by: auth.user.id,
    };

    const { data, error } = await supa
      .from("lab_test_templates")
      .insert(insertPayload)
      .select("id")
      .single();

    if (error) {
      return dbError(error);
    }

    return ok({ id: data.id });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

export async function DELETE(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const json = await req.json().catch(() => null);
    const parsed = deleteSchema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const { id, org_id } = parsed.data;

    let query = supa.from("lab_test_templates").delete().eq("id", id);
    if (org_id) {
      query = query.eq("org_id", org_id);
    }

    const { error, count } = await (query as any).select("id", { count: "exact" });
    if (error) {
      return dbError(error);
    }

    if (!count) {
      return notFound("Plantilla no encontrada");
    }

    return ok();
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

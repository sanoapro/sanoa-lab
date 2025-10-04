// /workspaces/sanoa-lab/app/api/lab/templates/upsert/route.ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, serverError } from "@/lib/api/responses";

// Define enum sin errorMap personalizado (React 19 + Zod más estricto)
const ownerKindSchema = z.enum(["user", "org"]);

const schema = z.object({
  id: z.string().uuid().optional(),
  org_id: z.string().min(1, "org_id requerido"),
  owner_kind: ownerKindSchema,
  title: z.string().min(1, "title requerido"),
  items: z
    .array(
      z.object({
        code: z.string().optional().nullable(),
        name: z.string().min(1, "name requerido"),
        notes: z.string().optional().nullable(),
      }),
    )
    .min(1, "items requerido"),
  is_active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const supaAny = supa as any;

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const { id, org_id, owner_kind, title, items, is_active = true } = parsed.data;

    const payload = {
      org_id,
      owner_kind,
      owner_id: owner_kind === "user" ? auth.user.id : null,
      title,
      items,
      is_active,
    };

    if (id) {
      let query = supaAny
        .from("lab_templates")
        .update(payload)
        .eq("id" as any, id as any)
        .eq("org_id" as any, org_id as any);
      if (owner_kind === "user") {
        query = query.eq("owner_id" as any, auth.user.id as any);
      }

      const { error } = await query;
      if (error) {
        return dbError(error);
      }

      return ok({ id });
    }

    const { data, error } = await supaAny
      .from("lab_templates")
      .insert(payload)
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

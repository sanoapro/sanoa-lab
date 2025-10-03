// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError, parseJson, parseOrError } from "@/lib/http/validate";

const PatchBody = z.object({
  org_id: z.string().uuid(),
  ids: z.array(z.string().uuid()).min(1),
  set: z
    .object({
      status: z.enum(["active", "completed", "canceled"]).optional(),
      due_at: z.string().datetime().optional(),
      last_done_at: z.string().datetime().optional(),
    })
    .refine((obj: any) => Object.keys(obj).length > 0, { message: "Nada que actualizar" }),
});

export async function PATCH(req: NextRequest) {
  const supa = await getSupabaseServer();
  const raw = await parseJson(req);
  const p = parseOrError(PatchBody, raw);
  if (!p.ok) return jsonError(p.error.code, p.error.message, 400);

  const { data: me } = await supa.auth.getUser();
  if (!me?.user?.id) return jsonError("UNAUTHORIZED", "Sin sesión", 401);

  const { error } = await supa
    .from("work_assignments")
    .update(p.data.set as any)
    .eq("org_id", p.data.org_id)
    .in("id", p.data.ids);

  if (error) return jsonError("DB_ERROR", error.message, 400);
  return jsonOk({ updated: p.data.ids.length });
}

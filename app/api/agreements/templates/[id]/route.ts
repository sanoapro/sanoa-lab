// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { jsonOk, jsonError } from "@/lib/http/validate";

const Params = z.object({ id: z.string().uuid() });
const Body = z.object({ org_id: z.string().uuid(), hard_delete: z.boolean().optional() });

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const pp = Params.safeParse(params);
  if (!pp.success) return jsonError("VALIDATION_ERROR", "id inválido", 400);

  const raw = await req.json().catch(() => ({}));
  const pb = Body.safeParse(raw);
  if (!pb.success) return jsonError("VALIDATION_ERROR", "org_id requerido", 400);

  if (pb.data.hard_delete) {
    const { error } = await supa
      .from("agreements_templates")
      .delete()
      .eq("id", pp.data.id)
      .eq("org_id", pb.data.org_id);
    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk({ deleted: true });
  } else {
    const { error } = await supa
      .from("agreements_templates")
      .update({ is_active: false })
      .eq("id", pp.data.id)
      .eq("org_id", pb.data.org_id);
    if (error) return jsonError("DB_ERROR", error.message, 400);
    return jsonOk({ deleted: true, soft: true });
  }
}

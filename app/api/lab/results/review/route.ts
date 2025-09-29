import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, notFound, serverError } from "@/lib/api/responses";

const schema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  result_id: z.string().min(1, "result_id requerido"),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();

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

    const { org_id, result_id } = parsed.data;

    const { data: result, error: fetchError } = await supa
      .from("lab_results")
      .select("id, request_id")
      .eq("id", result_id)
      .eq("org_id", org_id)
      .maybeSingle();

    if (fetchError) {
      return dbError(fetchError);
    }

    if (!result) {
      return notFound("Resultado no encontrado");
    }

    const nowIso = new Date().toISOString();

    const [{ error: updateResultError }, { error: updateRequestError }] = await Promise.all([
      supa
        .from("lab_results")
        .update({ reviewed_by: auth.user.id, reviewed_at: nowIso })
        .eq("id", result_id)
        .eq("org_id", org_id),
      supa
        .from("lab_requests")
        .update({ status: "reviewed" })
        .eq("id", result.request_id)
        .eq("org_id", org_id),
    ]);

    if (updateResultError) {
      return dbError(updateResultError);
    }

    if (updateRequestError) {
      return dbError(updateRequestError);
    }

    return ok();
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

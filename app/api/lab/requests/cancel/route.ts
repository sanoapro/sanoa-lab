import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, notFound, serverError } from "@/lib/api/responses";

const schema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  request_id: z.string().min(1, "request_id requerido"),
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

    const { org_id, request_id } = parsed.data;

    const { data, error } = await supa
      .from("lab_requests")
      .update({ status: "cancelled" })
      .eq("id", request_id)
      .eq("org_id", org_id)
      .select("id")
      .maybeSingle();

    if (error) {
      return dbError(error);
    }

    if (!data) {
      return notFound("Solicitud no encontrada");
    }

    return ok();
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

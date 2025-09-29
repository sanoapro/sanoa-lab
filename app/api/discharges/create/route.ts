import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, forbidden, dbError, serverError } from "@/lib/api/responses";
import { userBelongsToOrg } from "@/lib/api/orgs";

const schema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  patient_id: z.string().min(1, "patient_id requerido"),
  admission_at: z.string().optional().nullable(),
  discharge_at: z.string().optional().nullable(),
  diagnosis: z.string().min(1, "diagnosis requerido"),
  summary: z.string().min(1, "summary requerido"),
  recommendations: z.string().optional().nullable(),
  follow_up_at: z.string().optional().nullable(),
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

    const body = parsed.data;

    const allowed = await userBelongsToOrg(supa, body.org_id, auth.user.id);
    if (!allowed) {
      return forbidden("Sin acceso a la organización");
    }

    const { data, error } = await supa
      .from("discharges")
      .insert({
        org_id: body.org_id,
        patient_id: body.patient_id,
        doctor_id: auth.user.id,
        admission_at: body.admission_at ?? null,
        discharge_at: body.discharge_at ?? null,
        diagnosis: body.diagnosis,
        summary: body.summary,
        recommendations: body.recommendations ?? null,
        follow_up_at: body.follow_up_at ?? null,
      })
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

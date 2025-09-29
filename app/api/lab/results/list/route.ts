import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, serverError } from "@/lib/api/responses";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return badRequest("org_id requerido");
    }

    const requestId = url.searchParams.get("request_id");
    const patientId = url.searchParams.get("patient_id");

    if (!requestId && !patientId) {
      return badRequest("request_id o patient_id requerido");
    }

    let query = supa
      .from("lab_results")
      .select(
        "id, request_id, patient_id, file_path, file_name, mime_type, size_bytes, notes, created_at, reviewed_by, reviewed_at",
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    if (requestId) {
      query = query.eq("request_id", requestId);
    }
    if (patientId) {
      query = query.eq("patient_id", patientId);
    }

    const { data, error } = await query;
    if (error) {
      return dbError(error);
    }

    return ok({ results: data ?? [] });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

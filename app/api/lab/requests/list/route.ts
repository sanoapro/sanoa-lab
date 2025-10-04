import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, dbError, serverError } from "@/lib/api/responses";
import { getSupabaseServer } from "@/lib/supabase/server";

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

    const patientId = url.searchParams.get("patient_id") || undefined;
    const status = url.searchParams.get("status") || undefined;
    const createdFrom = url.searchParams.get("from") || undefined;
    const createdTo = url.searchParams.get("to") || undefined;

    const limitRaw = Number(url.searchParams.get("limit") || 100);
    const limit = Number.isFinite(limitRaw) ? Math.min(200, Math.max(1, limitRaw)) : 100;

    let query = supa
      .from("lab_requests")
      .select(
        `
        id, org_id, patient_id, title, status, due_at, created_at,
        lab_results ( file_path )
      `,
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (patientId) {
      query = query.eq("patient_id", patientId);
    }
    if (status) {
      query = query.eq("status", status as any);
    }
    if (createdFrom) {
      query = query.gte("created_at", createdFrom);
    }
    if (createdTo) {
      query = query.lte("created_at", createdTo);
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

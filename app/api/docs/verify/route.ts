// MODE: service (no session, no cookies)
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError, getQuery } from "@/lib/http/validate";

/** Uso: /api/docs/verify?type=prescription&id=<uuid>&code=<verify_code> */
export async function GET(req: NextRequest) {
  try {
    const svc = createServiceClient();
    const sp = getQuery(req);
    const type = sp.get("type")?.trim() ?? "";
    const id = sp.get("id")?.trim() ?? "";
    const code = sp.get("code")?.trim() ?? "";

    if (!type || !id || !code) {
      return jsonError(
        "BAD_REQUEST",
        "Parámetros type, id y code son requeridos",
        400,
      );
    }

    const { data: led, error } = await svc
      .from("document_ledger")
      .select("*")
      .eq("doc_type", type)
      .eq("doc_id", id)
      .eq("verify_code", code)
      .maybeSingle();

    if (error) return jsonError("DB_ERROR", error.message, 500);

    if (!led) return jsonOk({ valid: false });

    let created_at: string | null = null;

    if (type === "prescription") {
      const { data, error: e1 } = await svc
        .from("prescriptions")
        .select("created_at")
        .eq("id", id)
        .maybeSingle();
      if (e1) return jsonError("DB_ERROR", e1.message, 500);
      created_at = data?.created_at ?? null;
    } else if (type === "referral") {
      const { data, error: e2 } = await svc
        .from("referrals")
        .select("created_at")
        .eq("id", id)
        .maybeSingle();
      if (e2) return jsonError("DB_ERROR", e2.message, 500);
      created_at = data?.created_at ?? null;
    } else if (type === "discharge") {
      const { data, error: e3 } = await svc
        .from("discharges")
        .select("created_at")
        .eq("id", id)
        .maybeSingle();
      if (e3) return jsonError("DB_ERROR", e3.message, 500);
      created_at = data?.created_at ?? null;
    } else if (type === "lab_request") {
      const { data, error: e4 } = await svc
        .from("lab_requests")
        .select("created_at")
        .eq("id", id)
        .maybeSingle();
      if (e4) return jsonError("DB_ERROR", e4.message, 500);
      created_at = data?.created_at ?? null;
    }

    const revoked = !!led.revoked_at;
    return jsonOk({
      valid: !revoked,
      revoked,
      revoked_at: led.revoked_at ?? null,
      folio: led.folio,
      created_at,
    });
  } catch (e: any) {
    return jsonError("UNEXPECTED", e?.message ?? "Unexpected error", 500);
  }
}

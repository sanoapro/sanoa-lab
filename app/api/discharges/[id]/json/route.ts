import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, notFound, dbError, serverError } from "@/lib/api/responses";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const orgId = new URL(req.url).searchParams.get("org_id");
    if (!orgId) {
      return badRequest("org_id requerido");
    }

    const { data: discharge, error: dischargeError } = await supa
      .from("discharges")
      .select("*")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (dischargeError) {
      return dbError(dischargeError);
    }

    if (!discharge) {
      return notFound("Alta no encontrada");
    }

    const [{ data: patient, error: patientError }, { data: letterhead, error: letterheadError }] = await Promise.all([
      supa
        .from("patients")
        .select("full_name, external_id")
        .eq("id", discharge.patient_id)
        .maybeSingle(),
      supa
        .from("doctor_letterheads")
        .select("*")
        .eq("org_id", discharge.org_id)
        .eq("doctor_id", discharge.doctor_id)
        .maybeSingle(),
    ]);

    if (patientError) {
      return dbError(patientError);
    }

    if (letterheadError) {
      return dbError(letterheadError);
    }

    let footer = letterhead?.footer_disclaimer || "";
    if (!footer) {
      const { data: disclaimer, error: disclaimerError } = await supa
        .from("org_disclaimers")
        .select("text")
        .eq("org_id", discharge.org_id)
        .eq("kind", "discharge")
        .maybeSingle();

      if (disclaimerError) {
        return dbError(disclaimerError);
      }

      footer = disclaimer?.text || footer;
    }

    const { data: ledger, error: ledgerError } = await supa.rpc("ensure_document_folio", {
      p_doc_type: "discharge",
      p_doc_id: params.id,
    });

    if (ledgerError) {
      return dbError(ledgerError);
    }

    return ok({
      discharge,
      patient,
      letterhead,
      footer,
      ledger,
    });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

import { NextRequest } from "next/server";
import { ok, badRequest, unauthorized, notFound, dbError, serverError } from "@/lib/api/responses";
import { getSupabaseServer } from "@/lib/supabase/server";

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

    const { data: request, error: requestError } = await supa
      .from("lab_requests")
      .select("*")
      .eq("id", params.id)
      .eq("org_id", orgId)
      .maybeSingle();

    if (requestError) {
      return dbError(requestError);
    }

    if (!request) {
      return notFound("Solicitud no encontrada");
    }

    const [{ data: items, error: itemsError }, { data: patient, error: patientError }] =
      await Promise.all([
        supa.from("lab_request_items").select("*").eq("request_id", params.id).order("id"),
        supa
          .from("patients")
          .select("full_name, external_id")
          .eq("id", request.patient_id)
          .maybeSingle(),
      ]);

    if (itemsError) {
      return dbError(itemsError);
    }

    if (patientError) {
      return dbError(patientError);
    }

    const { data: letterhead, error: letterheadError } = await supa
      .from("doctor_letterheads")
      .select("*")
      .eq("org_id", request.org_id)
      .eq("doctor_id", request.requested_by)
      .maybeSingle();

    if (letterheadError) {
      return dbError(letterheadError);
    }

    let footer = letterhead?.footer_disclaimer || "";
    if (!footer) {
      const { data: disclaimer, error: disclaimerError } = await supa
        .from("org_disclaimers")
        .select("text")
        .eq("org_id", request.org_id)
        .eq("kind", "labs")
        .maybeSingle();

      if (disclaimerError) {
        return dbError(disclaimerError);
      }

      footer = disclaimer?.text || footer;
    }

    const { data: ledger, error: ledgerError } = await supa.rpc("ensure_document_folio", {
      p_doc_type: "lab_request",
      p_doc_id: params.id,
    });

    if (ledgerError) {
      return dbError(ledgerError);
    }

    return ok({
      request,
      items: items ?? [],
      patient,
      letterhead,
      footer,
      ledger,
    });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

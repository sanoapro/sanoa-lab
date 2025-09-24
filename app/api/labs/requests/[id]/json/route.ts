import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;

  const { data: req } = await supabase
    .from("lab_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!req) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const { data: items } = await supabase
    .from("lab_request_items")
    .select("*")
    .eq("request_id", id)
    .order("id");

  const { data: patient } = await supabase
    .from("patients")
    .select("full_name, external_id")
    .eq("id", req.patient_id)
    .maybeSingle();

  // Usa el mismo esquema de membretes/firmas que recetas/interconsulta/alta
  const { data: letterhead } = await supabase
    .from("doctor_letterheads")
    .select("*")
    .eq("org_id", req.org_id)
    .eq("doctor_id", req.requested_by)
    .maybeSingle();

  // Disclaimer por tipo "labs"
  let footer = letterhead?.footer_disclaimer || "";
  if (!footer) {
    const { data: d } = await supabase
      .from("org_disclaimers")
      .select("text")
      .eq("org_id", req.org_id)
      .eq("kind", "labs")
      .maybeSingle();
    footer = d?.text || footer;
  }

  const { data: ledger } = await supabase.rpc("ensure_document_folio", {
    p_doc_type: "lab_request",
    p_doc_id: id,
  });

  return NextResponse.json({
    request: req,
    items,
    patient,
    letterhead,
    footer,
    ledger,
  });
}

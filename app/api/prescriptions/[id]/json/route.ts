import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;

  const { data: rx } = await supabase.from("prescriptions").select("*").eq("id", id).maybeSingle();
  if (!rx) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const { data: items } = await supabase.from("prescription_items").select("*").eq("prescription_id", id).order("id");
  const { data: patient } = await supabase.from("patients").select("full_name, external_id").eq("id", rx.patient_id).maybeSingle();
  const { data: letterhead } = await supabase.from("doctor_letterheads").select("*").eq("org_id", rx.org_id).eq("doctor_id", rx.doctor_id).maybeSingle();
  const { data: d } = await supabase.from("org_disclaimers").select("text").eq("org_id", rx.org_id).eq("kind","prescription").maybeSingle();
  const { data: ledger } = await supabase.rpc("ensure_document_folio", { p_doc_type: "prescription", p_doc_id: id });

  return NextResponse.json({ prescription: rx, items, patient, letterhead, footer: letterhead?.footer_disclaimer || d?.text || "", ledger });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;
  const { data: dis } = await supabase.from("discharges").select("*").eq("id", id).maybeSingle();
  if (!dis) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const { data: patient } = await supabase
    .from("patients")
    .select("full_name, external_id")
    .eq("id", dis.patient_id)
    .maybeSingle();
  const { data: letterhead } = await supabase
    .from("doctor_letterheads")
    .select("*")
    .eq("org_id", dis.org_id)
    .eq("doctor_id", dis.doctor_id)
    .maybeSingle();
  const { data: d } = await supabase
    .from("org_disclaimers")
    .select("text")
    .eq("org_id", dis.org_id)
    .eq("kind", "discharge")
    .maybeSingle();
  const { data: ledger } = await supabase.rpc("ensure_document_folio", {
    p_doc_type: "discharge",
    p_doc_id: id,
  });

  return NextResponse.json({
    discharge: dis,
    patient,
    letterhead,
    footer: letterhead?.footer_disclaimer || d?.text || "",
    ledger,
  });
}

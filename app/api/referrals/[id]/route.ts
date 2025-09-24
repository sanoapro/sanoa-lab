import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = createRouteHandlerClient({ cookies });
  const id = params.id;
  const { data: ref } = await supabase.from("referrals").select("*").eq("id", id).maybeSingle();
  if (!ref) return NextResponse.json({ error: "No encontrada" }, { status: 404 });

  const { data: patient } = await supabase
    .from("patients")
    .select("full_name, external_id")
    .eq("id", ref.patient_id)
    .maybeSingle();
  const { data: letterhead } = await supabase
    .from("doctor_letterheads")
    .select("*")
    .eq("org_id", ref.org_id)
    .eq("doctor_id", ref.doctor_id)
    .maybeSingle();
  const { data: d } = await supabase
    .from("org_disclaimers")
    .select("text")
    .eq("org_id", ref.org_id)
    .eq("kind", "referral")
    .maybeSingle();
  const { data: ledger } = await supabase.rpc("ensure_document_folio", {
    p_doc_type: "referral",
    p_doc_id: id,
  });

  return NextResponse.json({
    referral: ref,
    patient,
    letterhead,
    footer: letterhead?.footer_disclaimer || d?.text || "",
    ledger,
  });
}

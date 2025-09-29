import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type Params = { params: { id: string } };

type PrescriptionItemRow = {
  drug: string;
  dose: string | null;
  route: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
};

export async function GET(_: NextRequest, { params }: Params) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const id = params.id;
  const { data: rec, error: e1 } = await supa
    .from("prescriptions")
    .select(
      "id, org_id, patient_id, doctor_id, clinician_id, letterhead_path, signature_path, notes, diagnosis, issued_at, created_at, created_by"
    )
    .eq("id", id)
    .maybeSingle();

  if (e1 || !rec) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "No encontrada" } },
      { status: 404 }
    );
  }

  const { data: itemsRows, error: e2 } = await supa
    .from("prescription_items")
    .select("drug, dose, route, frequency, duration, instructions")
    .eq("prescription_id", id)
    .order("created_at", { ascending: true });

  if (e2) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e2.message } },
      { status: 400 }
    );
  }

  const items = (itemsRows ?? []).map((it: PrescriptionItemRow) => {
    const freq = it.frequency ?? null;
    return {
      drug: it.drug,
      dose: it.dose,
      route: it.route,
      freq,
      frequency: freq,
      duration: it.duration,
      instructions: it.instructions,
    };
  });

  const { data: patient } = await supa
    .from("patients")
    .select("id, full_name, external_id")
    .eq("id", rec.patient_id)
    .maybeSingle();

  let footer = null as string | null;
  let letterhead: any = null;
  if (rec.letterhead_path || rec.signature_path) {
    letterhead = {
      logo_url: rec.letterhead_path ?? null,
      signature_url: rec.signature_path ?? null,
      footer_disclaimer: null,
    };
  } else {
    const { data: lh } = await supa
      .from("doctor_letterheads")
      .select("logo_url, signature_url, footer_disclaimer")
      .eq("org_id", rec.org_id)
      .eq("doctor_id", rec.doctor_id ?? rec.clinician_id ?? au.user.id)
      .maybeSingle();
    if (lh) {
      letterhead = lh;
      footer = lh.footer_disclaimer ?? null;
    }
  }

  if (!footer) {
    const { data: d } = await supa
      .from("org_disclaimers")
      .select("text")
      .eq("org_id", rec.org_id)
      .eq("kind", "prescription")
      .maybeSingle();
    footer = d?.text ?? null;
  }

  const { data: ledger } = await supa.rpc("ensure_document_folio", {
    p_doc_type: "prescription",
    p_doc_id: id,
  });

  const clinicianId = rec.clinician_id ?? rec.doctor_id ?? null;

  const data = {
    id: rec.id,
    org_id: rec.org_id,
    patient_id: rec.patient_id,
    clinician_id: clinicianId,
    doctor_id: rec.doctor_id ?? null,
    letterhead_path: rec.letterhead_path ?? null,
    signature_path: rec.signature_path ?? null,
    notes: rec.notes ?? null,
    diagnosis: rec.diagnosis ?? null,
    issued_at: rec.issued_at,
    created_at: rec.created_at,
    created_by: rec.created_by ?? null,
    items,
  };

  return NextResponse.json({
    ok: true,
    data,
    prescription: { ...data },
    items,
    patient,
    letterhead,
    footer,
    ledger,
  });
}

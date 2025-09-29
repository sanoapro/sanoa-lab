import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function mapItem(it: any) {
  return {
    id: it.id,
    drug: it.drug,
    dose: it.dose,
    route: it.route,
    freq: it.frequency ?? it.freq ?? null,
    frequency: it.frequency ?? null,
    duration: it.duration,
    instructions: it.instructions,
  };
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const id = params.id;
  const { data: rx, error: e1 } = await supa
    .from("prescriptions")
    .select(
      "id, org_id, patient_id, doctor_id, clinician_id, letterhead_path, signature_path, notes, diagnosis, issued_at, created_at, created_by"
    )
    .eq("id", id)
    .maybeSingle();

  if (e1 || !rx) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "No encontrada" } },
      { status: 404 }
    );
  }

  const { data: itemsRaw, error: e2 } = await supa
    .from("prescription_items")
    .select("id, drug, dose, route, frequency, duration, instructions, created_at")
    .eq("prescription_id", id)
    .order("created_at", { ascending: true });

  if (e2) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e2.message } },
      { status: 400 }
    );
  }

  const items = (itemsRaw || []).map(mapItem);

  const { data: patient } = await supa
    .from("patients")
    .select("full_name, external_id")
    .eq("id", rx.patient_id)
    .maybeSingle();

  const { data: letterhead } = await supa
    .from("doctor_letterheads")
    .select("*")
    .eq("org_id", rx.org_id)
    .eq("doctor_id", rx.doctor_id)
    .maybeSingle();

  let footer = letterhead?.footer_disclaimer || "";
  if (!footer) {
    const { data: d } = await supa
      .from("org_disclaimers")
      .select("text")
      .eq("org_id", rx.org_id)
      .eq("kind", "prescription")
      .maybeSingle();
    footer = d?.text || footer;
  }

  const { data: ledger } = await supa.rpc("ensure_document_folio", {
    p_doc_type: "prescription",
    p_doc_id: id,
  });

  const response = {
    ok: true,
    data: {
      ...rx,
      items: items.map((it) => ({
        drug: it.drug,
        dose: it.dose,
        route: it.route,
        freq: it.freq,
        duration: it.duration,
        instructions: it.instructions,
      })),
    },
    prescription: rx,
    items,
    patient,
    letterhead,
    footer,
    ledger,
  };

  return NextResponse.json(response);
}

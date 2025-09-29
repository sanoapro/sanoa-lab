import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

interface LegacyItem {
  drug?: string;
  drug_name?: string;
  dose?: string | null;
  route?: string | null;
  freq?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
}

interface CreateBody {
  org_id?: string;
  patient_id?: string;
  clinician_id?: string | null;
  doctor_id?: string | null;
  letterhead_path?: string | null;
  signature_path?: string | null;
  notes?: string | null;
  diagnosis?: string | null;
  issued_at?: string | null;
  items?: LegacyItem[];
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as CreateBody | null;
  const rawItems = Array.isArray(body?.items) ? body!.items : [];

  let orgId = body?.org_id ?? null;
  if (!orgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    orgId = mem?.org_id ?? null;
  }

  const patientId = body?.patient_id ?? null;
  if (!orgId || !patientId || rawItems.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "org_id, patient_id e items requeridos",
        },
      },
      { status: 400 }
    );
  }

  let issued = new Date();
  if (body?.issued_at) {
    const parsed = new Date(body.issued_at);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "issued_at inválido" } },
        { status: 400 }
      );
    }
    issued = parsed;
  }

  const notes = body?.notes ?? null;
  const diagnosis = body?.diagnosis ?? null;

  const insertPayload: Record<string, any> = {
    org_id: orgId,
    patient_id: patientId,
    doctor_id: body?.clinician_id ?? body?.doctor_id ?? au.user.id,
    letterhead_path: body?.letterhead_path ?? null,
    signature_path: body?.signature_path ?? null,
    notes: notes ? String(notes).slice(0, 2000) : null,
    issued_at: issued.toISOString(),
    created_by: au.user.id,
  };

  if (diagnosis) {
    insertPayload.diagnosis = String(diagnosis).slice(0, 2000);
  }

  const { data: rec, error: e1 } = await supa
    .from("prescriptions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (e1) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1.message } },
      { status: 400 }
    );
  }

  const items = rawItems.map((it) => {
    const freq = it.freq ?? it.frequency ?? null;
    return {
      prescription_id: rec!.id,
      drug: String(it.drug ?? it.drug_name ?? "").slice(0, 200),
      dose: it.dose ? String(it.dose).slice(0, 120) : null,
      route: it.route ? String(it.route).slice(0, 80) : null,
      frequency: freq ? String(freq).slice(0, 120) : null,
      duration: it.duration ? String(it.duration).slice(0, 120) : null,
      instructions: it.instructions ? String(it.instructions).slice(0, 500) : null,
    };
  });

  const filteredItems = items.filter((it) => it.drug.trim().length > 0);

  if (filteredItems.length > 0) {
    const { error: e2 } = await supa
      .from("prescription_items")
      .insert(filteredItems);
    if (e2) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: e2.message } },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true, data: { id: rec!.id } });
}

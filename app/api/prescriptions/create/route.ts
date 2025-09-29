import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type ItemInput = {
  drug?: string;
  dose?: string | null;
  route?: string | null;
  freq?: string | null;
  frequency?: string | null;
  duration?: string | null;
  instructions?: string | null;
};

type BodyInput = {
  org_id?: string | null;
  patient_id?: string | null;
  clinician_id?: string | null;
  letterhead_path?: string | null;
  signature_path?: string | null;
  notes?: string | null;
  diagnosis?: string | null;
  issued_at?: string | null;
  items?: ItemInput[] | null;
};

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as BodyInput | null;
  const rawItems = body?.items ?? [];

  let orgId = body?.org_id ?? null;
  if (!orgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    orgId = mem?.org_id ?? null;
  }

  if (!orgId || !body?.patient_id || !Array.isArray(rawItems) || rawItems.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, patient_id e items requeridos" },
      },
      { status: 400 }
    );
  }

  const issued = body?.issued_at ? new Date(body.issued_at) : new Date();
  if (Number.isNaN(issued.getTime())) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "issued_at inválido" } },
      { status: 400 }
    );
  }

  const payload: Record<string, any> = {
    org_id: orgId,
    patient_id: body.patient_id,
    doctor_id: au.user.id,
    notes: body?.notes ? String(body.notes).slice(0, 2000) : null,
    issued_at: issued.toISOString(),
    created_by: au.user.id,
  };

  if (typeof body?.clinician_id !== "undefined" && body.clinician_id !== null) {
    payload.clinician_id = body.clinician_id;
  }
  if (typeof body?.letterhead_path !== "undefined") {
    payload.letterhead_path = body.letterhead_path ?? null;
  }
  if (typeof body?.signature_path !== "undefined") {
    payload.signature_path = body.signature_path ?? null;
  }
  if (typeof body?.diagnosis !== "undefined") {
    payload.diagnosis = body.diagnosis ? String(body.diagnosis).slice(0, 2000) : null;
  }

  const { data: rec, error: e1 } = await supa
    .from("prescriptions")
    .insert(payload)
    .select("id")
    .single();

  if (e1 || !rec) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1?.message || "Error al crear" } },
      { status: 400 }
    );
  }

  const items = rawItems.map((it) => {
    const frequency = it?.freq ?? it?.frequency ?? null;
    return {
      prescription_id: rec.id,
      drug: String(it?.drug ?? "").slice(0, 200),
      dose: it?.dose ? String(it.dose).slice(0, 120) : null,
      route: it?.route ? String(it.route).slice(0, 80) : null,
      frequency: frequency ? String(frequency).slice(0, 120) : null,
      duration: it?.duration ? String(it.duration).slice(0, 120) : null,
      instructions: it?.instructions ? String(it.instructions).slice(0, 500) : null,
    };
  });

  const { error: e2 } = await supa.from("prescription_items").insert(items);
  if (e2) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e2.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true, data: { id: rec.id }, id: rec.id });
}

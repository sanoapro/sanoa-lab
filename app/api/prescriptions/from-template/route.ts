import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

interface FromTemplateBody {
  org_id?: string | null;
  patient_id?: string | null;
  template_id?: string | null;
  clinician_id?: string | null;
  letterhead_path?: string | null;
  signature_path?: string | null;
  issued_at?: string | null; // ISO string
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

  const body = (await req.json().catch(() => null)) as FromTemplateBody | null;

  // org_id: del body o por membership
  let orgId = body?.org_id ?? null;
  if (!orgId) {
    const { data: mem } = await supa
      .from("organization_members")
      .select("org_id")
      .eq("user_id", au.user.id)
      .maybeSingle();
    orgId = mem?.org_id ?? null;
  }

  if (!orgId || !body?.patient_id || !body?.template_id) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, patient_id, template_id requeridos" },
      },
      { status: 400 }
    );
  }

  // Cargar plantilla
  const { data: tpl, error: e0 } = await supa
    .from("prescription_templates")
    .select("id, org_id, name, notes, items, doctor_id, created_by")
    .eq("id", body.template_id)
    .eq("org_id", orgId)
    .maybeSingle();

  if (e0 || !tpl) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Plantilla no encontrada" } },
      { status: 404 }
    );
  }

  // issued_at
  let issued = new Date();
  if (body.issued_at) {
    const parsed = new Date(body.issued_at);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "issued_at inválido" } },
        { status: 400 }
      );
    }
    issued = parsed;
  }

  // Insert cabecera
  const insertPayload: Record<string, any> = {
    org_id: orgId,
    patient_id: body.patient_id,
    // preferimos el doctor de la plantilla; si no, quien la creó; si no, el usuario actual
    doctor_id: tpl.doctor_id ?? tpl.created_by ?? au.user.id,
    clinician_id: body.clinician_id ?? null,
    letterhead_path: body.letterhead_path ?? null,
    signature_path: body.signature_path ?? null,
    notes: tpl.notes ? String(tpl.notes).slice(0, 2000) : null,
    issued_at: issued.toISOString(),
    created_by: au.user.id,
  };

  const { data: rec, error: e1 } = await supa
    .from("prescriptions")
    .insert(insertPayload)
    .select("id")
    .single();

  if (e1 || !rec) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1?.message || "Error al crear" } },
      { status: 400 }
    );
  }

  // Items desde la plantilla
  const tplItems = Array.isArray(tpl.items) ? (tpl.items as any[]) : [];
  const items = tplItems.map((it) => {
    const freq = (it.freq ?? it.frequency ?? it.freq_per ?? null) as string | null;
    return {
      prescription_id: rec.id,
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
    const { error: e2 } = await supa.from("prescription_items").insert(filteredItems);
    if (e2) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: e2.message } },
        { status: 400 }
      );
    }
  }

  return NextResponse.json({ ok: true, data: { id: rec.id } });
}

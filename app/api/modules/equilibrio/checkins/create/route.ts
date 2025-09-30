// MODE: session (user-scoped, cookies)
// POST /api/modules/equilibrio/checkins/create
// { org_id, patient_id, plan_id, item_id, date?: 'YYYY-MM-DD', status: 'done'|'skipped', note? }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    patient_id?: string;
    plan_id?: string;
    item_id?: string;
    date?: string;
    status?: "done" | "skipped";
    note?: string | null;
  };
  if (!body?.org_id || !body?.patient_id || !body?.plan_id || !body?.item_id || !body?.status) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Campos requeridos faltantes" } },
      { status: 400 },
    );
  }

  const day = body.date ? new Date(body.date) : new Date();
  const yyyy_mm_dd = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()))
    .toISOString()
    .slice(0, 10);

  const { data, error } = await supa
    .from("equilibrio_checkins")
    .insert({
      org_id: body.org_id,
      patient_id: body.patient_id,
      plan_id: body.plan_id,
      item_id: body.item_id,
      day: yyyy_mm_dd,
      status: body.status,
      note: body.note ? String(body.note).slice(0, 500) : null,
      created_by: auth.user.id,
    })
    .select("id, day, status, created_at")
    .single();

  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  return NextResponse.json({ ok: true, data });
}

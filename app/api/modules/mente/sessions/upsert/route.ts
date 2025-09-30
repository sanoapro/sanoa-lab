import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    patient_id?: string;
    note_json?: any;
    sign?: boolean;
  };
  if (!body?.org_id || !body?.patient_id || typeof body.note_json === "undefined")
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, patient_id y note_json son requeridos" },
      },
      { status: 400 },
    );

  const row: any = {
    org_id: body.org_id,
    patient_id: body.patient_id,
    note_json: body.note_json,
    created_by: u.user.id,
  };
  if (body.sign) {
    row.signed_by = u.user.id;
    row.signed_at = new Date().toISOString();
  }

  const { data, error } = await supa
    .from("mente_sessions")
    .insert(row)
    .select("id,org_id,patient_id,signed_by,signed_at,created_at")
    .single();

  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );

  return NextResponse.json({ ok: true, data });
}

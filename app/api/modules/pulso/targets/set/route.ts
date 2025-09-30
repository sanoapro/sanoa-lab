// MODE: session (user-scoped, cookies)
// POST /api/modules/pulso/targets/set
// { org_id, patient_id, items: [{ type, low?: number|null, high?: number|null }] }
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
    items?: Array<{ type?: string; low?: number | null; high?: number | null }>;
  };
  if (!body?.org_id || !body?.patient_id || !Array.isArray(body.items)) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, patient_id e items requeridos" },
      },
      { status: 400 },
    );
  }

  const rows = body.items
    .filter((x) => x?.type)
    .map((x) => ({
      org_id: body.org_id!,
      patient_id: body.patient_id!,
      type: String(x.type),
      target_low: typeof x.low === "number" ? x.low : null,
      target_high: typeof x.high === "number" ? x.high : null,
      created_by: u.user!.id,
    }));

  // Upsert por (org_id, patient_id, type)
  const { data, error } = await supa
    .from("pulso_targets")
    .upsert(rows, { onConflict: "org_id,patient_id,type" })
    .select("id, type, target_low, target_high, updated_at");

  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  return NextResponse.json({ ok: true, data });
}

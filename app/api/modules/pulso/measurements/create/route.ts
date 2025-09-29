// MODE: session (user-scoped, cookies)
// POST /api/modules/pulso/measurements/create
// { org_id, patient_id, items: [{ type, value, unit?, measured_at?, note? }, ...] }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });
  }

  const body = await req.json().catch(()=>null) as {
    org_id?: string; patient_id?: string;
    items?: Array<{ type?: string; value?: number; unit?: string; measured_at?: string; note?: string }>;
  };
  if (!body?.org_id || !body?.patient_id || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id, patient_id e items requeridos" }}, { status:400 });
  }

  const rows = body.items
    .filter(x => x && typeof x.type === "string" && typeof x.value === "number" && !Number.isNaN(x.value))
    .map(x => ({
      org_id: body.org_id!,
      patient_id: body.patient_id!,
      type: x.type!,
      value: x.value!,
      unit: (x.unit || "").slice(0, 16) || null,
      measured_at: x.measured_at ?? null,
      note: x.note ? String(x.note).slice(0, 500) : null,
      created_by: u.user!.id,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"No hay items válidos" }}, { status:400 });
  }

  const { data, error } = await supa.from("pulso_measurements")
    .insert(rows)
    .select("id, type, value, unit, measured_at, created_at")
    .limit(rows.length);

  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message }}, { status:400 });
  return NextResponse.json({ ok:true, data });
}

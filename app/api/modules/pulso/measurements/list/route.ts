// MODE: session (user-scoped, cookies)
// GET /api/modules/pulso/measurements/list?org_id&patient_id&types=bp_sys,bp_dia&from&to&limit=200
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const patient_id = url.searchParams.get("patient_id");
  if (!org_id || !patient_id) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id y patient_id requeridos" }}, { status:400 });

  let q = supa.from("pulso_measurements")
    .select("id, type, value, unit, measured_at, note, created_at")
    .eq("org_id", org_id)
    .eq("patient_id", patient_id)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });

  const types = url.searchParams.get("types");
  if (types) q = q.in("type", types.split(",").map(s=>s.trim()).filter(Boolean));
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from) q = q.gte("measured_at", from);
  if (to) q = q.lte("measured_at", to);

  const lim = Math.min(Number(url.searchParams.get("limit") || 200), 500);
  const { data, error } = await q.limit(lim);
  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message }}, { status:400 });
  return NextResponse.json({ ok:true, data });
}

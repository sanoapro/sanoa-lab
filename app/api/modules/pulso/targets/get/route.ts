// MODE: session (user-scoped, cookies)
// GET /api/modules/pulso/targets/get?org_id&patient_id
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

  const { data, error } = await supa.from("pulso_targets")
    .select("id, type, target_low, target_high, updated_at")
    .eq("org_id", org_id)
    .eq("patient_id", patient_id)
    .order("type", { ascending: true });

  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message }}, { status:400 });
  return NextResponse.json({ ok:true, data });
}

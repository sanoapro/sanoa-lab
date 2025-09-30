import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const patient_id = url.searchParams.get("patient_id");
  if (!org_id)
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 },
    );

  let q = supa
    .from("mente_assessments")
    .select("id,org_id,patient_id,tool,score_total,risk_band,issued_at,created_at")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  if (patient_id) q = q.eq("patient_id", patient_id);
  const tool = url.searchParams.get("tool");
  if (tool) q = q.eq("tool", tool);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data, error } = await q.limit(200);
  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  return NextResponse.json({ ok: true, data });
}

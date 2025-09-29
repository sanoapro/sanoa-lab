import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" } }, { status:401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id requerido" } }, { status:400 });

  const from = url.searchParams.get("from") || "";
  const to = url.searchParams.get("to") || "";

  let q = supa.from("mente_assessments")
    .select("tool, risk_band, score_total, created_at", { count: "exact", head: false })
    .eq("org_id", org_id);

  if (from) q = q.gte("created_at", from);
  if (to) q = q.lte("created_at", to);

  const { data, error } = await q.limit(10000);
  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message } }, { status:400 });

  const total = data.length;
  const high = data.filter((x) => x.risk_band === "high").length;
  const byTool = ["phq9","gad7","auditc"].map((t) => {
    const xs = data.filter((x) => x.tool === (t as any));
    const avg = xs.length ? Math.round(xs.reduce((s, x) => s + (x.score_total || 0), 0) / xs.length) : 0;
    return { tool: t, count: xs.length, avg_total: avg };
  });

  return NextResponse.json({ ok:true, data: { total, high, byTool } });
}

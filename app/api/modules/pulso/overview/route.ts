// MODE: session (user-scoped, cookies)
// GET /api/modules/pulso/overview?org_id&patient_id?&from&to
// Si patient_id se omite: agrega a nivel org (últimos 30 días, limitado).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type M = { patient_id: string; type: string; value: number; measured_at: string|null; created_at: string };
type T = { patient_id: string; type: string; target_low: number|null; target_high: number|null };

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const patient_id = url.searchParams.get("patient_id");
  if (!org_id) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id requerido" }}, { status:400 });

  const from = url.searchParams.get("from") || new Date(Date.now() - 30*864e5).toISOString();
  const to = url.searchParams.get("to") || new Date().toISOString();

  let q = supa.from("pulso_measurements")
    .select("patient_id, type, value, measured_at, created_at")
    .eq("org_id", org_id)
    .gte("measured_at", from)
    .lte("measured_at", to)
    .order("measured_at", { ascending: false })
    .order("created_at", { ascending: false });

  if (patient_id) q = q.eq("patient_id", patient_id);

  const { data: meas, error: e1 } = await q.limit(patient_id ? 2000 : 2000);
  if (e1) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:e1.message }}, { status:400 });

  // Targets
  let tq = supa.from("pulso_targets")
    .select("patient_id, type, target_low, target_high")
    .eq("org_id", org_id);
  if (patient_id) tq = tq.eq("patient_id", patient_id);
  const { data: targets, error: e2 } = await tq.limit(5000);
  if (e2) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:e2.message }}, { status:400 });

  const tmap = new Map<string, { low: number|null; high: number|null }>();
  (targets||[]).forEach((t: T) => tmap.set(`${t.patient_id}:${t.type}`, { low: t.target_low, high: t.target_high }));

  const perType = new Map<string, { total: number; in_range: number; latest?: { value: number; at: string|null } }>();
  (meas||[]).forEach((m: M) => {
    const key = m.type;
    if (!perType.has(key)) perType.set(key, { total: 0, in_range: 0, latest: undefined });
    const cur = perType.get(key)!;
    cur.total += 1;

    const tgt = tmap.get(`${m.patient_id}:${m.type}`);
    const low = tgt?.low ?? undefined;
    const high = tgt?.high ?? undefined;
    let inRange = false;
    if (typeof low === "number" && m.value < low) inRange = false;
    else if (typeof high === "number" && m.value > high) inRange = false;
    else if (typeof low === "number" || typeof high === "number") inRange = true;
    cur.in_range += inRange ? 1 : 0;

    if (!cur.latest) cur.latest = { value: m.value, at: m.measured_at };
  });

  const data = Array.from(perType.entries()).map(([type, v]) => ({
    type, total: v.total, in_range: v.in_range,
    pct_in_range: v.total ? Math.round((v.in_range / v.total) * 100) : 0,
    latest: v.latest || null,
  }));

  return NextResponse.json({ ok:true, data, meta: { scope: patient_id ? "patient" : "org", from, to } });
}

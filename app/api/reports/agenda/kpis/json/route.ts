// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { type Booking } from "@/lib/reports/agenda";
import { computeRatesByResource, computeRatesByPatient } from "@/lib/reports/agenda_kpi";

async function fetchAll(origin: string, path: string, params: URLSearchParams) {
  const out: any[] = [];
  let page = 1, pageSize = 1000;
  while (page <= 20) {
    params.set("page", String(page)); params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}${path}?${params.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(()=>null);
    const arr: any[] = Array.isArray(j) ? j : (j?.data ?? []);
    if (!arr?.length) break;
    out.push(...arr);
    if (arr.length < pageSize) break;
    page += 1;
  }
  return out as Booking[];
}

export async function GET(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
  const resource = url.searchParams.get("resource") ?? "";
  const min_n = Math.max(1, parseInt(url.searchParams.get("min_n") ?? "10", 10));
  if (!org_id || !from || !to) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id, from y to son requeridos" }}, { status:400 });

  const qp = new URLSearchParams({ org_id, from, to });
  if (resource) qp.set("resource", resource);
  const bookings = await fetchAll(url.origin, "/api/cal/bookings", qp);

  const res = computeRatesByResource(org_id, from, to, tz, bookings, min_n);
  const pat = computeRatesByPatient(org_id, from, to, tz, bookings, Math.max(3, Math.floor(min_n/3)));

  return NextResponse.json({
    ok: true,
    data: {
      meta: { org_id, from, to, tz, count: bookings.length },
      rates_by_resource: res.rows,
      percentiles_resource: res.percentiles,
      rates_by_patient: pat.rows,
      percentiles_patient: pat.percentiles
    }
  });
}

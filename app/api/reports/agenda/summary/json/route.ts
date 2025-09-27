// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { computeAgendaSummary, type Booking } from "@/lib/reports/agenda";

async function fetchAllBookings(origin: string, org_id: string, params: URLSearchParams) {
  const out: Booking[] = [];
  let page = 1;
  const pageSize = 1000;
  while (page <= 20) { // límite de seguridad
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}/api/cal/bookings?${params.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(()=>null);
    const arr: Booking[] = Array.isArray(j) ? j : (j?.data ?? []);
    if (!arr || arr.length === 0) break;
    out.push(...arr);
    if (arr.length < pageSize) break;
    page += 1;
  }
  return out;
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const from = url.searchParams.get("from") ?? "";
    const to = url.searchParams.get("to") ?? "";
    const resource = url.searchParams.get("resource") ?? "";
    const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
    if (!org_id || !from || !to) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id, from y to son requeridos" }}, { status:400 });

    const qp = new URLSearchParams({ org_id, from, to });
    if (resource) qp.set("resource", resource);

    const bookings = await fetchAllBookings(url.origin, org_id, qp);
    const summary = computeAgendaSummary(org_id, from, to, tz, bookings);
    return NextResponse.json({ ok:true, data: summary });
  } catch (e: any) {
    return NextResponse.json({ ok:false, error:{ code:"SERVER_ERROR", message: e?.message ?? "Error" }}, { status:500 });
  }
}

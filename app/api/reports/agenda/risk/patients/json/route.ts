// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { type Booking } from "@/lib/reports/agenda";
import { computePatientRisk } from "@/lib/reports/agenda_risk";
import { cookies as nextCookies } from "next/headers";

async function fetchAllWithCookies(origin: string, path: string, params: URLSearchParams) {
  const out: any[] = [];
  let page = 1, pageSize = 1000;
  // Forward cookies (Next 15)
  const cookieStore = await nextCookies();
  const cookieHeader = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
  while (page <= 20) {
    params.set("page", String(page)); params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}${path}?${params.toString()}`, {
      cache: "no-store",
      headers: { cookie: cookieHeader }
    });
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
  const min_n = Math.max(1, parseInt(url.searchParams.get("min_n") ?? "3", 10));
  const top = Math.max(1, parseInt(url.searchParams.get("top") ?? "50", 10));
  if (!org_id || !from || !to) {
    return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id, from y to son requeridos" }}, { status:400 });
  }

  const qp = new URLSearchParams({ org_id, from, to });
  const bookings = await fetchAllWithCookies(url.origin, "/api/cal/bookings", qp);
  const rows = computePatientRisk(org_id, from, to, tz, bookings, min_n, top);
  const meta = { org_id, from, to, tz, count: rows.length, min_n, top };
  return NextResponse.json({ ok:true, data: rows, meta });
}

// MODE: session (user-scoped, cookies)
// GET /api/reports/agenda/risk/patients/predict/json?org_id&days?&tz?&min_n?&top?
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { type Booking } from "@/lib/reports/agenda";
import { weeklyRatesByPatient, deltaRecent } from "@/lib/reports/predictions";
import { cookies as nextCookies } from "next/headers";

async function fetchAllWithCookies(origin: string, path: string, params: URLSearchParams) {
  const out: any[] = [];
  let page = 1,
    pageSize = 1000;
  const cookieStore = await nextCookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  while (page <= 20) {
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}${path}?${params.toString()}`, {
      cache: "no-store",
      headers: { cookie: cookieHeader },
    });
    const j = await r.json().catch(() => null);
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
  if (!u?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
  const days = Math.min(180, Math.max(30, parseInt(url.searchParams.get("days") ?? "90", 10)));
  const min_n = Math.max(1, parseInt(url.searchParams.get("min_n") ?? "3", 10));
  const top = Math.max(1, parseInt(url.searchParams.get("top") ?? "50", 10));
  if (!org_id)
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 },
    );

  const to = new Date();
  const from = new Date(to);
  from.setDate(to.getDate() - (days - 1));
  const params = new URLSearchParams({
    org_id,
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  });

  const bookings = await fetchAllWithCookies(url.origin, "/api/cal/bookings", params);
  const byPat = weeklyRatesByPatient(bookings);

  type Row = {
    patient_key: string;
    patient_name: string;
    current_rate: number;
    trend_30d: number;
    predicted_score: number;
    predicted_band: "low" | "med" | "high";
  };
  const nameMap = new Map<string, string>();
  for (const b of bookings) {
    const k = (b.patient_id || b.patient || "NA").toString();
    if (!nameMap.has(k)) nameMap.set(k, (b.patient_name || b.patient || k).toString());
  }

  const out: Row[] = [];
  for (const [pid, series] of byPat) {
    // rate actual = promedio últimas 4 semanas (robusto al ruido)
    const n = series.length;
    const recent = series.slice(Math.max(0, n - 4));
    const avgRecent = recent.length ? recent.reduce((s, x) => s + x.rate, 0) / recent.length : 0;
    const d30 = deltaRecent(series, 4); // aprox 4 semanas
    const predicted = Math.max(0, Math.min(1, avgRecent + 0.5 * d30));
    const band: Row["predicted_band"] =
      predicted >= 0.5 ? "high" : predicted >= 0.25 ? "med" : "low";

    // aplicar min_n usando el recuento total en la ventana
    const total = bookings.filter(
      (b) => (b.patient_id || b.patient || "NA").toString() === pid,
    ).length;
    if (total < min_n) continue;

    out.push({
      patient_key: pid,
      patient_name: nameMap.get(pid) || pid,
      current_rate: Math.round(avgRecent * 1000) / 1000,
      trend_30d: Math.round(d30 * 1000) / 1000,
      predicted_score: Math.round(predicted * 1000) / 1000,
      predicted_band: band,
    });
  }

  const sorted = out.sort((a, b) => b.predicted_score - a.predicted_score);
  return NextResponse.json({
    ok: true,
    data: sorted.slice(0, top),
    meta: { org_id, days, tz, min_n, top },
  });
}

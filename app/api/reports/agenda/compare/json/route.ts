// MODE: session (user-scoped, cookies)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { type Booking } from "@/lib/reports/agenda";
import { computeAgendaSummary } from "@/lib/reports/agenda";

async function fetchAll(origin: string, path: string, params: URLSearchParams) {
  const out: any[] = [];
  let page = 1,
    pageSize = 1000;
  while (page <= 20) {
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}${path}?${params.toString()}`, { cache: "no-store" });
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
  const fromA = url.searchParams.get("fromA") ?? "";
  const toA = url.searchParams.get("toA") ?? "";
  const fromB = url.searchParams.get("fromB") ?? "";
  const toB = url.searchParams.get("toB") ?? "";
  const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
  const resource = url.searchParams.get("resource") ?? "";
  if (!org_id || !fromA || !toA || !fromB || !toB) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, fromA, toA, fromB, toB requeridos" },
      },
      { status: 400 },
    );
  }

  const qpA = new URLSearchParams({ org_id, from: fromA, to: toA });
  const qpB = new URLSearchParams({ org_id, from: fromB, to: toB });
  if (resource) {
    qpA.set("resource", resource);
    qpB.set("resource", resource);
  }

  const [a, b] = await Promise.all([
    fetchAll(url.origin, "/api/cal/bookings", qpA),
    fetchAll(url.origin, "/api/cal/bookings", qpB),
  ]);

  const sumA = computeAgendaSummary(org_id, fromA, toA, tz, a);
  const sumB = computeAgendaSummary(org_id, fromB, toB, tz, b);

  function delta(curr: number, prev: number) {
    if (prev === 0 && curr === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((curr - prev) / prev) * 1000) / 10;
  }

  const d = {
    total: delta(sumA.totals.total, sumB.totals.total),
    completed: delta(sumA.totals.completed, sumB.totals.completed),
    no_show: delta(sumA.totals.no_show, sumB.totals.no_show),
    cancelled: delta(sumA.totals.cancelled, sumB.totals.cancelled),
    other: delta(sumA.totals.other, sumB.totals.other),
    avg_duration_min: delta(sumA.totals.avg_duration_min, sumB.totals.avg_duration_min),
    avg_lead_time_h: delta(sumA.totals.avg_lead_time_h, sumB.totals.avg_lead_time_h),
  };

  return NextResponse.json({ ok: true, data: { A: sumA, B: sumB, delta_pct: d } });
}

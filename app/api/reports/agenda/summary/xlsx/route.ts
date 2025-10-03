// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { computeAgendaSummary, type Booking } from "@/lib/reports/agenda";
import * as XLSX from "xlsx";

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
  return out;
}

export async function GET(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return new Response(
      JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }),
      { status: 401 },
    );

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  const resource = url.searchParams.get("resource") ?? "";
  const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
  if (!org_id || !from || !to)
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, from y to son requeridos" },
      }),
      { status: 400 },
    );

  const qp = new URLSearchParams({ org_id, from, to });
  if (resource) qp.set("resource", resource);
  const bookings: Booking[] = await fetchAll(url.origin, "/api/cal/bookings", qp);
  const summary = computeAgendaSummary(org_id, from, to, tz, bookings);

  const wb = XLSX.utils.book_new();
  // Resumen
  const tot = summary.totals;
  const resumen = [
    {
      org_id: summary.org_id,
      from: summary.from,
      to: summary.to,
      tz: summary.tz,
      total: tot.total,
      completadas: tot.completed,
      no_show: tot.no_show,
      canceladas: tot.cancelled,
      otras: tot.other,
      dur_promedio_min: tot.avg_duration_min,
      lead_promedio_h: tot.avg_lead_time_h,
    },
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resumen), "Resumen");

  // Por día
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.by_day), "Por día");
  // Por recurso
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summary.by_resource), "Por recurso");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  const filename = `agenda_resumen_${org_id}_${from}_${to}.xlsx`;
  return new Response(new Blob([buf]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

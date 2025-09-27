// MODE: session (user-scoped, cookies)
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return new Response(JSON.stringify({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" } }), { status:401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id")!;
  const fromA = url.searchParams.get("fromA")!;
  const toA = url.searchParams.get("toA")!;
  const fromB = url.searchParams.get("fromB")!;
  const toB = url.searchParams.get("toB")!;
  const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
  const resource = url.searchParams.get("resource") ?? "";

  const params = new URLSearchParams({ org_id, fromA, toA, fromB, toB, tz });
  if (resource) params.set("resource", resource);
  const r = await fetch(`${url.origin}/api/reports/agenda/compare/json?${params.toString()}`, { cache: "no-store" });
  const j = await r.json().catch(()=>null);
  if (!j?.ok) return new Response(JSON.stringify({ ok:false, error:{ code:"UPSTREAM", message:"No se pudo calcular comparación" } }), { status:500 });

  const { A, B, delta_pct } = j.data;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
    org_id, tz,
    fromA, toA, totalA: A.totals.total, completedA: A.totals.completed, no_showA: A.totals.no_show, cancelA: A.totals.cancelled,
    durA_min: A.totals.avg_duration_min, leadA_h: A.totals.avg_lead_time_h,
    fromB, toB, totalB: B.totals.total, completedB: B.totals.completed, no_showB: B.totals.no_show, cancelB: B.totals.cancelled,
    durB_min: B.totals.avg_duration_min, leadB_h: B.totals.avg_lead_time_h
  }]), "Resumen");

  const byDay = A.by_day.map((x:any)=>({ periodo:"A", ...x })).concat(B.by_day.map((x:any)=>({ periodo:"B", ...x })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byDay), "Por día");

  const byRes = A.by_resource.map((x:any)=>({ periodo:"A", ...x })).concat(B.by_resource.map((x:any)=>({ periodo:"B", ...x })));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(byRes), "Por recurso");

  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
  const filename = `agenda_compare_${org_id}_${fromA}_${toA}_vs_${fromB}_${toB}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition":`attachment; filename="${filename}"`,
      "Cache-Control":"no-store"
    }
  });
}

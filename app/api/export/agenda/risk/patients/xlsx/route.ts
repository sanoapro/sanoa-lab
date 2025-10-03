// MODE: session (user-scoped, cookies)
// GET /api/export/agenda/risk/patients/xlsx?org_id&from&to&min_n?&top?&tz?
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

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
  const org_id = url.searchParams.get("org_id")!;
  const from = url.searchParams.get("from")!;
  const to = url.searchParams.get("to")!;
  const tz = url.searchParams.get("tz") ?? "America/Mexico_City";
  const min_n = url.searchParams.get("min_n") ?? "3";
  const top = url.searchParams.get("top") ?? "50";
  if (!org_id || !from || !to) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, from y to requeridos" },
      }),
      { status: 400 },
    );
  }

  const qp = new URLSearchParams({ org_id, from, to, tz, min_n, top });
  const r = await fetch(`${url.origin}/api/reports/agenda/risk/patients/json?${qp.toString()}`, {
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);
  const rows = Array.isArray(j) ? j : (j?.data ?? []);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "RiesgoPacientes");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  const filename = `risk_pacientes_${org_id}_${from}_${to}.xlsx`;
  return new Response(new Blob([buf]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

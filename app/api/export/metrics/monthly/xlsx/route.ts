// MODE: session (user-scoped, cookies)
// GET /api/export/metrics/monthly/xlsx?org_id&from=YYYY-MM-DD&to=YYYY-MM-DD
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
  const org_id = url.searchParams.get("org_id");
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";
  if (!org_id)
    return new Response(
      JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }),
      { status: 400 },
    );

  // Llama a tu endpoint JSON existente
  const origin = url.origin;
  const qp = new URLSearchParams({ org_id, ...(from ? { from } : {}), ...(to ? { to } : {}) });
  const r = await fetch(`${origin}/api/export/metrics/monthly?${qp.toString()}`, {
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);

  const rows = Array.isArray(j) ? j : (j?.data ?? []);
  // Construcción básica de hoja
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "metrics_monthly");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  const filename = `metrics_monthly_${org_id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

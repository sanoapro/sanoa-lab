// MODE: session (user-scoped, cookies)
// GET /api/export/cohortes/xlsx?org_id&from&to&cohort
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return new Response(
      JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }),
      { status: 401 },
    );

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id)
    return new Response(
      JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }),
      { status: 400 },
    );

  const params = new URLSearchParams();
  params.set("org_id", org_id);
  ["from", "to", "cohort"].forEach((k) => {
    const v = url.searchParams.get(k);
    if (v) params.set(k, v);
  });

  const origin = url.origin;
  const r = await fetch(`${origin}/api/reports/cohorts?${params.toString()}`, {
    cache: "no-store",
  });
  const j = await r.json().catch(() => null);

  const arr = Array.isArray(j) ? j : (j?.data ?? []);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(arr);
  XLSX.utils.book_append_sheet(wb, ws, "cohortes");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  const filename = `cohortes_${org_id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

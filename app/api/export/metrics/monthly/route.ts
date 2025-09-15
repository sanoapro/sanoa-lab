import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function csvEscape(v: any) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "patients"; // 'patients' | 'notes'
  const months = Number(searchParams.get("months") || "12");
  const org = searchParams.get("org");
  const onlyOrg = searchParams.get("onlyOrg") === "true";

  const fn = type === "notes" ? "metrics_notes_by_month" : "metrics_new_patients_by_month";
  const { data, error } = await supabase.rpc(fn, {
    p_org: onlyOrg ? (org || null) : null,
    months: Number.isFinite(months) ? months : 12,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []) as { month_start: string; total: number }[];
  const csv = ["month_start,total", ...rows.map(r => [r.month_start, r.total].map(csvEscape).join(","))].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="metrics_${type}_by_month.csv"`,
      "cache-control": "no-store",
    },
  });
}
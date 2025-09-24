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
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to = searchParams.get("to"); // YYYY-MM-DD
  const org = searchParams.get("org"); // org_id opcional
  const onlyOrg = searchParams.get("onlyOrg") === "true";

  const p_from = from ? new Date(from + "T00:00:00Z").toISOString() : null;
  const p_to = to ? new Date(to + "T23:59:59Z").toISOString() : null;

  const { data, error } = await supabase.rpc("metrics_patients_by_tag", {
    p_org: onlyOrg ? org || null : null,
    p_from,
    p_to,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data ?? []) as { tag_id: string; tag_name: string; total: number }[];
  const csv = [
    "tag_id,tag_name,total",
    ...rows.map((r) => [r.tag_id, r.tag_name, r.total].map(csvEscape).join(",")),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="metrics_by_tag.csv"`,
      "cache-control": "no-store",
    },
  });
}

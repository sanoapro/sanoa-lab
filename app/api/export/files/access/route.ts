import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

function esc(v: any) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const patient = searchParams.get("patient");
  const action = searchParams.get("action"); // opcional: 'view'|'download'|'upload'|'delete'
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let q = supabase
    .from("patient_file_access_log")
    .select("*")
    .order("created_at", { ascending: false });

  if (patient) q = q.eq("patient_id", patient);
  if (action) q = q.eq("action", action);
  if (from) q = q.gte("created_at", new Date(from + "T00:00:00Z").toISOString());
  if (to) q = q.lte("created_at", new Date(to + "T23:59:59Z").toISOString());

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const rows = (data || []) as any[];
  const csv = [
    "created_at,action,path,patient_id,by_user,ip,user_agent",
    ...rows.map((r) =>
      [r.created_at, r.action, r.path, r.patient_id, r.by_user, r.ip, r.user_agent]
        .map(esc)
        .join(","),
    ),
  ].join("\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="file_access_log.csv"`,
      "cache-control": "no-store",
    },
  });
}

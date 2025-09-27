// MODE: session (user-scoped, cookies)
// Ruta: /api/reminders/logs
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function splitMulti(q: URLSearchParams, key: string): string[] | null {
  const vals = q.getAll(key).flatMap(v => v.split(",").map(s => s.trim()).filter(Boolean));
  return vals.length ? Array.from(new Set(vals)) : null;
}
function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    if (!org_id) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });

    const q = url.searchParams.get("q");
    const status = splitMulti(url.searchParams, "status");       // scheduled,sent,failed,retry
    const channel = splitMulti(url.searchParams, "channel");     // sms,whatsapp
    const dateField = (url.searchParams.get("dateField") ?? "created").toLowerCase(); // 'created'|'lastAttempt'
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const page = toInt(url.searchParams.get("page"), 1);
    const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 50), 200);
    const offset = (page - 1) * pageSize;

    const { data, error } = await supa.rpc("reminders_logs_search", {
      p_org_id: org_id,
      p_q: q,
      p_status: status,
      p_channel: channel,
      p_date_field: dateField,
      p_from: from,
      p_to: to,
      p_limit: pageSize,
      p_offset: offset
    });

    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    const total = data?.[0]?.total ?? 0;
    return NextResponse.json({
      ok: true,
      data: (data ?? []).map(({ total: _t, ...r }: any) => r),
      meta: { page, pageSize, total }
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

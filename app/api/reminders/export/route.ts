// MODE: session (user-scoped, cookies)
// Ruta: /api/reminders/export → CSV con filtros
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function splitMulti(q: URLSearchParams, key: string): string[] | null {
  const vals = q.getAll(key).flatMap((v: any) =>
    v
      .split(",")
      .map((s: any) => s.trim())
      .filter(Boolean),
  );
  return vals.length ? Array.from(new Set(vals)) : null;
}
function esc(s: any) {
  if (s === null || typeof s === "undefined") return "";
  const v = String(s);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

    const q = url.searchParams.get("q");
    const status = splitMulti(url.searchParams, "status");
    const channel = splitMulti(url.searchParams, "channel");
    const dateField = (url.searchParams.get("dateField") ?? "created").toLowerCase();
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const MAX = 10000;

    const { data, error } = await supa.rpc("reminders_logs_search", {
      p_org_id: org_id,
      p_q: q,
      p_status: status,
      p_channel: channel,
      p_date_field: dateField,
      p_from: from,
      p_to: to,
      p_limit: MAX,
      p_offset: 0,
    });

    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    const rows = (data ?? []).map(({ total: _t, ...r }: any) => r);
    if (rows.length > MAX) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "TOO_MANY_ROWS",
            message: `Demasiados registros (${rows.length}). Refina filtros. Límite: ${MAX}.`,
          },
        },
        { status: 400 },
      );
    }

    const header = [
      "id",
      "patient_id",
      "channel",
      "status",
      "target",
      "template",
      "created_at",
      "last_attempt_at",
      "attempts",
    ];
    const csv = [
      header.join(","),
      ...rows.map((r: any) =>
        [
          esc(r.id),
          esc(r.patient_id ?? ""),
          esc(r.channel ?? ""),
          esc(r.status ?? ""),
          esc(r.target ?? ""),
          esc(r.template ?? ""),
          esc(r.created_at ?? ""),
          esc(r.last_attempt_at ?? ""),
          esc(r.attempts ?? 0),
        ].join(","),
      ),
    ].join("\n");

    const filename = `reminders_${org_id}_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(new Blob([csv]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

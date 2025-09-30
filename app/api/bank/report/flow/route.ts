// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/report/flow?org_id&from&to&group=month|week
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type Group = "month" | "week";

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const group = (url.searchParams.get("group") as Group) || "month";

    if (!org_id || !from || !to) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "org_id, from y to son requeridos." } },
        { status: 400 },
      );
    }
    if (!["month", "week"].includes(group)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "group debe ser 'month' o 'week'." } },
        { status: 400 },
      );
    }

    const { data, error } = await supa.rpc("bank_flow", {
      p_org_id: org_id,
      p_from: from,
      p_to: to,
      p_group: group,
    });

    if (error) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );
    }

    // La RPC devuelve 'period' como date/text; mapeamos a 'month' (UI existente)
    const rows = (data ?? []).map((r: any) => ({
      month: r.period, // puede ser 'YYYY-MM-01' o 'YYYY-Www'
      income_cents: Number(r.income_cents || 0),
      expense_cents: Number(r.expense_cents || 0),
      net_cents: Number(r.net_cents || 0),
    }));

    return NextResponse.json({ ok: true, data: rows });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

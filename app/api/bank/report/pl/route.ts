// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/report/pl
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // MODE: session (user-scoped, cookies)
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    if (!org_id || !from || !to) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "org_id, from y to requeridos." } }, { status: 400 });
    }

    const { data, error } = await supa.rpc("bank_pl", { p_org_id: org_id, p_from: from, p_to: to });
    if (error) {
      return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

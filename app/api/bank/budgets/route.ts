// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/budgets
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // MODE: session (user-scoped, cookies)
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const month = url.searchParams.get("month"); // YYYY-MM-01 (opcional)

    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

    let query = supa.from("bank_budgets").select("*").eq("org_id", org_id);
    if (month) query = query.eq("month", month);

    const { data, error } = await query.order("month", { ascending: true });
    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  // MODE: session (user-scoped, cookies)
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );

    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const items: { category_id: string; month: string; amount_cents: number }[] | undefined =
      body?.items;

    if (!org_id || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "org_id e items requeridos." } },
        { status: 400 },
      );
    }

    const payload = items.map((i) => ({
      org_id,
      category_id: i.category_id,
      month: i.month,
      amount_cents: i.amount_cents,
    }));

    const { data, error } = await supa
      .from("bank_budgets")
      .upsert(payload, { onConflict: "org_id,category_id,month" })
      .select("*");
    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

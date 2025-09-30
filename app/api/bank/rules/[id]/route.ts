// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/rules/[id]  (DELETE)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

    const id = params.id;
    if (!id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta id" } },
        { status: 400 },
      );

    const { data, error } = await supa
      .from("bank_rules")
      .delete()
      .eq("org_id", org_id)
      .eq("id", id)
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

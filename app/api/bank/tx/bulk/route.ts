// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/tx/bulk
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type DB = Database;
type Tx = DB["public"]["Tables"]["bank_tx"]["Row"];

export async function PATCH(req: NextRequest) {
  // MODE: session (user-scoped, cookies)
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const ids: string[] | undefined = body?.ids;
    const set: Partial<Tx> | undefined = body?.set;

    if (!org_id || !Array.isArray(ids) || ids.length === 0 || !set) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "org_id, ids y set requeridos." } },
        { status: 400 },
      );
    }

    const allowed: Partial<Tx> = {};
    if (set.status && ["pending", "cleared"].includes(set.status))
      allowed.status = set.status as Tx["status"];
    if (typeof set.category_id !== "undefined") allowed.category_id = set.category_id ?? null;
    if (Array.isArray(set.tags)) allowed.tags = set.tags as string[];

    if (Object.keys(allowed).length === 0) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Nada que actualizar." } },
        { status: 400 },
      );
    }

    const { data, error } = await supa
      .from("bank_tx")
      .update(allowed)
      .eq("org_id", org_id)
      .in("id", ids)
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

// MODE: session (user-scoped, cookies)
// Ruta: /api/bank/rules
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import type { Database } from "@/lib/database.types";

type DB = Database;
type Rule = DB["public"]["Tables"]["bank_rules"]["Row"];

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
    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

    const { data, error } = await supa
      .from("bank_rules")
      .select("*")
      .eq("org_id", org_id)
      .order("priority", { ascending: true });
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
    const rule: Partial<Rule> | undefined = body?.rule;

    if (!org_id || !rule || !rule.if_text_like) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "BAD_REQUEST", message: "org_id y rule.if_text_like requeridos." },
        },
        { status: 400 },
      );
    }

    const payload: Partial<Rule> = {
      id: rule.id, // si viene, upsert por PK
      org_id,
      if_text_like: rule.if_text_like!,
      set_category_id: rule.set_category_id ?? null,
      set_tags: rule.set_tags ?? null,
      priority: typeof rule.priority === "number" ? rule.priority : 100,
    };

    const { data, error } = await supa
      .from("bank_rules")
      .upsert(payload, { onConflict: "id" })
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

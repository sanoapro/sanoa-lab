// MODE: session (user-scoped, cookies)
// POST /api/modules/sonrisa/treatments/upsert
// Body: { org_id, items: [{ id?, code, name, default_price_cents, active? }] }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    items?: Array<{ id?: string; code?: string; name?: string; default_price_cents?: number; active?: boolean }>;
  };
  if (!body?.org_id || !Array.isArray(body.items) || !body.items.length) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id e items requeridos" } },
      { status: 400 },
    );
  }

  const rows = body.items.map((x) => ({
    id: x.id ?? undefined,
    org_id: body.org_id!,
    code: String(x.code || "").slice(0, 64),
    name: String(x.name || "").slice(0, 200),
    default_price_cents: Number(x.default_price_cents || 0),
    active: x.active ?? true,
    created_by: u.user!.id,
  }));

  const { data, error } = await supa
    .from("sonrisa_treatments")
    .upsert(rows, { onConflict: "org_id,code" })
    .select("id, org_id, code, name, default_price_cents, active");

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, data });
}

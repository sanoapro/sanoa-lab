// MODE: session (user-scoped, cookies)
// GET /api/modules/sonrisa/treatments/list?org_id&q?&active?
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 },
    );
  }

  let q = supa
    .from("sonrisa_treatments")
    .select("id, org_id, code, name, default_price_cents, active")
    .eq("org_id", org_id)
    .order("name", { ascending: true });

  const active = url.searchParams.get("active");
  if (active === "true") q = q.eq("active", true);
  const search = url.searchParams.get("q");
  if (search) q = q.ilike("name", `%${search}%`);

  const { data, error } = await q.limit(500);
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data });
}

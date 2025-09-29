// MODE: session (user-scoped, cookies)
// GET /api/modules/sonrisa/quotes/list?org_id&patient_id?&status?
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
    .from("sonrisa_quotes")
    .select("id, org_id, patient_id, status, currency, total_cents, notes, signed_at, created_at")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  const pid = url.searchParams.get("patient_id");
  if (pid) q = q.eq("patient_id", pid);

  const status = url.searchParams.get("status");
  if (status) q = q.eq("status", status);

  const { data, error } = await q.limit(200);
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, data });
}

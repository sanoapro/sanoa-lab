import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const u = new URL(req.url);
  const orgId = u.searchParams.get("org_id");
  const providerId = u.searchParams.get("provider_id");
  const from = u.searchParams.get("from");
  const to = u.searchParams.get("to");
  if (!orgId || !providerId || !from || !to) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "org_id, provider_id, from y to requeridos",
        },
      },
      { status: 400 },
    );
  }

  const { data, error } = await supa
    .from("agenda_appointments")
    .select("id, patient_id, starts_at, ends_at, tz, location, status, notes")
    .eq("org_id", orgId)
    .eq("provider_id", providerId)
    .gte("starts_at", from)
    .lte("starts_at", to)
    .order("starts_at", { ascending: true })
    .limit(1000);

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, data: data || [] });
}

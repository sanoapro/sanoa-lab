import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const u = new URL(req.url);
  const orgId = u.searchParams.get("org_id");
  const providerId = u.searchParams.get("provider_id");
  const weekStart =
    u.searchParams.get("week_start") || new Date().toISOString().slice(0, 10);
  if (!orgId || !providerId) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "BAD_REQUEST",
          message: "org_id y provider_id requeridos",
        },
      },
      { status: 400 }
    );
  }

  const { data: av, error: e1 } = await supa
    .from("agenda_availability")
    .select("weekday, start_time, end_time, slot_minutes, tz")
    .eq("org_id", orgId)
    .eq("provider_id", providerId)
    .order("weekday", { ascending: true });

  if (e1) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1.message } },
      { status: 400 }
    );
  }

  const start = new Date(weekStart);
  if (Number.isNaN(start.getTime())) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "week_start inválido" } },
      { status: 400 }
    );
  }
  const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
  const { data: ov, error: e2 } = await supa
    .from("agenda_slots_overrides")
    .select("date, kind, start_time, end_time")
    .eq("org_id", orgId)
    .eq("provider_id", providerId)
    .gte("date", weekStart)
    .lte("date", end.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  if (e2) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e2.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { availability: av || [], overrides: ov || [] },
  });
}

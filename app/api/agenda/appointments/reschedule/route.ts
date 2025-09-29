import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function addMinutesIso(iso: string, min: number) {
  const d = new Date(iso);
  return new Date(d.getTime() + min * 60_000).toISOString();
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    id?: string;
    starts_at?: string;
    duration_min?: number;
  };
  if (!body?.org_id || !body?.id || !body?.starts_at) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, id y starts_at requeridos" },
      },
      { status: 400 }
    );
  }

  const { data: oldAppt, error: e0 } = await supa
    .from("agenda_appointments")
    .select("id, provider_id, tz, ends_at, starts_at")
    .eq("org_id", body.org_id)
    .eq("id", body.id)
    .single();

  if (e0 || !oldAppt) {
    return NextResponse.json(
      { ok: false, error: { code: "NOT_FOUND", message: "Cita no encontrada" } },
      { status: 404 }
    );
  }

  const newStart = new Date(body.starts_at);
  if (Number.isNaN(newStart.getTime())) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "starts_at inválido" } },
      { status: 400 }
    );
  }

  const durationMin = Math.max(
    10,
    Math.min(
      240,
      body.duration_min ??
        Math.round(
          (new Date(oldAppt.ends_at).getTime() -
            new Date(oldAppt.starts_at).getTime()) /
            60000
        )
    )
  );
  const newEnd = addMinutesIso(newStart.toISOString(), durationMin);

  const { data: coll } = await supa
    .from("agenda_appointments")
    .select("id")
    .eq("org_id", body.org_id)
    .eq("provider_id", oldAppt.provider_id)
    .neq("id", body.id)
    .or(`and(starts_at.lte.${newEnd},ends_at.gte.${newStart.toISOString()})`)
    .limit(1);

  if (coll && coll.length > 0) {
    return NextResponse.json(
      { ok: false, error: { code: "TIME_CONFLICT", message: "Conflicto con otra cita" } },
      { status: 409 }
    );
  }

  const { error: e1 } = await supa
    .from("agenda_appointments")
    .update({ starts_at: newStart.toISOString(), ends_at: newEnd })
    .eq("org_id", body.org_id)
    .eq("id", body.id);

  if (e1) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({
    ok: true,
    data: { id: body.id, starts_at: newStart.toISOString(), ends_at: newEnd },
  });
}

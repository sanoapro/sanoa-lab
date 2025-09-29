// MODE: session (user-scoped, cookies)
// POST /api/agenda/appointments/create
// { org_id, provider_id, patient_id, starts_at, duration_min, tz, location?, notes?, schedule_reminders?: boolean }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function addMinutesISO(iso: string, min: number) {
  const d = new Date(iso);
  return new Date(d.getTime() + min * 60_000).toISOString();
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    provider_id?: string;
    patient_id?: string;
    starts_at?: string;
    duration_min?: number;
    tz?: string;
    location?: string | null;
    notes?: string | null;
    schedule_reminders?: boolean;
  };

  if (!body?.org_id || !body?.provider_id || !body?.patient_id || !body?.starts_at || !body?.duration_min || !body?.tz) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Campos requeridos faltantes" } }, { status: 400 });
  }

  const startsISO = new Date(body.starts_at);
  if (isNaN(startsISO.getTime())) {
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "starts_at inválido" } }, { status: 400 });
  }
  const endsISO = addMinutesISO(startsISO.toISOString(), Math.max(10, Math.min(240, body.duration_min)));

  // Colisión básica
  const { data: coll } = await supa
    .from("agenda_appointments")
    .select("id")
    .eq("org_id", body.org_id)
    .eq("provider_id", body.provider_id)
    .or(`and(starts_at.lte.${endsISO},ends_at.gte.${startsISO.toISOString()})`)
    .limit(1);
  if (coll && coll.length > 0) {
    return NextResponse.json({ ok: false, error: { code: "TIME_CONFLICT", message: "Conflicto con otra cita" } }, { status: 409 });
  }

  const { data: appt, error: e1 } = await supa
    .from("agenda_appointments")
    .insert({
      org_id: body.org_id,
      provider_id: body.provider_id,
      patient_id: body.patient_id,
      starts_at: startsISO.toISOString(),
      ends_at: endsISO,
      tz: body.tz,
      location: body.location ?? null,
      notes: body.notes ?? null,
      status: "scheduled",
      created_by: au.user.id,
    })
    .select("id, starts_at, ends_at, tz")
    .single();

  if (e1) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: e1.message } }, { status: 400 });

  if (body.schedule_reminders) {
    // Llama al orquestador (no falla la creación si esto falla)
    try {
      await fetch(`${new URL(req.url).origin}/api/agenda/reminders/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({
          org_id: body.org_id,
          appointment_id: appt!.id,
          patient_id: body.patient_id,
          starts_at: appt!.starts_at,
          tz: body.tz,
        }),
      });
    } catch {}
  }

  return NextResponse.json({ ok: true, data: appt });
}

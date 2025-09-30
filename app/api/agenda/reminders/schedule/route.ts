// MODE: session (user-scoped, cookies)
// POST /api/agenda/reminders/schedule
// { org_id, appointment_id, patient_id, starts_at, tz }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function minusMinutesISO(iso: string, min: number) {
  const d = new Date(iso);
  return new Date(d.getTime() - min * 60_000).toISOString();
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    appointment_id?: string;
    patient_id?: string;
    starts_at?: string;
    tz?: string;
  };
  if (
    !body?.org_id ||
    !body?.appointment_id ||
    !body?.patient_id ||
    !body?.starts_at ||
    !body?.tz
  ) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "Campos requeridos faltantes" } },
      { status: 400 },
    );
  }

  // Aquí asumimos que /api/reminders/schedule existe y acepta window_start/end y channel.
  // Programamos 3 recordatorios: 48h (WA), 24h (WA->SMS fallback), 2h (SMS).
  const plan = [
    { channel: "whatsapp", send_at: minusMinutesISO(body.starts_at, 48 * 60), window_min: 60 },
    { channel: "whatsapp", send_at: minusMinutesISO(body.starts_at, 24 * 60), window_min: 60 },
    { channel: "sms", send_at: minusMinutesISO(body.starts_at, 120), window_min: 30 },
  ];

  let scheduled = 0;
  for (const p of plan) {
    try {
      await fetch(`${new URL(req.url).origin}/api/reminders/schedule`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: req.headers.get("cookie") || "" },
        body: JSON.stringify({
          org_id: body.org_id,
          patient_id: body.patient_id,
          appointment_id: body.appointment_id,
          channel: p.channel,
          tz: body.tz,
          window_start: minusMinutesISO(p.send_at, 10),
          window_end: p.send_at,
          template_key: "appointment_reminder",
          variables: { starts_at: body.starts_at },
        }),
      });
      scheduled++;
    } catch {}
  }

  return NextResponse.json({ ok: true, data: { scheduled } });
}

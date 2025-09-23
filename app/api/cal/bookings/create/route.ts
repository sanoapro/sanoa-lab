import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type Body = {
  org_id: string;
  patient_id: string;
  title?: string;
  notes?: string;
  start: string;        // ISO
  end?: string;         // ISO
  duration_min?: number;
  location?: string;
  attendee_email?: string | null;
  event_type?: string | null; // p.ej. "consulta"
};

async function tryCreateInCal(input: Body) {
  const token = process.env.CAL_API_KEY;
  if (!token) return null;

  // Ajusta base si usas otro host/versión de API
  const base = process.env.CAL_API_BASE || "https://api.cal.com/v1";
  const payload: any = {
    title: input.title || "Consulta",
    start: input.start,
    end: input.end,
    // Los nombres exactos de campos pueden variar entre versiones;
    // dejamos valores típicos y toleramos respuesta flexible.
    attendees: input.attendee_email ? [{ email: input.attendee_email }] : [],
    description: input.notes || "",
    // eventTypeSlug / eventTypeId si aplica en tu cuenta:
    eventTypeSlug: input.event_type || undefined,
  };

  try {
    const r = await fetch(`${base}/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    // Normalizamos campos típicos
    const uid =
      j?.uid || j?.id || j?.data?.uid || j?.data?.id || j?.booking?.uid;
    const meetingUrl =
      j?.meetingUrl ||
      j?.data?.meetingUrl ||
      j?.booking?.meetingUrl ||
      j?.videoCallUrl;
    return { uid, meetingUrl, raw: j };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  const b = (await req.json().catch(() => ({}))) as Body;

  if (!b.org_id || !b.patient_id || !b.start) {
    return NextResponse.json(
      { error: "org_id, patient_id y start son requeridos" },
      { status: 400 },
    );
  }

  // Duración -> end si no viene
  let start = new Date(b.start);
  if (isNaN(start.getTime()))
    return NextResponse.json({ error: "start inválido" }, { status: 400 });

  let end = b.end ? new Date(b.end) : null;
  if (!end) {
    const mins = Math.max(5, Number(b.duration_min ?? 50));
    end = new Date(start.getTime() + mins * 60_000);
  }
  const startISO = start.toISOString();
  const endISO = end!.toISOString();

  // 1) Intento Cal.com (si hay token)
  const cal = await tryCreateInCal({
    ...b,
    start: startISO,
    end: endISO,
  });

  // 2) Siempre creamos/guardamos localmente
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      org_id: b.org_id,
      patient_id: b.patient_id,
      provider_id: null,
      cal_event_id: cal?.uid || null,
      start_at: startISO,
      end_at: endISO,
      // puedes añadir título/notas en otra tabla si lo necesitas
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Trigger P12 generará work_items; devolvemos info útil al cliente
  return NextResponse.json({
    ok: true,
    mode: cal ? "cal" : "local",
    appointment: data,
    cal: cal ? { uid: cal.uid, meetingUrl: cal.meetingUrl } : null,
  });
}

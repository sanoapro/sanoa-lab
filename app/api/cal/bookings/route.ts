import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/* ============================= *
 * GET: listar bookings de Cal   *
 * ============================= */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.CALCOM_API_KEY;
    const apiVersion = process.env.CALCOM_API_VERSION || "2024-08-13";
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta CALCOM_API_KEY en .env.local" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "upcoming";
    const afterStart = searchParams.get("afterStart") || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const beforeEnd = searchParams.get("beforeEnd") || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();
    const q = searchParams.get("q") || "";
    const take = searchParams.get("take") || "50";

    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (afterStart) qs.set("afterStart", afterStart);
    if (beforeEnd) qs.set("beforeEnd", beforeEnd);
    if (take) qs.set("take", take);
    if (q) {
      if (q.includes("@")) qs.set("attendeeEmail", q);
      else qs.set("attendeeName", q);
    }

    const url = `https://api.cal.com/v2/bookings?${qs.toString()}`;
    const resp = await fetch(url, {
      headers: { Authorization: `Bearer ${apiKey}`, "cal-api-version": apiVersion },
      cache: "no-store",
    });

    const json = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = typeof json?.error === "string" ? json.error : `Error Cal.com (HTTP ${resp.status})`;
      return NextResponse.json({ error: msg }, { status: resp.status });
    }

    const raw = Array.isArray(json?.data) ? json.data : [];
    const items = raw.map((b: any) => ({
      uid: b.uid,
      title: b.title || b.eventType?.slug || "Cita",
      status: b.status,
      start: b.start,
      end: b.end,
      meetingUrl: b.meetingUrl || b.location || null,
      eventTypeId: b.eventTypeId,
      eventTypeSlug: b.eventType?.slug || null,
      hosts: (b.hosts || []).map((h: any) => ({ name: h.name, email: h.email, username: h.username })),
      attendees: (b.attendees || []).map((a: any) => ({ name: a.name, email: a.email })),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({ items }, { status: 200 });
  } catch (e: any) {
    const msg = e?.message || "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ============================= *
 * POST: crear booking + local   *
 * ============================= */
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

async function tryCreateInCal(input: Required<Pick<Body,"start">> & Partial<Body>) {
  const token = process.env.CALCOM_API_KEY;
  if (!token) return null;

  // intentamos primero v2 y caemos a v1 si falla
  const payload: any = {
    title: input.title || "Consulta",
    start: input.start,
    end: input.end,
    attendees: input.attendee_email ? [{ email: input.attendee_email }] : [],
    description: input.notes || "",
    eventTypeSlug: input.event_type || undefined,
  };

  // v2
  try {
    const r = await fetch("https://api.cal.com/v2/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        "cal-api-version": process.env.CALCOM_API_VERSION || "2024-08-13",
      },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof j?.error === "string" ? j.error : await r.text());
    const item = j?.data?.[0] || j?.data || j;
    const uid = item?.uid || item?.id;
    const meetingUrl = item?.meetingUrl || item?.videoCallUrl || item?.location || null;
    if (uid) return { uid, meetingUrl, raw: j };
  } catch {}

  // v1 (fallback)
  try {
    const r = await fetch("https://api.cal.com/v1/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(typeof j?.error === "string" ? j.error : await r.text());
    const uid = j?.uid || j?.id || j?.data?.uid || j?.data?.id || j?.booking?.uid;
    const meetingUrl =
      j?.meetingUrl || j?.data?.meetingUrl || j?.booking?.meetingUrl || j?.videoCallUrl || null;
    if (uid) return { uid, meetingUrl, raw: j };
  } catch {}

  return null;
}

export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  try {
    const b = (await req.json().catch(() => ({}))) as Body;

    if (!b.org_id || !b.patient_id || !b.start) {
      return NextResponse.json(
        { error: "org_id, patient_id y start son requeridos" },
        { status: 400 },
      );
    }

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

    const cal = await tryCreateInCal({ ...b, start: startISO, end: endISO });

    const { data, error } = await supabase
      .from("appointments")
      .insert({
        org_id: b.org_id,
        patient_id: b.patient_id,
        provider_id: null,
        cal_event_id: cal?.uid || null,
        start_at: startISO,
        end_at: endISO,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      mode: cal ? "cal" : "local",
      appointment: data,
      cal: cal ? { uid: cal.uid, meetingUrl: cal.meetingUrl } : null,
    });
  } catch (e: any) {
    const msg = e?.message || "Error inesperado";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError } from "@/lib/http/validate";
import { rawBody, verifyCalSignature } from "@/lib/http/signatures";

/* =====================
   GET: listar bookings (Cal v2)
   ===================== */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.CALCOM_API_KEY;
    const apiVersion = process.env.CALCOM_API_VERSION || "2024-08-13";
    if (!apiKey) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "upcoming";
    const afterStart =
      searchParams.get("afterStart") || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const beforeEnd =
      searchParams.get("beforeEnd") || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();
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
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": apiVersion,
      },
      cache: "no-store",
    });

    const json = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: json?.error || "Error Cal.com" }, { status: resp.status });
    }

    const data = (json?.data || []).map((b: any) => ({
      uid: b.uid,
      title: b.title || b.eventType?.slug || "Cita",
      status: b.status,
      start: b.start,
      end: b.end,
      meetingUrl: b.meetingUrl || b.location || null,
      eventTypeId: b.eventTypeId,
      eventTypeSlug: b.eventType?.slug || null,
      hosts: (b.hosts || []).map((h: any) => ({
        name: h.name,
        email: h.email,
        username: h.username,
      })),
      attendees: (b.attendees || []).map((a: any) => ({ name: a.name, email: a.email })),
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
    }));

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error inesperado" }, { status: 500 });
  }
}

/* =====================
   POST: crear booking (Cal v1 si hay API key) + siempre guarda local en Supabase
   ===================== */
type Body = {
  org_id: string;
  patient_id: string;
  title?: string;
  notes?: string;
  start: string; // ISO
  end?: string; // ISO
  duration_min?: number;
  location?: string;
  attendee_email?: string | null;
  event_type?: string | null; // p.ej. "consulta"
};

/** Crea en Cal.com (v1) si hay token; si falla, devolvemos null y seguimos con local */
async function tryCreateInCal(input: Required<Pick<Body, "start">> & Body) {
  const token = process.env.CALCOM_API_KEY;
  if (!token) return null;

  const base = process.env.CAL_API_BASE || "https://api.cal.com/v1";
  const payload: any = {
    title: input.title || "Consulta",
    start: input.start,
    end: input.end,
    attendees: input.attendee_email ? [{ email: input.attendee_email }] : [],
    description: input.notes || "",
    eventTypeSlug: input.event_type || undefined,
  };

  try {
    const r = await fetch(`${base}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    });
    if (!r.ok) throw new Error(await r.text());
    const j = await r.json();
    const uid = j?.uid || j?.id || j?.data?.uid || j?.data?.id || j?.booking?.uid;
    const meetingUrl =
      j?.meetingUrl || j?.data?.meetingUrl || j?.booking?.meetingUrl || j?.videoCallUrl;
    return { uid, meetingUrl, raw: j };
  } catch {
    return null;
  }
}

function hasCalSignature(req: NextRequest) {
  return (
    req.headers.has("cal-signature-256") ||
    req.headers.has("Cal-Signature-256") ||
    req.headers.has("cal-signature") ||
    req.headers.has("Cal-Signature")
  );
}

export async function POST(req: NextRequest) {
  const bodyRaw = await rawBody(req);

  if (hasCalSignature(req)) {
    if (!verifyCalSignature(req, bodyRaw)) {
      return jsonError("UNAUTHORIZED", "Firma Cal.com inválida", 401);
    }

    const svc = createServiceClient();
    try {
      const payload = JSON.parse(bodyRaw);
      const eventId = payload?.payload?.uid || payload?.uid || payload?.id || null;
      const org_id = payload?.payload?.metadata?.org_id || null;

      const { error } = await svc
        .from("cal_webhooks")
        .upsert(
          { id: eventId, org_id, raw: payload },
          { onConflict: "id", ignoreDuplicates: false },
        );

      if (error && error.code !== "42P01") {
        return jsonError("DB_ERROR", error.message, 400);
      }

      return jsonOk({ accepted: true, id: eventId });
    } catch {
      return jsonOk({ accepted: true, parse: "skipped" });
    }
  }

  const supabase = createRouteHandlerClient({ cookies });
  const parsed = (() => {
    try {
      return bodyRaw ? (JSON.parse(bodyRaw) as Partial<Body>) : ({} as Partial<Body>);
    } catch {
      return {} as Partial<Body>;
    }
  })();
  const b = parsed as Body;

  if (!b.org_id || !b.patient_id || !b.start) {
    return NextResponse.json(
      { error: "org_id, patient_id y start son requeridos" },
      { status: 400 },
    );
  }

  // Normaliza tiempos
  const start = new Date(b.start);
  if (isNaN(start.getTime()))
    return NextResponse.json({ error: "start inválido" }, { status: 400 });

  let end = b.end ? new Date(b.end) : null;
  if (!end) {
    const mins = Math.max(5, Number(b.duration_min ?? 50));
    end = new Date(start.getTime() + mins * 60_000);
  }
  const startISO = start.toISOString();
  const endISO = end!.toISOString();

  // 1) Intento crear en Cal (si hay API key)
  const cal = await tryCreateInCal({ ...b, start: startISO, end: endISO });

  // 2) Siempre persistimos en nuestra tabla local
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

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    mode: cal ? "cal" : "local",
    appointment: data,
    cal: cal ? { uid: cal.uid, meetingUrl: cal.meetingUrl } : null,
  });
}

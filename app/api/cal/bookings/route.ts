// app/api/cal/bookings/route.ts
// MODE: session (user-scoped, cookies) — Next 15 compatible

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/* =====================
   GET: listar bookings (Cal v2)
   ===================== */
export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.CALCOM_API_KEY;
    const apiVersion = process.env.CALCOM_API_VERSION || "2024-08-13";
    if (!apiKey) {
      // Mantengo shape original { data: [] } para no romper consumidores existentes
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
   — Con gating de acuerdos:
     • La primera cita paciente↔especialista se permite sin acuerdo.
     • A partir de la segunda, se requiere acuerdo specialist_patient ACCEPTED.
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

export async function POST(req: NextRequest) {
  // Supabase (session-aware)
  const supa = await getSupabaseServer();

  // Parse body
  const b = (await req.json().catch(() => ({}))) as Body;
  if (!b.org_id || !b.patient_id || !b.start) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, patient_id y start son requeridos" } },
      { status: 400 },
    );
  }

  // Auth user (especialista)
  const { data: auth, error: authError } = await supa.auth.getUser();
  if (authError) {
    return NextResponse.json(
      { ok: false, error: { code: "AUTH_ERROR", message: "No se pudo validar la sesión" } },
      { status: 500 },
    );
  }
  const specialist_id = auth?.user?.id || null;
  if (!specialist_id) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Sesión requerida" } },
      { status: 401 },
    );
  }

  // Miembro de la organización
  const { data: member, error: memberError } = await supa
    .from("org_members")
    .select("role")
    .eq("org_id", b.org_id)
    .eq("user_id", specialist_id)
    .maybeSingle();
  if (memberError) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "No se pudo verificar pertenencia a la organización" } },
      { status: 500 },
    );
  }
  if (!member) {
    return NextResponse.json(
      { ok: false, error: { code: "FORBIDDEN", message: "No perteneces a la organización" } },
      { status: 403 },
    );
  }

  // Normaliza tiempos
  const start = new Date(b.start);
  if (isNaN(start.getTime()))
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "start inválido" } }, { status: 400 });

  let end = b.end ? new Date(b.end) : null;
  if (!end) {
    const mins = Math.max(5, Number(b.duration_min ?? 50));
    end = new Date(start.getTime() + mins * 60_000);
  }
  const startISO = start.toISOString();
  const endISO = end!.toISOString();

  // ===== Gating de acuerdos E↔P (segunda cita en adelante requiere ACCEPTED) =====
  // ¿Ya hay al menos una cita previa entre este especialista y este paciente en esta org?
  const { count: prevCount, error: prevErr } = await supa
    .from("appointments")
    .select("*", { count: "exact", head: true })
    .eq("org_id", b.org_id)
    .eq("patient_id", b.patient_id)
    .eq("provider_id", specialist_id);

  if (prevErr) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: "No se pudo verificar historial de citas" } },
      { status: 500 },
    );
  }

  if ((prevCount || 0) > 0) {
    // Segunda+ cita: validar acuerdo specialist_patient
    // Preferimos usar la función SQL si está disponible; si no, caemos al query directo.
    let cleared = false;
    try {
      const { data: rpc, error: rpcError } = await supa.rpc("agreements_is_patient_cleared", {
        p_org: b.org_id,
        p_specialist: specialist_id,
        p_patient: b.patient_id,
      });
      if (rpcError) throw rpcError;
      cleared = !!rpc;
    } catch {
      const { count: accCount, error: accErr } = await supa
        .from("agreements_acceptances")
        .select("*", { count: "exact", head: true })
        .eq("org_id", b.org_id)
        .eq("specialist_id", specialist_id)
        .eq("patient_id", b.patient_id)
        .eq("contract_type", "specialist_patient")
        .eq("status", "accepted");
      if (accErr) {
        return NextResponse.json(
          { ok: false, error: { code: "DB_ERROR", message: "No se pudo validar acuerdos requeridos" } },
          { status: 500 },
        );
      }
      cleared = (accCount || 0) > 0;
    }

    if (!cleared) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "AGREEMENT_REQUIRED",
            message:
              "Se requiere aceptar el Acuerdo Especialista ↔ Paciente antes de agendar más sesiones. Genera el enlace en /acuerdos.",
          },
        },
        { status: 412 }, // Precondition Failed
      );
    }
  }

  // 1) Intento crear en Cal (si hay API key)
  const cal = await tryCreateInCal({ ...b, start: startISO, end: endISO });

  // 2) Siempre persistimos en nuestra tabla local (asignando provider_id = especialista actual)
  const { data, error } = await supa
    .from("appointments")
    .insert({
      org_id: b.org_id,
      patient_id: b.patient_id,
      provider_id: specialist_id, // importante para el gating y reporting
      cal_event_id: cal?.uid || null,
      start_at: startISO,
      end_at: endISO,
      title: b.title ?? null,
      notes: b.notes ?? null,
      location: b.location ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    mode: cal ? "cal" : "local",
    appointment: data,
    cal: cal ? { uid: cal.uid, meetingUrl: cal.meetingUrl } : null,
  });
}

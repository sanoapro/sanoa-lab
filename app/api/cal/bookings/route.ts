import { NextRequest, NextResponse } from "next/server";

// Nota: esta ruta corre en servidor y usa CALCOM_API_KEY desde .env.local
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
    // filtros simples
    const status = searchParams.get("status") || "upcoming"; // upcoming | past | accepted | etc.
    const afterStart = searchParams.get("afterStart") || new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const beforeEnd = searchParams.get("beforeEnd") || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString();
    const q = searchParams.get("q") || ""; // intentamos por nombre o email
    const take = searchParams.get("take") || "50";

    const qs = new URLSearchParams();
    if (status) qs.set("status", status);
    if (afterStart) qs.set("afterStart", afterStart);
    if (beforeEnd) qs.set("beforeEnd", beforeEnd);
    if (take) qs.set("take", take);
    // Búsqueda heurística: si contiene '@', filtra por email; si no, por nombre.
    if (q) {
      if (q.includes("@")) qs.set("attendeeEmail", q);
      else qs.set("attendeeName", q);
    }

    const url = `https://api.cal.com/v2/bookings?${qs.toString()}`;
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "cal-api-version": apiVersion, // requerido por la API v2
      },
      // Opcional: caché server-side ligera
      cache: "no-store",
    });

    const json = await resp.json();
    if (!resp.ok) {
      return NextResponse.json({ error: json?.error || "Error Cal.com" }, { status: resp.status });
    }

    // Reducir payload a lo esencial para UI
    const data = (json?.data || []).map((b: any) => ({
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

    return NextResponse.json({ data }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Error inesperado" }, { status: 500 });
  }
}

// MODE: session (user-scoped, cookies)
// GET /api/agenda/slots/suggest?org_id&provider_id&date=YYYY-MM-DD&tz=America/Mexico_City&duration=30&lead_min=120&limit=40&patient_id?
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function addMinutes(iso: string, minutes: number) {
  const d = new Date(iso);
  return new Date(d.getTime() + minutes * 60_000).toISOString();
}
function clampDayRange(date: string, tz: string) {
  // Ventana del día en UTC: [00:00, 23:59:59] del tz
  const start = new Date(`${date}T00:00:00`);
  const end = new Date(`${date}T23:59:59`);
  // Forzamos ISO; aceptamos ligeras imprecisiones por DST (sugerencias son relativas al tz dado)
  return { start: start.toISOString(), end: end.toISOString(), tz };
}
function weekdayISO(date: string) {
  const d = new Date(`${date}T00:00:00`);
  const n = d.getDay(); // 0..6 (Sun..Sat)
  return n === 0 ? 7 : n; // 1..7 Mon..Sun
}

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const u = new URL(req.url);
  const org_id = u.searchParams.get("org_id");
  const provider_id = u.searchParams.get("provider_id");
  const date = u.searchParams.get("date") || new Date().toISOString().slice(0, 10);
  const tz = u.searchParams.get("tz") || "America/Mexico_City";
  const duration = Math.max(10, Math.min(240, Number(u.searchParams.get("duration") || 30)));
  const lead_min = Math.max(0, Math.min(1440, Number(u.searchParams.get("lead_min") || 120)));
  const limit = Math.max(5, Math.min(200, Number(u.searchParams.get("limit") || 40)));
  const patient_id = u.searchParams.get("patient_id") || null;

  if (!org_id || !provider_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id y provider_id requeridos" } },
      { status: 400 },
    );
  }

  const wd = weekdayISO(date);
  const { start, end } = clampDayRange(date, tz);

  // Disponibilidad semanal
  const { data: avs, error: e1 } = await supa
    .from("agenda_availability")
    .select("weekday, start_time, end_time, slot_minutes, tz")
    .eq("org_id", org_id)
    .eq("provider_id", provider_id)
    .eq("weekday", wd);

  if (e1)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1.message } },
      { status: 400 },
    );

  // Overrides del día
  const { data: ovs } = await supa
    .from("agenda_slots_overrides")
    .select("date, kind, start_time, end_time")
    .eq("org_id", org_id)
    .eq("provider_id", provider_id)
    .eq("date", date);

  // Citas existentes del día
  const { data: appts } = await supa
    .from("agenda_appointments")
    .select("starts_at, ends_at, status")
    .eq("org_id", org_id)
    .eq("provider_id", provider_id)
    .gte("starts_at", start)
    .lte("starts_at", end)
    .in("status", ["scheduled", "completed"]) // bloquean
    .limit(500);

  // Score no-show por paciente (si se conoce)
  let nsScore = 50;
  if (patient_id) {
    const { data: ns } = await supa
      .from("agenda_ns_scores")
      .select("score")
      .eq("org_id", org_id)
      .eq("patient_id", patient_id)
      .maybeSingle();
    nsScore = ns?.score ?? 50;
  }

  // Construcción de slots
  type Slot = {
    start_local: string;
    start_iso: string;
    end_iso: string;
    score: number;
    reasons: string[];
  };
  const slots: Slot[] = [];

  function overlaps(aStart: string, aEnd: string, bStart: string, bEnd: string) {
    return !(aEnd <= bStart || bEnd <= aStart);
  }

  // Bloqueos y extras
  const blocks: Array<{ start: string; end: string }> = [];
  const extras: Array<{ start: string; end: string }> = [];
  (ovs || []).forEach((o) => {
    const s = new Date(`${date}T${o.start_time}:00`).toISOString();
    const e = new Date(`${date}T${o.end_time}:00`).toISOString();
    (o.kind === "block" ? blocks : extras).push({ start: s, end: e });
  });

  // Generación base por disponibilidad semanal
  for (const a of avs || []) {
    const baseStart = new Date(`${date}T${a.start_time}:00`).toISOString();
    const baseEnd = new Date(`${date}T${a.end_time}:00`).toISOString();
    const step = a.slot_minutes || duration;

    for (
      let cur = new Date(baseStart);
      cur < new Date(baseEnd);
      cur = new Date(cur.getTime() + step * 60_000)
    ) {
      const sIso = cur.toISOString();
      const eIso = addMinutes(sIso, duration);

      // Lead time
      if (new Date(sIso).getTime() < Date.now() + lead_min * 60_000) continue;

      // Bloqueos
      if (blocks.some((b) => overlaps(sIso, eIso, b.start, b.end))) continue;

      // Colisiones con citas
      if ((appts || []).some((x) => overlaps(sIso, eIso, x.starts_at, x.ends_at))) continue;

      // Window extra: si hay extras definidos, permitir sólo dentro de ellas
      if (extras.length > 0 && !extras.some((x) => overlaps(sIso, eIso, x.start, x.end))) continue;

      // Scoring simple
      const d = new Date(sIso);
      const hour = d.getUTCHours(); // aproximado
      let score = 50;
      const reasons: string[] = [];

      // Preferencias de horario (ejemplo): media mañana y tarde temprana
      if (hour >= 15 && hour <= 18) {
        score += 8;
        reasons.push("tarde-temprana");
      }
      if (hour >= 9 && hour <= 11) {
        score += 5;
        reasons.push("media-mañana");
      }

      // Penaliza proximidad (más seguro ≥ 24h si nsScore alto)
      if (nsScore >= 70 && new Date(sIso).getTime() < Date.now() + 24 * 60 * 60_000) {
        score -= 12;
        reasons.push("riesgo-no-show:evitar-proximidad");
      }

      // Bonus por gap grande antes/después (menos fricción)
      const gapBefore = Math.min(
        ...(appts || [])
          .filter((x) => x.ends_at <= sIso)
          .map((x) => new Date(sIso).getTime() - new Date(x.ends_at).getTime())
          .concat([60 * 60_000]),
      ); // default 60min
      if (gapBefore >= 60 * 60_000) {
        score += 4;
        reasons.push("buen-gap-previo");
      }

      slots.push({
        start_local: `${date} ${a.start_time}..`,
        start_iso: sIso,
        end_iso: eIso,
        score,
        reasons,
      });
    }
  }

  // Ordenar por score y hora
  slots.sort((a, b) => b.score - a.score || a.start_iso.localeCompare(b.start_iso));
  return NextResponse.json({ ok: true, data: slots.slice(0, limit) });
}

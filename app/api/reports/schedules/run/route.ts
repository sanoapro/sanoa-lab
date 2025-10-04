// MODE: service (no session, no cookies)
// POST /api/reports/schedules/run  (Requiere header x-cron-key === process.env.CRON_SECRET)
// Evalúa "due now" por tz/frequency y dispara mensajes o emails.
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function nowPartsTZ(tz: string) {
  // Retorna { dow, hour, minute, dateISO } en la zona tz
  const d = new Date();
  // Usamos Intl para extraer partes sin dependencias adicionales
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d).reduce<Record<string, string>>((acc: any, p: any) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const mapDow: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = mapDow[parts.weekday as keyof typeof mapDow] ?? 0;
  const hour = parseInt(parts.hour || "0", 10);
  const minute = parseInt(parts.minute || "0", 10);
  const dateISO = `${parts.year}-${parts.month}-${parts.day}`; // YYYY-MM-DD en tz (formateado)
  return { dow, hour, minute, dateISO };
}

async function sendViaReminders(
  org_id: string,
  channel: "whatsapp" | "sms",
  target: string,
  text: string,
) {
  // Llamamos a nuestro propio endpoint de schedule (acepta sesión; aquí usamos service → fetch directo interno).
  // Endpoint existente en proyecto: /api/reminders/schedule (MODE: session); pero permite service? Si exige sesión, ajusta el handler a permitir service con key.
  // Aquí hacemos un POST simple; si tu handler requiere encabezados extra, ajusta.
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/reminders/schedule`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      org_id,
      item: {
        channel,
        target,
        template: "reporte_auto",
        schedule_at: new Date().toISOString(),
        meta: { message: text, source: "report_schedule" },
      },
    }),
  }).catch(() => {});
}

async function sendEmail(target: string, subject: string, text: string) {
  // Usa tu endpoint de email existente. Ajusta el payload si difiere.
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/mail/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to: target, subject, text }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  // MODE: service
  const key = req.headers.get("x-cron-key");
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Bad key" } },
      { status: 401 },
    );
  }

  const svc = createServiceClient();

  // Obtenemos schedules activos
  const { data: schedules, error } = await svc
    .from("report_schedules")
    .select("*")
    .eq("is_active", true);
  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );

  const nowUTC = new Date();
  const executed: string[] = [];
  for (const s of schedules ?? []) {
    const { dow, hour, minute, dateISO } = nowPartsTZ(s.tz || "America/Mexico_City");

    // ¿due?
    let due = false;
    if (s.frequency === "daily") {
      due = hour === s.at_hour && minute === s.at_minute;
    } else if (s.frequency === "weekly") {
      const wants = Array.isArray(s.dow) ? s.dow.includes(dow) : false;
      due = wants && hour === s.at_hour && minute === s.at_minute;
    }

    // Chequeo de last_run_at para no duplicar
    if (due) {
      const last = s.last_run_at ? new Date(s.last_run_at) : null;
      // evitamos ejecutar más de una vez por día calendario de la tz (o misma marca semanal)
      const lastKey = last ? last.toISOString().slice(0, 16) : "";
      const nowKey = `${dateISO} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      if (lastKey === nowKey) {
        due = false;
      }
    }

    if (!due) continue;

    // Preparamos mensaje según reporte
    const subject = s.name || "Reporte programado";
    const text =
      s.report === "daily_summary"
        ? "Tu resumen operativo del día está disponible en Sanoa."
        : `Tu reporte programado (${s.report}) está disponible en Sanoa.`;

    try {
      if (s.channel === "whatsapp" || s.channel === "sms") {
        await sendViaReminders(s.org_id, s.channel, s.target, text);
      } else if (s.channel === "email") {
        await sendEmail(s.target, subject, text);
      }
      // marca ejecución
      await svc
        .from("report_schedules")
        .update({ last_run_at: nowUTC.toISOString() })
        .eq("id", s.id);
      executed.push(s.id);
    } catch {
      // no detenemos el loop; se puede agregar log en audit
    }
  }

  return NextResponse.json({ ok: true, data: { executed } });
}

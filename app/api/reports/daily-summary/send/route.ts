// /workspaces/sanoa-lab/app/api/reports/daily-summary/send/route.ts
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendTwilioWhatsApp } from "@/lib/notify/twilio";
import { track } from "@/lib/segment/track";
import { jsonOk, jsonError, requireHeader } from "@/lib/http/validate";

export const runtime = "nodejs";

function startOfDayISO(tz: string) {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const [y, m, d] = fmt.format(now).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0)).toISOString();
}

export async function POST(req: NextRequest) {
  const key = requireHeader(req, "x-cron-key", process.env.CRON_SECRET);
  if (!key.ok) {
    return jsonError(key.error.code, key.error.message, 401);
  }

  const supa = createServiceClient();
  const { error: rpcError } = await supa.rpc("reports_daily_summary_send" as any, {});
  if (!rpcError) {
    return jsonOk({ queued: true, rpc: "reports_daily_summary_send" });
  }
  if (rpcError.code && rpcError.code !== "PGRST204") {
    return jsonError("DB_ERROR", rpcError.message, 400);
  }

  try {
    const { org_id, to, tz = "America/Mexico_City" } = await req.json();
    if (!org_id || !to) {
      return jsonError("BAD_REQUEST", "Faltan org_id y/o to", 400);
    }

    const start = startOfDayISO(tz);

    // Logs de hoy solo de la org
    const { data: logs, error: eLogs } = await supa
      .from("reminder_logs")
      .select("status, reminder_id, created_at, reminders!inner(org_id, channel, appointment_at)")
      .gte("created_at", start)
      .eq("reminders.org_id", org_id);

    if (eLogs) return jsonError("DB_ERROR", eLogs.message, 400);

    const sent = (logs || []).filter((l: any) => l.status === "sent").length;
    const failed = (logs || []).filter((l: any) => l.status === "failed").length;

    const byChannel: Record<string, number> = {};
    (logs || []).forEach((l: any) => {
      const ch = l.reminders?.channel || "unknown";
      byChannel[ch] = (byChannel[ch] || 0) + 1;
    });

    // Posibles no-show (heurística)
    const apptsToday = (logs || [])
      .map((l: any) => l.reminders?.appointment_at)
      .filter(Boolean)
      .map((x: string) => new Date(x))
      .filter((d: any) => {
        const ds = new Date(start).getTime();
        const de = ds + 24 * 60 * 60 * 1000;
        const t = d.getTime();
        return t >= ds && t < de;
      });

    let possibleNoShow = 0;
    if (apptsToday.length > 0) {
      const { data: sessions } = await supa
        .from("rehab_sessions")
        .select("id, patient_id, date")
        .gte("date", start);
      // Si no hay sesiones hoy, todos son posibles no-shows
      possibleNoShow = sessions && sessions.length > 0 ? 0 : apptsToday.length;
    }

    const body = `✨ Resumen diario — ${new Date().toLocaleDateString("es-MX", { timeZone: tz })}

📤 Enviados: ${sent}
⚠️ Fallidos: ${failed}
🔎 Por canal: ${
      Object.entries(byChannel)
        .map(([k, v]: any) => `${k}:${v}`)
        .join(", ") || "—"
    }
🙈 Posibles no-show: ${possibleNoShow}

Configura el cron diario a /api/reports/daily-summary/send para automatizar este resumen.`;

    const res = await sendTwilioWhatsApp(to, body);

    track("Daily Summary Sent", {
      org_id,
      to,
      sid: res.sid,
      sent,
      failed,
      possibleNoShow,
      byChannel,
    });

    return jsonOk({
      sid: res.sid,
      sent,
      failed,
      byChannel,
      possibleNoShow,
    });
  } catch (e: any) {
    return jsonError("SERVER_ERROR", String(e?.message || e), 400);
  }
}

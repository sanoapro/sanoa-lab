// MODE: service (no session, no cookies) — protegido por x-cron-key
// Ruta: /api/jobs/reports/run
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { jsonOk, jsonError, requireHeader } from "@/lib/http/validate";

function nowInTZ(tz: string) {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(new Date()).map((p) => [p.type, p.value]));
  const y = Number(parts.year);
  const m = Number(parts.month);
  const d = Number(parts.day);
  const hh = Number(parts.hour);
  const mm = Number(parts.minute);
  const date = new Date(Date.UTC(y, m - 1, d, hh, mm));
  // weekday 0=Sunday in local tz
  const wdFmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).formatToParts(
    new Date(),
  );
  const wdShort = wdFmt.find((p) => p.type === "weekday")?.value ?? "Sun";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = map[wdShort] ?? 0;
  return { date, y, m, d, hh, mm, dow };
}

function shouldRun(item: any, nowTZ: ReturnType<typeof nowInTZ>) {
  if (!item.is_active) return false;
  const tz = item.tz || "America/Mexico_City";
  const atHour = item.at_hour ?? 9;
  const atMinute = item.at_minute ?? 0;
  const kind = item.schedule_kind ?? "daily";
  const dow: number[] = Array.isArray(item.dow) ? item.dow : [];

  // scheduled datetime (today in tz)
  const sched = new Date(Date.UTC(nowTZ.y, nowTZ.m - 1, nowTZ.d, atHour, atMinute));
  const windowMinutes = 30; // ventana de 30 min
  const windowStart = new Date(sched.getTime() - windowMinutes * 60 * 1000);
  const windowEnd = new Date(sched.getTime() + windowMinutes * 60 * 1000);

  const last = item.last_sent_at ? new Date(item.last_sent_at) : undefined;
  const alreadyToday = last && last >= windowStart && last <= windowEnd;

  if (alreadyToday) return false;

  switch (kind) {
    case "daily":
      return nowTZ.date >= windowStart && nowTZ.date <= windowEnd;
    case "weekly":
      if (!dow.includes(nowTZ.dow)) return false;
      return nowTZ.date >= windowStart && nowTZ.date <= windowEnd;
    case "monthly":
      if (nowTZ.d !== 1) return false; // primer día de mes
      return nowTZ.date >= windowStart && nowTZ.date <= windowEnd;
    default:
      return false;
  }
}

export async function POST(req: NextRequest) {
  const key = requireHeader(req, "x-cron-key", process.env.CRON_SECRET);
  if (!key.ok) {
    return jsonError(key.error.code, key.error.message, 401);
  }

  const svc = createServiceClient();
  const { error: rpcError } = await svc.rpc("reports_schedules_run", {});

  if (!rpcError) {
    return jsonOk({ queued: true, rpc: "reports_schedules_run" });
  }

  if (rpcError.code && rpcError.code !== "PGRST204") {
    return jsonError("DB_ERROR", rpcError.message, 400);
  }

  try {
    const { data: schedules, error } = await svc
      .from("report_schedules")
      .select("*")
      .eq("is_active", true);

    if (error) {
      return jsonError("DB_ERROR", error.message, 400);
    }

    const due: any[] = [];
    const results: any[] = [];

    const tzGroups: Record<string, any[]> = {};
    (schedules ?? []).forEach((sc) => {
      const tz = sc.tz || "America/Mexico_City";
      (tzGroups[tz] ||= []).push(sc);
    });

    for (const [tz, items] of Object.entries(tzGroups)) {
      const nowTZ = nowInTZ(tz);
      for (const sc of items) {
        if (shouldRun(sc, nowTZ)) {
          due.push(sc);
        }
      }
    }

    for (const sc of due) {
      let payload: any = null;

      const to = (sc.params?.to as string) ?? new Date().toISOString().slice(0, 10);
      const from =
        (sc.params?.from as string) ??
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      if (sc.scope === "bank_flow") {
        const { data, error: flowError } = await svc.rpc("bank_flow", {
          p_org_id: sc.org_id,
          p_from: from,
          p_to: to,
        });
        if (!flowError) payload = { type: "bank_flow", from, to, data };
      } else if (sc.scope === "bank_pl") {
        const { data, error: plError } = await svc.rpc("bank_pl", {
          p_org_id: sc.org_id,
          p_from: from,
          p_to: to,
        });
        if (!plError) payload = { type: "bank_pl", from, to, data };
      }

      if (payload) {
        await svc
          .from("report_schedules")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", sc.id);
        results.push({
          id: sc.id,
          scope: sc.scope,
          channel: sc.channel,
          target: sc.target,
          from,
          to,
        });
      }
    }

    return jsonOk({ data: { processed: results.length, results } });
  } catch (e: any) {
    return jsonError("SERVER_ERROR", e?.message ?? "Error", 500);
  }
}

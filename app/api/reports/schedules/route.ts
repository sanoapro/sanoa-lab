// MODE: service (no session, no cookies)
// POST /api/reports/schedules/run  (Requiere header x-cron-key === process.env.CRON_SECRET)
// Soporta: "daily_summary" y "agenda_alerts" (no-show rate).
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

function nowPartsTZ(tz: string) {
  const d = new Date();
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
  const parts = fmt.formatToParts(d).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  const mapDow: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const dow = mapDow[parts.weekday as keyof typeof mapDow] ?? 0;
  const hour = parseInt(parts.hour || "0", 10);
  const minute = parseInt(parts.minute || "0", 10);
  const dateISO = `${parts.year}-${parts.month}-${parts.day}`;
  return { dow, hour, minute, dateISO };
}

async function sendViaReminders(
  origin: string,
  org_id: string,
  channel: "whatsapp" | "sms",
  target: string,
  text: string,
) {
  await fetch(`${origin}/api/reminders/schedule`, {
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
async function sendEmail(origin: string, target: string, subject: string, text: string) {
  await fetch(`${origin}/api/mail/send`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ to: target, subject, text }),
  }).catch(() => {});
}

async function fetchAll(origin: string, path: string, params: URLSearchParams) {
  const out: any[] = [];
  let page = 1,
    pageSize = 1000;
  while (page <= 20) {
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const r = await fetch(`${origin}${path}?${params.toString()}`, { cache: "no-store" });
    const j = await r.json().catch(() => null);
    const arr: any[] = Array.isArray(j) ? j : (j?.data ?? []);
    if (!arr?.length) break;
    out.push(...arr);
    if (arr.length < pageSize) break;
    page += 1;
  }
  return out;
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

  const origin = new URL(req.url).origin;
  const svc = createServiceClient();

  // Schedules activos
  const { data: schedules, error } = await svc
    .from("report_schedules")
    .select("*")
    .eq("is_active", true);
  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );

  const { dow, hour, minute, dateISO } = nowPartsTZ("America/Mexico_City"); // check primaria; validamos por tz por cada schedule
  const executed: string[] = [];

  for (const s of schedules ?? []) {
    const tz = s.tz || "America/Mexico_City";
    const nowT = nowPartsTZ(tz);
    let due = false;
    if (s.frequency === "daily") {
      due = nowT.hour === s.at_hour && nowT.minute === s.at_minute;
    } else if (s.frequency === "weekly") {
      const wants = Array.isArray(s.dow) ? s.dow.includes(nowT.dow) : false;
      due = wants && nowT.hour === s.at_hour && nowT.minute === s.at_minute;
    }
    if (due) {
      const last = s.last_run_at ? new Date(s.last_run_at) : null;
      const lastKey = last ? last.toISOString().slice(0, 16) : "";
      const nowKey = `${nowT.dateISO} ${String(s.at_hour).padStart(2, "0")}:${String(s.at_minute).padStart(2, "0")}`;
      if (lastKey === nowKey) due = false;
    }
    if (!due) continue;

    try {
      if (s.report === "daily_summary") {
        const subject = s.name || "Reporte programado";
        const text = "Tu resumen operativo del día está disponible en Sanoa.";
        if (s.channel === "email") await sendEmail(origin, s.target, subject, text);
        else await sendViaReminders(origin, s.org_id, s.channel, s.target, text);
      }

      if (s.report === "agenda_alerts") {
        const p = (s.params || {}) as any;
        const window_days = Math.max(1, Number(p.window_days ?? 7));
        const threshold = Math.min(1, Math.max(0.01, Number(p.threshold ?? 0.15)));
        const min_n = Math.max(1, Number(p.min_n ?? 10));
        const scope = (p.scope ?? "resource") as "org" | "resource" | "patient";
        const resource_ids: string[] = Array.isArray(p.resource_ids) ? p.resource_ids : [];
        const tz2 = s.tz || "America/Mexico_City";

        const to = nowT.dateISO;
        const dt = new Date(to);
        const fromDate = new Date(dt);
        fromDate.setDate(dt.getDate() - (window_days - 1));
        const from = fromDate.toISOString().slice(0, 10);

        const q = new URLSearchParams({ org_id: s.org_id, from, to });
        if (resource_ids.length) q.set("resource", resource_ids.join(","));
        const bookings = await fetchAll(origin, "/api/cal/bookings", q);

        // Agregaciones simples
        const items = bookings as any[];
        const counts = { total: 0, ns: 0 };
        for (const b of items) {
          counts.total += 1;
          const st = (b.status ?? "").toString().toLowerCase();
          if (/no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(st)) counts.ns += 1;
        }
        const orgRate = counts.total ? counts.ns / counts.total : 0;

        let msgs: string[] = [];
        if (scope === "org") {
          if (counts.total >= min_n && orgRate >= threshold) {
            const ratePct = Math.round(orgRate * 1000) / 10;
            msgs.push(
              `Alerta no-show (ORG): ${ratePct}% (${counts.ns}/${counts.total}) últimos ${window_days}d`,
            );
          }
        } else if (scope === "resource") {
          // por recurso
          const byRes = new Map<string, { name: string; total: number; ns: number }>();
          for (const b of items) {
            const st = (b.status ?? "").toString().toLowerCase();
            const key = (b.resource_id || b.resource_name || "Sin recurso").toString();
            const name = (b.resource_name || b.provider || key).toString();
            const r = byRes.get(key) ?? { name, total: 0, ns: 0 };
            r.total += 1;
            if (/no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(st)) r.ns += 1;
            byRes.set(key, r);
          }
          for (const [key, r] of byRes) {
            if (r.total < min_n) continue;
            const rate = r.ns / r.total;
            if (rate >= threshold) {
              const ratePct = Math.round(rate * 1000) / 10;
              msgs.push(
                `Alerta no-show (Recurso ${r.name}): ${ratePct}% (${r.ns}/${r.total}) últimos ${window_days}d`,
              );
              // registrar log por recurso+fecha
              await svc.from("agenda_alert_log").upsert(
                {
                  schedule_id: s.id,
                  org_id: s.org_id,
                  key,
                  date_key: nowT.dateISO,
                  sent_at: new Date().toISOString(),
                },
                { onConflict: "schedule_id,key,date_key" },
              );
            }
          }
        } else if (scope === "patient") {
          const byPat = new Map<string, { name: string; total: number; ns: number }>();
          for (const b of items) {
            const st = (b.status ?? "").toString().toLowerCase();
            const key = (b.patient_id || b.patient || "Sin paciente").toString();
            const name = (b.patient_name || b.patient || key).toString();
            const r = byPat.get(key) ?? { name, total: 0, ns: 0 };
            r.total += 1;
            if (/no[\s_-]?show|missed|did[_\s-]?not[_\s-]?attend/.test(st)) r.ns += 1;
            byPat.set(key, r);
          }
          for (const [key, r] of byPat) {
            if (r.total < Math.max(3, Math.floor(min_n / 3))) continue;
            const rate = r.ns / r.total;
            if (rate >= threshold) {
              const ratePct = Math.round(rate * 1000) / 10;
              msgs.push(
                `Alerta no-show (Paciente ${r.name}): ${ratePct}% (${r.ns}/${r.total}) últimos ${window_days}d`,
              );
              await svc.from("agenda_alert_log").upsert(
                {
                  schedule_id: s.id,
                  org_id: s.org_id,
                  key,
                  date_key: nowT.dateISO,
                  sent_at: new Date().toISOString(),
                },
                { onConflict: "schedule_id,key,date_key" },
              );
            }
          }
        }

        if (msgs.length === 0 && scope === "org" && counts.total >= min_n) {
          // opcional: aviso de ok silencioso (omitimos)
        } else if (msgs.length > 0) {
          const subject = s.name || "Alertas de agenda";
          const text = msgs.join("\n");
          if (s.channel === "email") await sendEmail(origin, s.target, subject, text);
          else await sendViaReminders(origin, s.org_id, s.channel, s.target, text);
        }
      }

      await svc
        .from("report_schedules")
        .update({ last_run_at: new Date().toISOString() })
        .eq("id", s.id);
      executed.push(s.id);
    } catch {
      // best-effort; seguimos con otros schedules
    }
  }

  return NextResponse.json({ ok: true, data: { executed } });
}

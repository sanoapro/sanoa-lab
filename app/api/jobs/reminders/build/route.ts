// MODE: service (no session, no cookies)
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError } from "@/lib/http/validate";
import { pickChannelAndWindow } from "@/lib/reminders/scheduler";

/**
 * POST /api/jobs/reminders/build
 * Headers: x-cron-key: <CRON_SECRET>
 * Lógica:
 *  - Buscar work_assignments activos con due_at en las próximas 24h (due soon) o vencidos (overdue).
 *  - Evitar duplicados creando (org_id, assignment_id, template_slug) únicos cuando status='scheduled'.
 */

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-cron-key");
  if (key !== process.env.CRON_SECRET) {
    return jsonError("UNAUTHORIZED", "Bad key", 401);
  }

  const svc = createServiceClient();

  const now = new Date();
  const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  // 1) Traer assignments activos (batching por org)
  const { data: assigns, error: e1 } = await svc
    .from("work_assignments")
    .select("id, org_id, patient_id, provider_id, module, title, due_at, last_done_at, status")
    .eq("status", "active")
    .not("due_at", "is", null)
    .lte("due_at", soon.toISOString()); // due soon + overdue

  if (e1) return jsonError("DB_ERROR", e1.message, 400);
  if (!assigns || assigns.length === 0) return jsonOk({ created: 0 });

  let created = 0;

  // 2) Por cada assignment, decidir template_slug y ventana
  for (const a of assigns) {
    const due = a.due_at ? new Date(a.due_at) : null;
    if (!due) continue;

    const overdue = due.getTime() < now.getTime();
    const template_slug = overdue ? "work_overdue" : "work_due";

    // Obtener preferencias del proveedor (o defaults)
    const { data: pref } = await svc
      .from("reminder_prefs")
      .select("*")
      .eq("org_id", a.org_id)
      .eq("provider_id", a.provider_id)
      .maybeSingle();

    const { channel, firstAttemptAt } = pickChannelAndWindow({
      now,
      tz: pref?.tz ?? "America/Mexico_City",
      window_start: pref?.window_start ?? "09:00",
      window_end: pref?.window_end ?? "20:00",
      days_of_week: pref?.days_of_week ?? [1,2,3,4,5],
      channels_priority: (pref?.channels_priority as ("whatsapp"|"sms")[]) ?? ["whatsapp","sms"],
    });

    // Evitar duplicados (índice parcial UNIQUE lo refuerza)
    const { data: exists } = await svc
      .from("reminder_queue")
      .select("id")
      .eq("org_id", a.org_id)
      .eq("assignment_id", a.id)
      .eq("template_slug", template_slug)
      .eq("status", "scheduled")
      .maybeSingle();
    if (exists?.id) continue;

    const payload = {
      module: a.module,
      assignment_title: a.title,
      due_at: a.due_at,
    };

    const { error: e2 } = await svc.from("reminder_queue").insert({
      org_id: a.org_id,
      patient_id: a.patient_id,
      provider_id: a.provider_id,
      assignment_id: a.id,
      channel,
      template_slug,
      payload,
      status: "scheduled",
      attempt_count: 0,
      next_attempt_at: firstAttemptAt.toISOString(),
    });

    if (!e2) created++;
  }

  return jsonOk({ created });
}

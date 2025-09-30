// MODE: service (no session, no cookies)
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { jsonOk, jsonError } from "@/lib/http/validate";
import { buildMessage, scheduleRetry } from "@/lib/reminders/scheduler";

/**
 * POST /api/jobs/reminders/dispatch
 * Headers: x-cron-key: <CRON_SECRET>
 * Toma items de la cola y los intenta enviar vía /api/notify/whatsapp o /api/notify/sms (internas).
 * Si éxito → sent; si falla → retry/backoff.
 */

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-cron-key");
  if (key !== process.env.CRON_SECRET) {
    return jsonError("UNAUTHORIZED", "Bad key", 401);
  }

  const svc = createServiceClient();
  const nowIso = new Date().toISOString();

  // Traer lote (≤100) listo para enviar
  const { data: items, error: e1 } = await svc
    .from("reminder_queue")
    .select(
      "id, org_id, patient_id, provider_id, assignment_id, channel, template_slug, payload, status, attempt_count",
    )
    .or("status.eq.scheduled,status.eq.retrying")
    .lte("next_attempt_at", nowIso)
    .order("created_at", { ascending: true })
    .limit(100);

  if (e1) return jsonError("DB_ERROR", e1.message, 400);
  if (!items || items.length === 0) return jsonOk({ processed: 0 });

  let sent = 0,
    failed = 0;

  for (const it of items) {
    // Componer mensaje con datos frescos de asignación/paciente
    const { data: assignment } = await svc
      .from("work_assignments")
      .select("id, org_id, patient_id, provider_id, module, title, due_at, status, last_done_at")
      .eq("id", it.assignment_id)
      .maybeSingle();

    // Si la asignación ya no aplica, cancelar
    if (!assignment || assignment.status !== "active") {
      await svc.from("reminder_queue").update({ status: "canceled" }).eq("id", it.id);
      continue;
    }

    const message = buildMessage({ template_slug: it.template_slug, assignment });

    // Llamada a endpoint interno de notificación (debes tenerlos ya listos)
    const notifyPath = it.channel === "whatsapp" ? "/api/notify/whatsapp" : "/api/notify/sms";
    const res = await fetch(notifyPath, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        // Si tus notify endpoints exigen key, añade aquí:
        "x-cron-key": process.env.CRON_SECRET || "",
      },
      body: JSON.stringify({
        org_id: it.org_id,
        patient_id: assignment.patient_id, // el endpoint resuelve el teléfono del paciente
        message,
      }),
    }).catch(() => null);

    const ok = !!res && res.ok;
    if (ok) {
      await svc
        .from("reminder_queue")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          last_error: null,
          attempt_count: it.attempt_count + 1,
        })
        .eq("id", it.id);
      sent++;
      continue;
    }

    // Retry con backoff según prefs del proveedor
    const { data: pref } = await svc
      .from("reminder_prefs")
      .select("*")
      .eq("org_id", it.org_id)
      .eq("provider_id", it.provider_id)
      .maybeSingle();

    const retryPlan = scheduleRetry({
      now: new Date(),
      attempt: it.attempt_count + 1,
      max_retries: pref?.max_retries ?? 3,
      retry_backoff_min: pref?.retry_backoff_min ?? 30,
      tz: pref?.tz ?? "America/Mexico_City",
      window_start: pref?.window_start ?? "09:00",
      window_end: pref?.window_end ?? "20:00",
      days_of_week: pref?.days_of_week ?? [1, 2, 3, 4, 5],
    });

    if (!retryPlan.shouldRetry) {
      await svc
        .from("reminder_queue")
        .update({
          status: "failed",
          last_error: res ? `HTTP ${res.status}` : "Fetch error",
          attempt_count: it.attempt_count + 1,
        })
        .eq("id", it.id);
      failed++;
    } else {
      await svc
        .from("reminder_queue")
        .update({
          status: "retrying",
          attempt_count: it.attempt_count + 1,
          next_attempt_at: retryPlan.nextAttemptAt.toISOString(),
          last_error: res ? `HTTP ${res.status}` : "Fetch error",
        })
        .eq("id", it.id);
    }
  }

  return jsonOk({ processed: items.length, sent, failed });
}

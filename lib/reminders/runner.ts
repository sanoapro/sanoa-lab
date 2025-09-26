// /workspaces/sanoa-lab/lib/reminders/runner.ts
import { createServiceClient } from '@/lib/supabase/service';
import { sendTwilioSMS, sendTwilioWhatsApp } from '@/lib/notify/twilio';
import { renderTemplate } from './templates';
import { track } from '@/lib/segment/track';

function backoff(attempts: number) {
  // 1->10m, 2->30m, 3->60m
  const mins = attempts === 0 ? 0 : attempts === 1 ? 10 : attempts === 2 ? 30 : 60;
  return new Date(Date.now() + mins * 60_000).toISOString();
}

/**
 * Ejecuta un lote de recordatorios listos para enviar.
 * Usa service role para evitar lectura de cookies en entornos server/cron.
 */
export async function runReminderBatch(orgId?: string, limit = 20) {
  const supa = createServiceClient();
  const now = new Date().toISOString();

  let q = supa
    .from('reminders')
    .select('*')
    .in('status', ['scheduled', 'retry'])
    .lte('next_run_at', now)
    .order('next_run_at', { ascending: true })
    .limit(limit);

  if (orgId) q = q.eq('org_id', orgId);

  const { data: due, error } = await q;
  if (error) throw new Error(error.message);

  const results: Array<{ id: string; ok: boolean; error?: string }> = [];

  for (const r of due || []) {
    try {
      // Carga plantilla si existe
      let body = '';
      if (r.template_id) {
        const { data: tpl } = await supa
          .from('reminder_templates')
          .select('*')
          .eq('id', r.template_id)
          .maybeSingle();
        body = renderTemplate(tpl?.body || '', r.payload || {});
      } else {
        body = renderTemplate(
          '{org_name}: Recordatorio de cita el {date} a las {time}',
          r.payload || {}
        );
      }

      const channel = (r.channel as 'sms' | 'whatsapp') || 'whatsapp';
      let sendRes: any;

      // Enviar por canal
      if (channel === 'sms') {
        sendRes = await sendTwilioSMS(r.address, body);
      } else {
        sendRes = await sendTwilioWhatsApp(r.address, body);
      }

      // Log + actualizar reminder
      await supa.from('reminder_logs').insert({
        reminder_id: r.id,
        status: 'sent',
        provider: 'twilio',
        provider_sid: sendRes.sid,
        meta: { channel },
      });

      await supa
        .from('reminders')
        .update({
          status: 'sent',
          attempts: (r.attempts || 0) + 1,
          last_attempt_at: new Date().toISOString(),
          next_run_at: backoff((r.attempts || 0) + 1),
        })
        .eq('id', r.id);

      track('Reminder Sent', {
        org_id: r.org_id,
        channel,
        provider_sid: sendRes.sid,
        template_id: r.template_id ? 'tpl' : 'inline',
      });

      results.push({ id: r.id, ok: true });
    } catch (e: any) {
      const msg = String(e?.message || e);

      await supa.from('reminder_logs').insert({
        reminder_id: r.id,
        status: 'failed',
        provider: 'twilio',
        error: msg,
      });

      const nextStatus =
        (r.attempts || 0) + 1 < (r.max_attempts || 3) ? 'retry' : 'failed';

      await supa
        .from('reminders')
        .update({
          status: nextStatus,
          attempts: (r.attempts || 0) + 1,
          last_attempt_at: new Date().toISOString(),
          next_run_at: backoff((r.attempts || 0) + 1),
        })
        .eq('id', r.id);

      track('Reminder Failed', {
        org_id: r.org_id,
        channel: r.channel,
        error: msg,
        template_id: r.template_id ? 'tpl' : 'inline',
      });

      results.push({ id: r.id, ok: false, error: msg });
    }
  }

  return { processed: results.length, results };
}

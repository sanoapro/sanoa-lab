import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const form = await req.formData();
  const MessageSid = String(form.get('MessageSid') || '');
  const MessageStatus = String(form.get('MessageStatus') || ''); // queued/sent/delivered/failed/undelivered
  const To = String(form.get('To') || '');
  const From = String(form.get('From') || '');

  const supa = createServiceClient();

  // Intenta actualizar un log existente por provider_sid; si no, inserta
  const { data: existing } = await supa
    .from('reminder_logs')
    .select('id, reminder_id')
    .eq('provider_sid', MessageSid)
    .maybeSingle();

  if (existing) {
    await supa.from('reminder_logs').update({
      status: MessageStatus === 'delivered' ? 'delivered' : (MessageStatus === 'failed' || MessageStatus === 'undelivered') ? 'failed' : 'sent',
      meta: { To, From, rawStatus: MessageStatus }
    }).eq('id', existing.id);
  } else {
    // Vincula por "último reminder enviado" a ese To en últimas 24h
    const sinceISO = new Date(Date.now() - 24*60*60*1000).toISOString();
    const { data: rem } = await supa
      .from('reminders')
      .select('id')
      .eq('address', To)
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    await supa.from('reminder_logs').insert({
      reminder_id: rem?.id || null,
      status: MessageStatus === 'delivered' ? 'delivered' : (MessageStatus === 'failed' || MessageStatus === 'undelivered') ? 'failed' : 'sent',
      provider: 'twilio',
      provider_sid: MessageSid,
      meta: { To, From, rawStatus: MessageStatus }
    });
  }

  return NextResponse.json({ ok: true });
}

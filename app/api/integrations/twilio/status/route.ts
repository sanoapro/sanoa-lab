import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { jsonError } from '@/lib/http/validate';
import { rawBody, verifyTwilioSignature } from '@/lib/http/signatures';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const bodyRaw = await rawBody(req);
  if (!verifyTwilioSignature(req, bodyRaw)) {
    return jsonError('UNAUTHORIZED', 'Firma Twilio inválida', 401);
  }

  const params = new URLSearchParams(bodyRaw);
  const MessageSid = params.get('MessageSid') || '';
  const MessageStatus = params.get('MessageStatus') || '';
  const To = params.get('To') || '';
  const From = params.get('From') || '';

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

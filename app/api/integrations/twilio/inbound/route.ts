import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { track } from '@/lib/segment/track';

export const runtime = 'nodejs';

function toXml(message: string) {
  // TwiML mínimo
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
}

function normalizeAddress(from: string) {
  // Twilio entrega "whatsapp:+52..." o "+52..."
  return from?.startsWith('whatsapp:') ? from : from;
}

function parseIntent(bodyRaw: string) {
  const body = (bodyRaw || '').trim().toLowerCase();
  if (['1','si','sí','confirmo','confirmar','ok','listo','yes','y'].includes(body)) return 'confirm';
  if (['0','no','cancelar','cancelo','c'].includes(body)) return 'cancel';
  if (['2','reagendar','reagenda','reprogramar','rebook','r'].includes(body)) return 'rebook';
  return 'unknown';
}

export async function POST(req: Request) {
  // Twilio envía application/x-www-form-urlencoded
  const form = await req.formData();
  const From = String(form.get('From') || '');
  const To = String(form.get('To') || '');
  const Body = String(form.get('Body') || '');
  const Channel = From.startsWith('whatsapp:') ? 'whatsapp' : 'sms';

  const supa = createServiceClient();
  const addr = normalizeAddress(From);
  const intent = parseIntent(Body);

  // Buscar el reminder más reciente para esta dirección en la última semana
  const sinceISO = new Date(Date.now() - 7*24*60*60*1000).toISOString();
  const { data: rem } = await supa
    .from('reminders')
    .select('*')
    .eq('address', addr)
    .gte('created_at', sinceISO)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  let reply = 'No entendí tu respuesta. Responde:\n1 = Confirmar\n0 = Cancelar\n2 = Reagendar';
  let logStatus: 'user_confirmed'|'user_cancelled'|'user_rebook'|null = null;

  try {
    if (!rem) {
      // Sin contexto: solo educa
      const xml = toXml(reply);
      return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
    }

    if (intent === 'confirm') {
      await supa.from('reminders').update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        last_inbound_message: Body
      }).eq('id', rem.id);

      await supa.from('reminder_logs').insert({
        reminder_id: rem.id, status: 'user_confirmed', provider: 'twilio', meta: { channel: Channel, to: To }
      });

      await supa.from('appointments_events').insert({
        org_id: rem.org_id,
        appointment_id: rem.appointment_id,
        channel: Channel,
        address: addr,
        event: 'confirmed',
        meta: { reminder_id: rem.id }
      });

      track('Appointment Confirmed', { org_id: rem.org_id, reminder_id: rem.id, channel: Channel });

      reply = '✅ ¡Gracias! Tu cita ha sido confirmada.';
      logStatus = 'user_confirmed';
    }

    if (intent === 'cancel') {
      await supa.from('reminders').update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancel_reason: 'user_inbound',
        last_inbound_message: Body
      }).eq('id', rem.id);

      await supa.from('reminder_logs').insert({
        reminder_id: rem.id, status: 'user_cancelled', provider: 'twilio', meta: { channel: Channel, to: To }
      });

      await supa.from('appointments_events').insert({
        org_id: rem.org_id,
        appointment_id: rem.appointment_id,
        channel: Channel,
        address: addr,
        event: 'cancelled',
        meta: { reminder_id: rem.id }
      });

      track('Appointment Cancelled', { org_id: rem.org_id, reminder_id: rem.id, channel: Channel });

      reply = '🛑 Tu cita ha sido cancelada. Si deseas reagendar, responde 2.';
      logStatus = 'user_cancelled';
    }

    if (intent === 'rebook') {
      await supa.from('reminders').update({
        last_inbound_message: Body
      }).eq('id', rem.id);

      await supa.from('reminder_logs').insert({
        reminder_id: rem.id, status: 'user_rebook', provider: 'twilio', meta: { channel: Channel, to: To }
      });

      await supa.from('appointments_events').insert({
        org_id: rem.org_id,
        appointment_id: rem.appointment_id,
        channel: Channel,
        address: addr,
        event: 'rebook_request',
        meta: { reminder_id: rem.id }
      });

      track('Appointment Rebook Requested', { org_id: rem.org_id, reminder_id: rem.id, channel: Channel });

      reply = '🔁 Gracias. Nuestro equipo te contactará para reagendar.';
      logStatus = 'user_rebook';
    }

    const xml = toXml(reply);
    return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
  } catch (e:any) {
    // Fallback ante error
    await supa.from('reminder_logs').insert({
      reminder_id: rem?.id, status: logStatus || 'failed', provider: 'twilio', error: String(e?.message || e)
    });
    const xml = toXml('Hubo un problema procesando tu respuesta. Intenta de nuevo más tarde.');
    return new NextResponse(xml, { headers: { 'Content-Type': 'text/xml' } });
  }
}

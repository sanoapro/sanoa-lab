// lib/notify/twilio.ts
function formEncode(params: Record<string, string>) {
  return Object.entries(params)
    .map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

function getBaseUrl(){
  return process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3000';
}

function statusCallbackUrl(){
  return `${getBaseUrl()}/api/integrations/twilio/status`;
}

export async function sendTwilioSMS(to: string, body: string, opts?: { statusCallback?: string }) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_SMS_FROM!;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const StatusCallback = opts?.statusCallback || statusCallbackUrl();

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode({ To: to, From: from, Body: body, StatusCallback }),
  });

  const j = await r.json();
  if (!r.ok) throw new Error(j?.message || 'Twilio SMS error');
  return j; // incluye sid
}

export async function sendTwilioWhatsApp(to: string, body: string, opts?: { statusCallback?: string }) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const from = process.env.TWILIO_WA_FROM!; // ej. whatsapp:+1...
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

  const toWA = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
  const StatusCallback = opts?.statusCallback || statusCallbackUrl();

  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formEncode({ To: toWA, From: from, Body: body, StatusCallback }),
  });

  const j = await r.json();
  if (!r.ok) throw new Error(j?.message || 'Twilio WA error');
  return j; // incluye sid
}

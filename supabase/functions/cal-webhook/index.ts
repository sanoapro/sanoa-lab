function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function toBase64(buf: ArrayBuffer): string {
  let s = ''; const a = new Uint8Array(buf);
  for (let i = 0; i < a.length; i++) s += String.fromCharCode(a[i]);
  return btoa(s);
}
function toBase64Url(b64: string): string {
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

  const secret = (Deno.env.get('CAL_WEBHOOK_SECRET') ?? '').trim();
  if (!secret) return new Response('Missing CAL_WEBHOOK_SECRET', { status: 500 });

  const raw = await req.arrayBuffer();
  const headerRaw = (req.headers.get('x-cal-signature-256')
    ?? req.headers.get('x-cal-signature') ?? '').trim();
  if (!headerRaw) return new Response('Invalid signature', { status: 401 });

  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, raw);

  const hex = toHex(mac);
  const b64 = toBase64(mac);
  const b64url = toBase64Url(b64);

  const candidates = [hex, `sha256=${hex}`, b64, `sha256=${b64}`, b64url, `sha256=${b64url}`];
  const ok = candidates.some(c => c.toLowerCase() === headerRaw.toLowerCase());
  if (!ok) return new Response('Invalid signature', { status: 401 });

  let payload: unknown = null;
  try { payload = JSON.parse(new TextDecoder().decode(raw)); } catch {}

  return new Response(JSON.stringify({ ok: true, received: payload }), {
    status: 200, headers: { 'content-type': 'application/json' }
  });
});

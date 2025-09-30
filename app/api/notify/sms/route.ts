import { NextRequest } from 'next/server';
import { sendTwilioSMS } from '@/lib/notify/twilio';
import { jsonOk, jsonError, parseJson, parseOrError, requireHeader } from '@/lib/http/validate';
import { z } from 'zod';

export const runtime = 'nodejs';

const BodySchema = z.object({
  to: z.string().min(5),
  message: z.string().min(1).max(1600),
  org_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest){
  const key = requireHeader(req, 'x-cron-key', process.env.CRON_SECRET);
  if (!key.ok) {
    return jsonError(key.error.code, key.error.message, 401);
  }

  const body = await parseJson(req);
  const parsed = parseOrError(BodySchema, body);
  if (!parsed.ok) {
    return jsonError(parsed.error.code, parsed.error.message, 400);
  }

  try {
    const res = await sendTwilioSMS(parsed.value.to, parsed.value.message);
    return jsonOk({ sid: res.sid, status: res.status });
  } catch (e: any) {
    const message = String(e?.message || 'Twilio error');
    const status = typeof e?.status === 'number' ? e.status : 502;
    return jsonError('PROVIDER_ERROR', message, status);
  }
}

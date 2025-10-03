import { NextRequest } from "next/server";
import { sendTwilioSMS } from "@/lib/notify/twilio";
import { jsonOk, jsonError, parseJson, parseOrError, requireHeader } from "@/lib/http/validate";
import { z } from "zod";

export const runtime = "nodejs";

const BodySchema = z.object({
  to: z.string().min(5),
  message: z.string().min(1).max(1600),
  org_id: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  // Auth por header (cron / backend)
  const key = requireHeader(req, "x-cron-key", process.env.CRON_SECRET);
  if (!key.ok) {
    return jsonError(key.error.code, key.error.message, 401);
  }

  // Parse + validación
  const parsed = parseOrError(BodySchema, await parseJson(req));
  if (!parsed.ok) {
    return jsonError(parsed.error.code, parsed.error.message, 400);
  }

  // Evita repetir parsed.data.*
  const { to, message } = parsed.data;

  try {
    const res: any = await sendTwilioSMS(to, message);
    return jsonOk({ sid: res?.sid ?? null, status: res?.status ?? null });
  } catch (e: any) {
    const msg = String(e?.message || "Twilio error");
    const status = typeof e?.status === "number" ? e.status : 502;
    return jsonError("PROVIDER_ERROR", msg, status);
  }
}

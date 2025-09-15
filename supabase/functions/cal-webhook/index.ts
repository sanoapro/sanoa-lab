/**
 * Supabase Edge Function: cal-webhook
 * - Verifica firma HMAC-SHA256 del cuerpo crudo (x-cal-signature-256)
 * - Upsert en cal_bookings_raw por cal_uid
 * - Si existe patient_appointments.cal_uid, sincroniza status/start/end/title/meeting_url/last_webhook_at/metadata
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CAL_SECRET = Deno.env.get("CAL_WEBHOOK_SECRET")!;
const DEBUG_NO_VERIFY = Deno.env.get("DEBUG_NO_VERIFY") === "1";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}
function toBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function toBase64Url(buffer: ArrayBuffer): string {
  return toBase64(buffer).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
async function hmac(secret: string, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}
function safeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBuf = enc.encode(a);
  const bBuf = enc.encode(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    // Leer cuerpo *crudo* tal cual para HMAC
    const raw = await req.text();

    // Verificación de firma
    const header = (req.headers.get("x-cal-signature-256") || "").trim();
    if (!DEBUG_NO_VERIFY) {
      if (!CAL_SECRET) {
        return json({ ok: false, error: "Falta CAL_WEBHOOK_SECRET" }, 500);
      }
      if (!header) {
        return json({ ok: false, error: "Falta x-cal-signature-256" }, 401);
      }

      const mac = await hmac(CAL_SECRET, raw);
      const hex = toHex(mac);
      const b64 = toBase64(mac);
      const b64url = toBase64Url(mac);

      // Variantes aceptadas
      const candidates = [
        hex,
        `sha256=${hex}`,
        b64,
        `sha256=${b64}`,
        b64url,
        `sha256=${b64url}`,
      ];

      const headerLc = header.toLowerCase();
      const match = candidates.some(c => safeEqual(headerLc, c.toLowerCase()));
      if (!match) {
        if (debug) {
          return json({ ok: false, reason: "mismatch", header, candidates });
        }
        return json({ ok: false, error: "Invalid signature" }, 401);
      }
    }

    // Parse del JSON
    let body: any = {};
    try { body = JSON.parse(raw || "{}"); } catch { body = {}; }

    // Normalización
    const triggerEvent: string = body?.triggerEvent ?? "";
    const payload: any = body?.payload ?? {};
    const uid: string = payload?.uid ?? payload?.bookingId ?? "";
    if (!uid) return json({ ok: false, error: "Payload sin UID" }, 400);

    const startIso: string | null = payload?.startTime ?? payload?.start ?? null;
    const endIso: string | null = payload?.endTime ?? payload?.end ?? null;
    const status: string | null = payload?.status ?? null;

    const attendee = (payload?.attendees?.[0]) || {};
    const attendee_email: string | null = attendee?.email ?? null;
    const attendee_name: string | null = attendee?.name ?? null;

    const meetingUrl: string | null =
      payload?.videoCallUrl ??
      payload?.meetingUrl ??
      payload?.location ??
      null;

    const title: string | null = payload?.title ?? payload?.eventTitle ?? payload?.eventType?.slug ?? null;

    // 1) Upsert cal_bookings_raw
    {
      const { error } = await supabase
        .from("cal_bookings_raw")
        .upsert({
          cal_uid: uid,
          trigger_event: triggerEvent,
          status,
          start: startIso ? new Date(startIso).toISOString() : null,
          end: endIso ? new Date(endIso).toISOString() : null,
          attendee_email,
          attendee_name,
          payload,
          updated_at: new Date().toISOString(),
        }, { onConflict: "cal_uid" });
      if (error) throw error;
    }

    // 2) Si existe vínculo previo, sincroniza patient_appointments
    {
      const { data: paRow, error: e1 } = await supabase
        .from("patient_appointments")
        .select("id")
        .eq("cal_uid", uid)
        .maybeSingle();
      if (e1) throw e1;

      if (paRow) {
        const updates: Record<string, unknown> = {
          status,
          last_webhook_at: new Date().toISOString(),
          metadata: payload ?? null,
        };
        if (startIso) updates.start = new Date(startIso).toISOString();
        if (endIso) updates.end = new Date(endIso).toISOString();
        if (title !== null) updates.title = title;
        if (meetingUrl !== null) updates.meeting_url = meetingUrl;

        const { error: e2 } = await supabase
          .from("patient_appointments")
          .update(updates)
          .eq("id", paRow.id);
        if (e2) throw e2;
      }
    }

    if (debug) {
      return json({ ok: true, message: "sync ok (debug)" });
    }
    return json({ ok: true });
  } catch (err: any) {
    console.error("cal-webhook error", err);
    return json({ ok: false, error: err?.message || "Error" }, 500);
  }
});

// Helper JSON
function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "content-type": "application/json",
      // CORS no es requerido para Cal.com, pero no estorba:
      "access-control-allow-origin": "*",
    },
  });
}

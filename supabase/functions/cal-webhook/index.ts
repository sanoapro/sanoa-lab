/**
 * Supabase Edge Function: cal-webhook
 * - Verifica firma HMAC-SHA256 (header x-cal-signature-256)
 * - Upsert en cal_bookings_raw por cal_uid
 * - Si existe patient_appointments.cal_uid, sincroniza status/start/end/title/meeting_url/last_webhook_at/metadata
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CAL_SECRET = Deno.env.get("CAL_WEBHOOK_SECRET")!;
// Si necesitas probar local sin verificar firma, puedes setear DEBUG_NO_VERIFY=1 en secrets (no recomendado en prod)
const DEBUG_NO_VERIFY = Deno.env.get("DEBUG_NO_VERIFY") === "1";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function toHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    const h = bytes[i].toString(16).padStart(2, "0");
    hex += h;
  }
  return hex;
}

async function hmacSHA256Hex(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return toHex(sig);
}

serve(async (req) => {
  try {
    // Cal.com envía la firma en x-cal-signature-256 (hex en minúsculas)
    // Ref docs: Webhooks guide (Cal.com)
    const signatureHeader = req.headers.get("x-cal-signature-256") ?? "";
    const raw = await req.text();

    if (!DEBUG_NO_VERIFY) {
      if (!CAL_SECRET) {
        return new Response(JSON.stringify({ error: "Falta CAL_WEBHOOK_SECRET" }), { status: 500 });
      }
      if (!signatureHeader) {
        return new Response(JSON.stringify({ error: "Falta x-cal-signature-256" }), { status: 401 });
      }
      const expected = await hmacSHA256Hex(CAL_SECRET, raw);
      const valid =
        expected.length === signatureHeader.length &&
        crypto.timingSafeEqual(
          new TextEncoder().encode(expected),
          new TextEncoder().encode(signatureHeader.toLowerCase()),
        );
      if (!valid) {
        return new Response(JSON.stringify({ error: "Firma inválida" }), { status: 401 });
      }
    }

    const body = JSON.parse(raw || "{}");
    const triggerEvent: string = body?.triggerEvent ?? "";
    const payload: any = body?.payload ?? {};

    const uid: string = payload?.uid ?? payload?.bookingId ?? "";
    if (!uid) {
      return new Response(JSON.stringify({ error: "Payload sin UID" }), { status: 400 });
    }

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

    // 2) Si ya existe un vínculo en patient_appointments, sincroniza
    {
      const { data: paRow, error: e1 } = await supabase
        .from("patient_appointments")
        .select("id")
        .eq("cal_uid", uid)
        .maybeSingle();
      if (e1) throw e1;
      if (paRow) {
        const { error: e2 } = await supabase
          .from("patient_appointments")
          .update({
            status,
            start: startIso ? new Date(startIso).toISOString() : undefined,
            end: endIso ? new Date(endIso).toISOString() : undefined,
            title,
            meeting_url: meetingUrl ?? undefined,
            metadata: payload ?? undefined,
            last_webhook_at: new Date().toISOString(),
          })
          .eq("id", paRow.id);
        if (e2) throw e2;
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("webhook error", err);
    return new Response(JSON.stringify({ error: err?.message || "Error" }), { status: 500 });
  }
});

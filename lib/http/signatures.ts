import { NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

/** Lee el cuerpo crudo (no parseado). Nota: consumirás el stream, úsalo antes de .json()/.formData() */
export async function rawBody(req: NextRequest): Promise<string> {
  return await req.text();
}

function hmacHex(secret: string, payload: string, algo: "sha256" | "sha1" = "sha256") {
  return createHmac(algo, secret).update(payload, "utf8").digest("hex");
}
function hmacBase64(secret: string, payload: string, algo: "sha256" | "sha1" = "sha256") {
  return createHmac(algo, secret).update(payload, "utf8").digest("base64");
}

export function safeEquals(a: string, b: string) {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    if (ab.length !== bb.length) return false;
    return timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

/** Verifica header x-cron-key contra process.env.CRON_SECRET */
export function hasValidCronKey(req: NextRequest): boolean {
  const key = req.headers.get("x-cron-key");
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return !!key && safeEquals(key, secret);
}

/** Cal.com: HMAC-SHA256 del cuerpo. Header suele ser `Cal-Signature-256` (o variantes). */
export function verifyCalSignature(req: NextRequest, bodyRaw: string): boolean {
  const secret = process.env.CAL_SIGNING_SECRET;
  if (!secret) return false;
  const header =
    req.headers.get("cal-signature-256") ||
    req.headers.get("Cal-Signature-256") ||
    req.headers.get("cal-signature") ||
    req.headers.get("Cal-Signature");
  if (!header) return false;
  const hex = hmacHex(secret, bodyRaw, "sha256");
  const b64 = hmacBase64(secret, bodyRaw, "sha256");
  return safeEquals(header, hex) || safeEquals(header, b64);
}

/**
 * Twilio: X-Twilio-Signature (base64 de HMAC-SHA1 sobre URL + params ordenados).
 * Compatible con application/x-www-form-urlencoded.
 */
export function verifyTwilioSignature(req: NextRequest, bodyRaw: string): boolean {
  const token = process.env.TWILIO_AUTH_TOKEN;
  const header = req.headers.get("x-twilio-signature");
  if (!token || !header) return false;

  // Base string = full URL + concatenación de pares (key+value) ordenados por key
  const url = new URL(req.url);
  // Si el cuerpo es form-urlencoded lo parseamos; si es JSON, usamos tal cual.
  let base = url.origin + url.pathname;
  try {
    const params = new URLSearchParams(bodyRaw);
    // Si no hay pares, tratamos body como cadena literal (algunos proxies envían JSON)
    if ([...params.keys()].length > 0) {
      const pairs = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
      base += pairs.map(([k, v]) => k + v).join("");
    } else {
      base += bodyRaw;
    }
  } catch {
    base += bodyRaw;
  }

  const digest = createHmac("sha1", token).update(base, "utf8").digest("base64");
  return safeEquals(digest, header);
}

/** Jotform (genérico): HMAC-SHA256 del cuerpo con `JOTFORM_SIGNING_SECRET`. Header: `x-jotform-signature` o `x-signature-sha256`. */
export function verifyJotformSignature(req: NextRequest, bodyRaw: string): boolean {
  const secret = process.env.JOTFORM_SIGNING_SECRET;
  if (!secret) return false;
  const header = req.headers.get("x-jotform-signature") || req.headers.get("x-signature-sha256");
  if (!header) return false;
  const hex = hmacHex(secret, bodyRaw, "sha256");
  const b64 = hmacBase64(secret, bodyRaw, "sha256");
  return safeEquals(header, hex) || safeEquals(header, b64);
}

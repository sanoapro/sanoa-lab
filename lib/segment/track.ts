// lib/segment/track.ts
/**
 * Envío de eventos a Segment desde el servidor (Node).
 * - Usa la HTTP API v1 con Basic Auth (Write Key).
 * - Si no hay write key, hace no-op (no falla).
 */

type TrackArgs = {
  event: string;
  userId?: string;        // si conoces al usuario
  anonymousId?: string;   // si no hay userId
  properties?: Record<string, unknown>;
  context?: Record<string, unknown>;
};

const WRITE_KEY =
  process.env.SEGMENT_WRITE_KEY || process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;

function authHeader() {
  // Basic <base64(write_key:)>
  const b64 = Buffer.from(`${WRITE_KEY}:`).toString("base64");
  return `Basic ${b64}`;
}

/** track(): servidor */
export async function track(args: TrackArgs): Promise<void> {
  if (!WRITE_KEY) return; // no-op en entornos sin Segment

  const payload = {
    event: args.event,
    userId: args.userId,
    anonymousId: args.anonymousId,
    properties: args.properties ?? {},
    context: args.context ?? {},
    timestamp: new Date().toISOString(),
  };

  try {
    const res = await fetch("https://api.segment.io/v1/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text();
      console.error("Segment track failed:", res.status, txt);
    }
  } catch (e) {
    console.error("Segment track error:", e);
  }
}

/** helpers opcionales */
export async function identify(userId: string, traits?: Record<string, unknown>) {
  if (!WRITE_KEY) return;
  const res = await fetch("https://api.segment.io/v1/identify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ userId, traits, timestamp: new Date().toISOString() }),
  });
  if (!res.ok) console.error("Segment identify failed:", res.status, await res.text());
}

export async function group(userId: string, groupId: string, traits?: Record<string, unknown>) {
  if (!WRITE_KEY) return;
  const res = await fetch("https://api.segment.io/v1/group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: authHeader(),
    },
    body: JSON.stringify({ userId, groupId, traits, timestamp: new Date().toISOString() }),
  });
  if (!res.ok) console.error("Segment group failed:", res.status, await res.text());
}

// lib/segment/track.ts
/**
 * Envío de eventos a Segment desde el servidor (Node).
 * - Usa la HTTP API v1 con Basic Auth (Write Key).
 * - Si no hay write key, hace no-op (no falla).
 *
 * Firmas soportadas:
 *  - track("Evento", { ...props })
 *  - track({ event: "Evento", userId?, anonymousId?, properties?, context? })
 */

type Props = Record<string, unknown>;

export type TrackArgs = {
  event: string;
  userId?: string; // si conoces al usuario
  anonymousId?: string; // si no hay userId
  properties?: Props;
  context?: Props;
};

const WRITE_KEY =
  process.env.SEGMENT_WRITE_KEY || process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY;

/** Base64 en Node/Edge (fallback a Buffer en Node) */
function b64encode(str: string): string {
  // @ts-expect-error - razon: API legacy hasta migrar evento
  if (typeof btoa === "function") return btoa(str);
  // Node
  // eslint-disable-next-line n/no-deprecated-api
  return Buffer.from(str, "utf8").toString("base64");
}

function authHeader() {
  // Basic <base64(write_key:)>
  return `Basic ${b64encode(`${WRITE_KEY}:`)}`;
}

/** Normaliza argumentos para aceptar 1 o 2 formas */
function normalizeTrackArgs(
  eventOrArgs: string | TrackArgs,
  props?: Props
): TrackArgs {
  if (typeof eventOrArgs === "string") {
    return {
      event: eventOrArgs,
      properties: props ?? {},
    };
  }
  const { event, userId, anonymousId, properties, context } = eventOrArgs;
  return {
    event,
    userId,
    anonymousId,
    properties: properties ?? {},
    context: context ?? {},
  };
}

/** track(): servidor */
// Sobrecargas para tipado amigable
export async function track(event: string, properties?: Props): Promise<void>;
export async function track(args: TrackArgs): Promise<void>;
export async function track(
  eventOrArgs: string | TrackArgs,
  properties?: Props
): Promise<void> {
  if (!WRITE_KEY) return; // no-op en entornos sin Segment

  const args = normalizeTrackArgs(eventOrArgs, properties);

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
export async function identify(userId: string, traits?: Props) {
  if (!WRITE_KEY) return;
  try {
    const res = await fetch("https://api.segment.io/v1/identify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        userId,
        traits,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
       
      console.error("Segment identify failed:", res.status, await res.text());
    }
  } catch (e) {
     
    console.error("Segment identify error:", e);
  }
}

export async function group(
  userId: string,
  groupId: string,
  traits?: Props
) {
  if (!WRITE_KEY) return;
  try {
    const res = await fetch("https://api.segment.io/v1/group", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify({
        userId,
        groupId,
        traits,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!res.ok) {
       
      console.error("Segment group failed:", res.status, await res.text());
    }
  } catch (e) {
     
    console.error("Segment group error:", e);
  }
}

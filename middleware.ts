import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Rate limit mínimo para rutas automatizadas / webhooks.
 * - No valida firma/keys (eso lo hacemos en cada handler).
 * - Previene floods accidentales. Para producción considera Upstash/Redis.
 */

type Bucket = { count: number; resetAt: number };
const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000); // 1 min
const MAX_REQ = Number(process.env.RATE_LIMIT_MAX_REQ ?? 60); // 60 req/min por IP+ruta
const DISABLED = process.env.RATE_LIMIT_DISABLED === "1";

const globalBuckets = globalThis as unknown as { __sanoaBuckets?: Map<string, Bucket> };
if (!globalBuckets.__sanoaBuckets) globalBuckets.__sanoaBuckets = new Map();
const buckets = globalBuckets.__sanoaBuckets;

function getIp(req: NextRequest) {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  if ("ip" in req) {
    const ip = (req as { ip?: string | null }).ip;
    if (ip) return ip;
  }
  const realIp = req.headers.get("x-real-ip");
  return realIp?.trim() || "unknown";
}

export function middleware(req: NextRequest) {
  if (DISABLED) return NextResponse.next();

  // Sólo corre para matcher (ver config abajo)
  const ip = getIp(req);
  const key = `${ip}:${new URL(req.url).pathname}`;
  const now = Date.now();

  const b = buckets.get(key);
  if (!b || now > b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (b.count >= MAX_REQ) {
    const res = NextResponse.json(
      { ok: false, error: { code: "RATE_LIMITED", message: "Too Many Requests" } },
      { status: 429 },
    );
    res.headers.set("Retry-After", String(Math.ceil((b.resetAt - now) / 1000)));
    return res;
  }

  b.count += 1;
  buckets.set(key, b);
  return NextResponse.next();
}

// Aplica sólo a rutas automatizadas / webhooks / notificaciones
export const config = {
  matcher: ["/api/integrations/:path*", "/api/jobs/:path*", "/api/notify/:path*"],
};

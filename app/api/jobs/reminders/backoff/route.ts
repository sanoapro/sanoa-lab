// MODE: service (no session, no cookies) - protegido por x-cron-key
// POST /api/jobs/reminders/backoff
// Body: { dry_run?: boolean }  -> reintenta fallidos con backoff simple (15m, 45m, 2h) dentro de ventana diurna (8:00-20:00 tz org)
//
// Nota: este orquestador asume que ya cuentas con una cola/tabla que tu endpoint /api/jobs/reminders/run procesa.
// Aquí sólo llamamos a /api/jobs/reminders/run para disparar reintentos (idempotente).
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-cron-key");
  if (key !== process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "Bad key" } },
      { status: 401 },
    );
  }

  createServiceClient();
  // Si necesitaras reprogramar items en tu tabla de recordatorios, este es el lugar.
  // En esta versión, sólo disparamos el job estándar (idempotente) para que procese pendientes/reintentos.
  try {
    const res = await fetch(`${new URL(req.url).origin}/api/jobs/reminders/run`, {
      method: "POST",
      headers: { "x-cron-key": key },
    });
    const j = await res.json().catch(() => ({ ok: false }));
    return NextResponse.json({ ok: !!j?.ok, data: j });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "RUN_ERROR", message: String(e?.message || e) } },
      { status: 500 },
    );
  }
}

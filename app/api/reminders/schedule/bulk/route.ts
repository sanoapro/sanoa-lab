// MODE: session (user-scoped, cookies)
// POST /api/reminders/schedule/bulk
// Body: { org_id: string, items: Array<{ channel?: "whatsapp"|"sms", target: string, template?: string, message?: string }>, schedule_at?: string }
// Valida E.164 y reusa /api/reminders/schedule reenviando cookies (Next 15).
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { normalizeE164, isE164 } from "@/lib/templates";
import { cookies as nextCookies } from "next/headers";

export async function POST(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    items?: Array<{
      channel?: "whatsapp" | "sms";
      target: string;
      template?: string;
      message?: string;
    }>;
    schedule_at?: string;
  };

  if (!body?.org_id || !Array.isArray(body?.items)) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id e items son requeridos" } },
      { status: 400 },
    );
  }
  if (body.items.length === 0 || body.items.length > 100) {
    return NextResponse.json(
      { ok: false, error: { code: "LIMIT", message: "items debe ser 1..100" } },
      { status: 400 },
    );
  }

  // cookies (Next 15)
  const cookieStore = await nextCookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c: any) => `${c.name}=${c.value}`)
    .join("; ");

  let okCount = 0;
  const results: Array<{ target: string; ok: boolean; error?: string }> = [];
  for (const it of body.items) {
    const ch = it.channel ?? "whatsapp";
    const phone = normalizeE164(it.target || "");
    if (!isE164(phone)) {
      results.push({ target: it.target, ok: false, error: "Teléfono inválido (E.164)" });
      continue;
    }
    const r = await fetch(`${new URL(req.url).origin}/api/reminders/schedule`, {
      method: "POST",
      headers: { "content-type": "application/json", cookie: cookieHeader },
      body: JSON.stringify({
        org_id: body.org_id,
        item: {
          channel: ch,
          target: phone,
          template: it.template || "recordatorio_riesgo",
          schedule_at: body.schedule_at || new Date().toISOString(),
          meta: { message: it.message || "Te esperamos en tu próxima cita." },
        },
      }),
    }).catch(() => null);
    const j = await r?.json().catch(() => null);
    if (j?.ok) {
      okCount += 1;
      results.push({ target: phone, ok: true });
    } else {
      results.push({ target: phone, ok: false, error: j?.error?.message || "falló" });
    }
  }

  return NextResponse.json({
    ok: true,
    data: { sent: okCount, total: body.items.length, results },
  });
}

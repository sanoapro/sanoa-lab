// MODE: session (user-scoped, cookies)
// POST /api/reminders/templates/preview
// Body: { body, variables?: string[], payload?: Record<string,any>, target?: string }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { interpolateTemplate, isE164, normalizeE164 } from "@/lib/templates";

export async function POST(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const tpl: string = String(body?.body ?? "");
    const allowed: string[] = Array.isArray(body?.variables) ? body.variables : [];
    const payload: Record<string, any> = body?.payload ?? {};
    const targetRaw: string | undefined = body?.target;
    const target = targetRaw ? normalizeE164(String(targetRaw)) : undefined;

    if (!tpl) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "body requerido" } }, { status: 400 });

    const { text, missing, extra } = interpolateTemplate(tpl, payload, allowed);
    if (target && !isE164(target)) {
      return NextResponse.json({ ok: false, error: { code: "BAD_TARGET", message: "Destino no cumple E.164 (+<código><número>)" } }, { status: 400 });
    }

    return NextResponse.json({ ok: true, data: { preview: text, missing, extra, target } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

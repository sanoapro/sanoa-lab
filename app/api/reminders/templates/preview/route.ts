// MODE: session (user-scoped, cookies)
// POST /api/reminders/templates/preview
// Body: { body, variables?: string[], payload?: Record<string,any>, target?: string }
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { interpolateTemplate, isE164, normalizeE164 } from "@/lib/templates";
import { parseOrError } from "@/lib/http/validate";

const PreviewSchema = z.object({
  body: z.string().min(1, "body requerido"),
  variables: z.array(z.string()).optional(),
  payload: z.record(z.string(), z.any()).optional(),
  target: z.string().optional(),
});

export async function POST(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 },
      );

    const body = await req.json().catch(() => ({}));
    const parsed = parseOrError(PreviewSchema, body);
    if (!parsed.ok)
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 },
      );

    const payload = parsed.data.payload ?? {};
    const allowed = parsed.data.variables ?? [];
    const targetRaw = parsed.data.target ?? undefined;
    const target = targetRaw ? normalizeE164(String(targetRaw)) : undefined;

    const safePayload = (payload ?? {}) as Record<string, string | number | null | undefined>;
    const { text, missing, extra } = interpolateTemplate(parsed.data.body, safePayload, allowed);
if (target && !isE164(target)) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "BAD_TARGET", message: "Destino no cumple E.164 (+<código><número>)" },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, data: { preview: text, missing, extra, target } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

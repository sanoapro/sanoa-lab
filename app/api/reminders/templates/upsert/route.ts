// /workspaces/sanoa-lab/app/api/reminders/templates/upsert/route.ts
// MODE: session (user-scoped, cookies)
// POST /api/reminders/templates/upsert
// Body: { org_id, name, specialty?, channel, body, variables?: string[], is_active?: boolean }

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { parseOrError } from "@/lib/http/validate";

const UpsertSchema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  name: z.string().trim().min(1, "name requerido"),
  specialty: z.string().trim().optional().nullable(),
  channel: z.enum(["sms", "whatsapp"]),
  body: z.string().min(1, "body requerido"),
  variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const supa = await getSupabaseServer();

    // Usuario autenticado (RLS)
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const parsed = parseOrError(UpsertSchema, body);
    if (!parsed.ok)
      return NextResponse.json(
        { ok: false, error: { code: "VALIDATION_ERROR", message: parsed.error.message } },
        { status: 400 },
      );

    const variables = Array.from(
      new Set((parsed.data.variables ?? []).map((s) => s.trim()).filter(Boolean)),
    );

    // Upsert por (org_id, name)
    const { data, error } = await supa
      .from("reminders_templates") // 👈 nota: nombre de tabla en plural
      .upsert(
        {
          org_id: parsed.data.org_id,
          name: parsed.data.name,
          specialty: parsed.data.specialty ?? null,
          channel: parsed.data.channel,
          body: parsed.data.body,
          variables,
          is_active: parsed.data.is_active ?? true,
          updated_by: u.user.id,
          created_by: u.user.id,
        },
        { onConflict: "org_id,name" },
      )
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

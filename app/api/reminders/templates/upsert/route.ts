// /workspaces/sanoa-lab/app/api/reminders/templates/upsert/route.ts
// MODE: session (user-scoped, cookies)
// POST /api/reminders/templates/upsert
// Body: { org_id, name, specialty?, channel, body, variables?: string[], is_active?: boolean }

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

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
    const org_id: string | undefined = body?.org_id;
    const name: string = (body?.name ?? "").trim();
    const specialty: string | null = body?.specialty ? String(body.specialty) : null;
    const channel: "sms" | "whatsapp" = (body?.channel ?? "").trim();
    const tplBody: string = (body?.body ?? "").toString();

    const variables: string[] = Array.isArray(body?.variables)
      ? Array.from(new Set(body.variables.map((s: any) => String(s).trim()).filter(Boolean)))
      : [];

    const is_active: boolean = Boolean(body?.is_active ?? true);

    // Requeridos
    if (!org_id || !name || !channel || !tplBody) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "BAD_REQUEST", message: "org_id, name, channel y body son requeridos" },
        },
        { status: 400 },
      );
    }
    if (!["sms", "whatsapp"].includes(channel)) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "channel inválido" } },
        { status: 400 },
      );
    }

    // Upsert por (org_id, name)
    const { data, error } = await supa
      .from("reminders_templates") // 👈 nota: nombre de tabla en plural
      .upsert(
        {
          org_id,
          name,
          specialty,
          channel,
          body: tplBody,
          variables,
          is_active,
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

// MODE: session (user-scoped, cookies)
// Ruta: /api/reports/schedules  (GET lista, POST upsert items)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    if (!org_id) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });

    const { data, error } = await supa
      .from("report_schedules")
      .select("*")
      .eq("org_id", org_id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: userRes } = await supa.auth.getUser();
    if (!userRes?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const item: any = body?.item;

    if (!org_id || !item) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "org_id e item requeridos." } }, { status: 400 });
    }

    // Normalización mínima
    const payload = {
      id: item.id, // si viene, upsert por PK
      org_id,
      user_id: userRes.user.id,
      scope: item.scope, // 'bank_flow' | 'bank_pl'
      params: item.params ?? {},
      channel: item.channel, // 'email' | 'whatsapp'
      target: item.target, // correo o teléfono
      schedule_kind: item.schedule_kind ?? "daily", // 'daily'|'weekly'|'monthly'
      dow: item.dow ?? null, // sólo weekly
      at_hour: typeof item.at_hour === "number" ? item.at_hour : 9,
      at_minute: typeof item.at_minute === "number" ? item.at_minute : 0,
      tz: item.tz ?? "America/Mexico_City",
      is_active: typeof item.is_active === "boolean" ? item.is_active : true
    };

    const { data, error } = await supa
      .from("report_schedules")
      .upsert(payload, { onConflict: "id" })
      .select("*");

    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

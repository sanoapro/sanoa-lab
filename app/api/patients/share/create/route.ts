// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/share/create
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const patient_id: string | undefined = body?.patient_id;
    const expires_hours: number = Number(body?.expires_hours ?? 72);

    if (!org_id || !patient_id) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "org_id y patient_id requeridos." } },
        { status: 400 },
      );
    }
    const token = randomUUID();
    const expires_at = new Date(
      Date.now() + Math.max(1, expires_hours) * 3600 * 1000,
    ).toISOString();

    const { data, error } = await supa
      .from("patient_shares")
      .insert({
        org_id,
        patient_id,
        token,
        expires_at,
        created_by: u.user.id,
      })
      .select("token")
      .single();

    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    const origin = req.headers.get("x-forwarded-host")
      ? `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host")}`
      : new URL(req.url).origin;

    const url = `${origin}/share/patient/${data.token}`;
    return NextResponse.json({ ok: true, data: { url, token: data.token, expires_at } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

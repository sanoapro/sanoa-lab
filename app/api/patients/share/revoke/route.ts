// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/share/revoke
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

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
    const token: string | undefined = body?.token;
    if (!org_id || !token) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "org_id y token requeridos." } },
        { status: 400 },
      );
    }

    const { error } = await supa
      .from("patient_shares")
      .update({ revoked_at: new Date().toISOString() })
      .eq("org_id", org_id)
      .eq("token", token);

    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

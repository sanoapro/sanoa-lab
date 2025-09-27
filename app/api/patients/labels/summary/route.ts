// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/labels/summary?org_id
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    if (!org_id) return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });

    const { data, error } = await supa.rpc("patient_labels_summary", { p_org_id: org_id });
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

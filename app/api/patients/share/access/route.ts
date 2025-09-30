// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/share/access?org_id&patient_id&page&pageSize
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const patient_id = url.searchParams.get("patient_id");
    if (!org_id || !patient_id) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "org_id y patient_id requeridos." } },
        { status: 400 },
      );
    }

    const page = toInt(url.searchParams.get("page"), 1);
    const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 50), 200);
    const { data, error } = await supa.rpc("patient_share_access_list", {
      p_org_id: org_id,
      p_patient_id: patient_id,
      p_limit: pageSize,
      p_offset: (page - 1) * pageSize,
    });

    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    const total = data?.[0]?.total ?? 0;
    return NextResponse.json({
      ok: true,
      data: (data ?? []).map(({ total: _t, ...r }: any) => r),
      meta: { page, pageSize, total },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

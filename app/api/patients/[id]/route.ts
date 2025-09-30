// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/[id]
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    const org_id = url.searchParams.get("org_id"); // opcional, filtra org
    let q = supa
      .from("v_patients")
      .select("id, org_id, name, gender, dob, tags, created_at, deleted_at")
      .eq("id", params.id);
    if (org_id) q = q.eq("org_id", org_id);
    const { data, error } = await q.single();
    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    // Labels actuales (si existen)
    const { data: labels } = await supa
      .from("patient_labels")
      .select("label")
      .eq("org_id", data.org_id)
      .eq("patient_id", data.id);

    return NextResponse.json({
      ok: true,
      data: { ...data, labels: (labels ?? []).map((l) => l.label) },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

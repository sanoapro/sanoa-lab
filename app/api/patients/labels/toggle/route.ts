// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/labels/toggle
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }
    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const patient_id: string | undefined = body?.patient_id;
    const label: string | undefined = (body?.label ?? "").trim();

    if (!org_id || !patient_id || !label) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "org_id, patient_id y label son requeridos." } }, { status: 400 });
    }
    if (label.length > 40) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "label demasiado largo (<=40)." } }, { status: 400 });
    }

    // ¿Existe ya?
    const { data: exists, error: exErr } = await supa
      .from("patient_labels")
      .select("id")
      .eq("org_id", org_id)
      .eq("patient_id", patient_id)
      .eq("label", label)
      .maybeSingle();

    if (exErr) {
      return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: exErr.message } }, { status: 400 });
    }

    if (exists?.id) {
      // eliminar
      const { error } = await supa
        .from("patient_labels")
        .delete()
        .eq("org_id", org_id)
        .eq("patient_id", patient_id)
        .eq("label", label);
      if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
      return NextResponse.json({ ok: true, data: { toggled: "removed", label } });
    } else {
      // insertar
      const { error } = await supa.from("patient_labels").insert({
        org_id,
        patient_id,
        label,
        created_by: u.user.id,
      });
      if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
      return NextResponse.json({ ok: true, data: { toggled: "added", label } });
    }
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

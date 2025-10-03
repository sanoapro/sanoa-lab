// app/api/patients/[id]/route.ts
// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/[id]
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

type VPatientRow = {
  id: string;
  org_id: string;
  name: string | null;
  gender: string | null;
  dob: string | null;
  tags: string[] | null;
  created_at: string | null;
  deleted_at: string | null;
};

type PatientLabelRow = { label: string };

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();

    if (!u?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );
    }

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id"); // opcional

    let q = supa
      .from("v_patients")
      .select("id, org_id, name, gender, dob, tags, created_at, deleted_at")
      .eq("id", params.id);

    if (org_id) q = q.eq("org_id", org_id);

    const { data, error } = await q.single<VPatientRow>();
    if (error) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );
    }
    if (!data) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Paciente no encontrado" } },
        { status: 404 },
      );
    }

    // Labels actuales (si existen)
    const { data: labels } = await supa
      .from("patient_labels")
      .select("label")
      .eq("org_id", data.org_id)
      .eq("patient_id", data.id);

    const labelList = (labels ?? []).map((l: PatientLabelRow) => l.label);

    return NextResponse.json({ ok: true, data: { ...data, labels: labelList } });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message } },
      { status: 500 },
    );
    }
}

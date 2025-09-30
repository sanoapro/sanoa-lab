// MODE: service (no session, no cookies) — público por token firmado
// Ruta: /api/patients/share/[token]
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  // MODE: service
  try {
    const svc = createServiceClient();

    // 1) Validar token
    const { data: share, error: errShare } = await svc
      .from("patient_shares")
      .select("id, org_id, patient_id, expires_at, revoked_at")
      .eq("token", params.token)
      .single();

    if (errShare || !share) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Token inválido." } },
        { status: 404 },
      );
    }
    const now = new Date();
    if (share.revoked_at || (share.expires_at && new Date(share.expires_at) < now)) {
      return NextResponse.json(
        { ok: false, error: { code: "EXPIRED", message: "Enlace expirado o revocado." } },
        { status: 410 },
      );
    }

    // 2) Snapshot mínimo del paciente (via v_patients)
    const { data: patient, error: errP } = await svc
      .from("v_patients")
      .select("id, org_id, name, gender, dob, tags, created_at")
      .eq("id", share.patient_id)
      .eq("org_id", share.org_id)
      .single();

    if (errP || !patient) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Paciente no disponible." } },
        { status: 404 },
      );
    }

    // 3) Trail de acceso
    try {
      const ip = (_req.headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || null;
      const ua = _req.headers.get("user-agent") || null;
      await svc.from("patient_share_access").insert({
        share_id: share.id,
        ip,
        user_agent: ua ?? null,
      });
    } catch (_) {
      /* no romper la entrega si falla el trail */
    }

    return NextResponse.json({ ok: true, data: { patient } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

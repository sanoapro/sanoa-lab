import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { scoreAny } from "@/lib/assessments/mental";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    patient_id?: string;
    tool?: "phq9" | "gad7" | "auditc";
    answers?: Record<string, number>;
    issued_at?: string | null;
  };
  if (!body?.org_id || !body?.patient_id || !body?.tool || !body?.answers)
    return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "org_id, patient_id, tool, answers son requeridos" } }, { status: 400 });

  const score = scoreAny(body.tool, body.answers);
  const { data, error } = await supa
    .from("mente_assessments")
    .insert({
      org_id: body.org_id,
      patient_id: body.patient_id,
      tool: body.tool,
      answers_json: body.answers,
      score_total: score.total,
      score_breakdown: score.breakdown,
      risk_band: score.risk_band,
      issued_at: body.issued_at ?? null,
      created_by: u.user.id,
    })
    .select("id,org_id,patient_id,tool,score_total,risk_band,created_at,issued_at")
    .single();

  if (error)
    return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });
  return NextResponse.json({ ok: true, data });
}

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { scoreAny } from "@/lib/assessments/mental";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    tool?: string;
    answers?: Record<string, number>;
  };
  if (!body?.tool || !body?.answers)
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "tool y answers son requeridos" } },
      { status: 400 },
    );

  const tool = body.tool.toLowerCase();
  if (!["phq9", "gad7", "auditc"].includes(tool))
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "tool inválido" } },
      { status: 400 },
    );

  const res = scoreAny(tool as any, body.answers);
  return NextResponse.json({ ok: true, data: res });
}

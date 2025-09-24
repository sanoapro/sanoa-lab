import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { computeSumScore, validateAnswers } from "@/lib/forms-schema";
import type { FormSchema } from "@/types/forms";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "JSON inválido" }, { status: 400 });

  const { template_id, patient_id, answers } = body as {
    template_id?: string;
    patient_id?: string;
    answers?: Record<string, unknown>;
  };

  if (!template_id || !patient_id || !answers) {
    return NextResponse.json(
      { error: "template_id, patient_id y answers son requeridos" },
      { status: 400 },
    );
  }

  // Traer plantilla para obtener schema y org_id
  const { data: tpl, error: eTpl } = await supabase
    .from("form_templates")
    .select("*")
    .eq("id", template_id)
    .single();

  if (eTpl || !tpl) {
    console.error("[responses:tpl]", eTpl);
    return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
  }

  const schema = tpl.schema as FormSchema;

  try {
    validateAnswers(schema, answers);
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Respuestas inválidas" }, { status: 400 });
  }

  const score = computeSumScore(schema, answers);

  // Usuario actual como created_by
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const created_by = user?.id || tpl.created_by;

  const insert = {
    template_id,
    org_id: tpl.org_id,
    patient_id,
    answers,
    score,
    created_by,
  };

  const { data, error } = await supabase
    .from("form_responses")
    .insert(insert)
    .select("id")
    .single();
  if (error) {
    console.error("[responses:insert]", error);
    return NextResponse.json({ error: "No se pudo guardar la respuesta" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}

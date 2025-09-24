import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const JF_API = "https://api.jotform.com";

type JotformWebhook = {
  submissionID?: string;
  formID?: string;
  // el resto de campos llegan como { "q1": "...", "q2": "...", ... } dependiendo del Unique Name
  [k: string]: any;
};

async function fetchSubmission(id: string, apiKey: string) {
  const r = await fetch(`${JF_API}/submission/${id}?apiKey=${apiKey}`);
  if (!r.ok) throw new Error(`Jotform API error ${r.status}`);
  return r.json();
}

/** Mapeo de uniqueNames de Jotform -> keys internos */
const FORM_MAPPINGS: Record<
  string, // template_key
  { fields: Record<string, string> } // { jotformUniqueName: ourKey }
> = {
  phq9: {
    fields: {
      q1: "q1",
      q2: "q2",
      q3: "q3",
      q4: "q4",
      q5: "q5",
      q6: "q6",
      q7: "q7",
      q8: "q8",
      q9: "q9",
    },
  },
  gad7: {
    fields: { q1: "q1", q2: "q2", q3: "q3", q4: "q4", q5: "q5", q6: "q6", q7: "q7" },
  },
  consent: {
    fields: { full_name: "full_name", date: "date", accept: "accept", signature: "signature" },
  },
};

function normalizeAnswers(templateKey: string, payload: Record<string, any>) {
  const map = FORM_MAPPINGS[templateKey]?.fields || {};
  const out: Record<string, any> = {};
  for (const [jfKey, ourKey] of Object.entries(map)) {
    if (payload[jfKey] != null) out[ourKey] = payload[jfKey];
  }
  // normaliza números de likert si vienen como string
  if (templateKey === "phq9" || templateKey === "gad7") {
    for (const k of Object.values(map)) {
      const n = Number(out[k]);
      if (!Number.isNaN(n)) out[k] = n;
    }
  }
  return out;
}

export async function POST(req: Request) {
  const url = new URL(req.url);
  const key = url.searchParams.get("key");
  if (!key || key !== process.env.JOTFORM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const bodyText = await req.text(); // Jotform puede enviar x-www-form-urlencoded o JSON
  let data: JotformWebhook | null = null;
  try {
    // intenta JSON
    data = JSON.parse(bodyText);
  } catch {
    // intenta parse URL-encoded
    const params = new URLSearchParams(bodyText);
    data = Object.fromEntries(params.entries()) as any;
  }

  if (!data) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const submissionId = data.submissionID || data.submission_id || data["submission[id]"];
  const templateKey = data.template_key || data["template_key"];
  const patientId = data.patient_id || data["patient_id"];
  const orgId = data.org_id || data["org_id"];
  const formId = data.formID || data.form_id;

  if (!submissionId || !templateKey || !patientId || !orgId) {
    return NextResponse.json(
      { error: "Faltan campos (submissionId/templateKey/patientId/orgId)" },
      { status: 400 },
    );
  }

  // Doble verificación con API Jotform
  try {
    const apiKey = process.env.JOTFORM_API_KEY!;
    const jf = await fetchSubmission(submissionId, apiKey);
    // jf.content debería tener answers + form_id; validaciones básicas:
    if (!jf?.content) throw new Error("Sin content en respuesta Jotform");
    if (formId && jf?.content?.form_id && String(jf.content.form_id) !== String(formId)) {
      throw new Error("form_id no coincide");
    }
  } catch (e) {
    console.error("[jotform:verify]", e);
    return NextResponse.json({ error: "No se pudo verificar con Jotform API" }, { status: 400 });
  }

  // buscar plantilla por specialty=mente + key via name o un campo fijo
  // más simple: buscar por specialty + name = PHQ-9 / GAD-7 / Consentimiento
  const templateName =
    templateKey === "phq9"
      ? "PHQ-9"
      : templateKey === "gad7"
        ? "GAD-7"
        : "Consentimiento informado";

  const { data: tpl, error: eTpl } = await supabase
    .from("form_templates")
    .select("*")
    .eq("org_id", orgId)
    .eq("name", templateName)
    .eq("specialty", "mente")
    .single();

  if (eTpl || !tpl) {
    console.error("[jotform:tpl]", eTpl);
    return NextResponse.json({ error: "Plantilla no encontrada en org" }, { status: 404 });
  }

  // Normaliza respuestas desde keys uniqueName
  const answers = normalizeAnswers(templateKey, data as any);

  // Calcular score si aplica (mismo criterio que en nativo)
  let score: { total?: number } | undefined;
  if (templateKey === "phq9" || templateKey === "gad7") {
    const keys = Object.keys(answers);
    const total = keys.reduce((acc, k) => acc + (Number(answers[k]) || 0), 0);
    score = { total };
  }

  // Usuario actual es desconocido en webhook; usa tpl.created_by como fallback
  const insert = {
    template_id: tpl.id,
    org_id: orgId,
    patient_id: patientId,
    answers,
    score,
    created_by: tpl.created_by,
  };

  const { error } = await supabase.from("form_responses").insert(insert);
  if (error) {
    console.error("[jotform:insert]", error);
    return NextResponse.json({ error: "No se pudo guardar la respuesta" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

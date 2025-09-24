import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type ProposedItem = { drug: string };

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => null);
  const { patient_id, items = [] } = (body || {}) as { patient_id: string; items: ProposedItem[] };
  if (!patient_id || !Array.isArray(items))
    return NextResponse.json({ error: "bad_request" }, { status: 400 });

  // Condiciones y medicamentos actuales del paciente
  const [condsRes, medsRes] = await Promise.all([
    supabase
      .from("patient_conditions")
      .select("concept:concept_dictionary(id, canonical, canonical_norm)")
      .eq("patient_id", patient_id),
    supabase.from("patient_medications").select("name").eq("patient_id", patient_id),
  ]);

  const conditions = (condsRes.data || []).map((c: any) => c.concept?.id).filter(Boolean);
  const currentMeds = (medsRes.data || []).map((m: any) => String(m.name || ""));

  // Resolución por nombre normalizado
  const names = Array.from(
    new Set([...currentMeds, ...items.map((i) => i.drug)].map(norm).filter(Boolean)),
  );

  const { data: dict } = await supabase
    .from("drug_dictionary")
    .select("id, kind, name_norm, synonyms")
    .in("name_norm", names);

  // map name_norm -> ingredient ids
  const nameToIngredientIds = new Map<string, string[]>();
  for (const d of dict || []) {
    if (d.kind === "ingredient") nameToIngredientIds.set(d.name_norm, [d.id]);
  }
  // try synonyms
  for (const nm of names) {
    if (!nameToIngredientIds.has(nm)) {
      const hit = (dict || []).find(
        (d) => d.kind === "ingredient" && (d.synonyms || []).map(norm).includes(nm),
      );
      if (hit) nameToIngredientIds.set(nm, [hit.id]);
    }
  }

  const proposedIngr = items.map((i) => nameToIngredientIds.get(norm(i.drug)) || []).flat();
  const currentIngr = currentMeds.map((n) => nameToIngredientIds.get(norm(n)) || []).flat();

  // DD
  let ddWarnings: any[] = [];
  if (proposedIngr.length && currentIngr.length) {
    const pairs = new Map<string, { a: string; b: string }>();
    for (const a of proposedIngr)
      for (const b of currentIngr) {
        const key = [a, b].sort().join("#");
        pairs.set(key, { a, b });
      }
    const arr = Array.from(pairs.values());
    if (arr.length) {
      const { data } = await supabase
        .from("drug_interactions")
        .select("a_ingredient, b_ingredient, severity, note")
        .in(
          "a_ingredient",
          arr.map((x) => x.a),
        )
        .in(
          "b_ingredient",
          arr.map((x) => x.b),
        );
      ddWarnings = data || [];
    }
  }

  // DC
  let dcWarnings: any[] = [];
  if (proposedIngr.length && conditions.length) {
    const { data } = await supabase
      .from("drug_condition_alerts")
      .select("ingredient_id, condition_concept_id, severity, note")
      .in("ingredient_id", proposedIngr)
      .in("condition_concept_id", conditions);
    dcWarnings = data || [];
  }

  return NextResponse.json({
    warnings: {
      drug_drug: ddWarnings,
      drug_condition: dcWarnings,
    },
  });
}

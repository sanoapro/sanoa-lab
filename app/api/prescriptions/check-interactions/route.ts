import { NextRequest } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, forbidden, serverError } from "@/lib/api/responses";
import { userBelongsToOrg } from "@/lib/api/orgs";

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

const schema = z.object({
  org_id: z.string().min(1, "org_id requerido"),
  patient_id: z.string().min(1, "patient_id requerido"),
  items: z.array(z.object({ drug: z.string().min(1, "drug requerido") })).default([]),
});

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const json = await req.json().catch(() => null);
    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return badRequest("Payload inválido", { details: parsed.error.flatten() });
    }

    const { org_id, patient_id, items } = parsed.data;
    const allowed = await userBelongsToOrg(supa, org_id, auth.user.id);
    if (!allowed) {
      return forbidden("Sin acceso a la organización");
    }

    const [condsRes, medsRes] = await Promise.all([
      supa
        .from("patient_conditions")
        .select("concept:concept_dictionary(id, canonical, canonical_norm)")
        .eq("patient_id", patient_id)
        .eq("org_id", org_id),
      supa.from("patient_medications").select("name").eq("patient_id", patient_id).eq("org_id", org_id),
    ]);

    if (condsRes.error) throw condsRes.error;
    if (medsRes.error) throw medsRes.error;

    const conditions = (condsRes.data || []).map((c: any) => c.concept?.id).filter(Boolean);
    const currentMeds = (medsRes.data || []).map((m: any) => String(m.name || ""));

    const names = Array.from(new Set([...currentMeds, ...items.map((i) => i.drug)].map(norm).filter(Boolean)));

    const { data: dict, error: dictError } = await supa
      .from("drug_dictionary")
      .select("id, kind, name_norm, synonyms")
      .in("name_norm", names);

    if (dictError) throw dictError;

    const nameToIngredientIds = new Map<string, string[]>();
    for (const d of dict || []) {
      if (d.kind === "ingredient") nameToIngredientIds.set(d.name_norm, [d.id]);
    }
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
        const { data, error } = await supa
          .from("drug_interactions")
          .select("a_ingredient, b_ingredient, severity, note")
          .in("a_ingredient", arr.map((x) => x.a))
          .in("b_ingredient", arr.map((x) => x.b));
        if (error) throw error;
        ddWarnings = data || [];
      }
    }

    let dcWarnings: any[] = [];
    if (proposedIngr.length && conditions.length) {
      const { data, error } = await supa
        .from("drug_condition_alerts")
        .select("ingredient_id, condition_concept_id, severity, note")
        .in("ingredient_id", proposedIngr)
        .in("condition_concept_id", conditions);
      if (error) throw error;
      dcWarnings = data || [];
    }

    return ok({
      warnings: {
        drug_drug: ddWarnings,
        drug_condition: dcWarnings,
      },
    });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

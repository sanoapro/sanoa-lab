import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// normalizador simple (minúsculas + espacios)
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim();
  const limit = Math.min(Number(sp.get("limit") || "12"), 25);
  if (!q) return NextResponse.json({ items: [] });

  const qn = norm(q);

  // 1) match por name y name_norm
  const { data: byName } = await supabase
    .from("drug_dictionary")
    .select("*")
    .or(`name.ilike.%${q}%,name_norm.ilike.%${qn}%`)
    .limit(limit);

  // 2) si quedó cupo, intentar por sinónimos (simple)
  let got = byName || [];
  if ((got?.length || 0) < limit) {
    const { data: bySyn } = await supabase
      .from("drug_dictionary")
      .select("*")
      .contains("synonyms", [q]) // requiere que synonyms sea text[]; match exacto
      .limit(limit - (got?.length || 0));
    const pool = new Map<string, any>();
    for (const r of [...(got || []), ...(bySyn || [])]) pool.set(r.id, r);
    got = Array.from(pool.values());
  }

  return NextResponse.json({ items: got || [] });
}

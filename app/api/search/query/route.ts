import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const EMB_MODEL = "text-embedding-3-small";
const useAI = () => !!process.env.OPENAI_API_KEY;

async function embedOne(text: string): Promise<number[]> {
  if (!useAI()) return Array(1536).fill(0);
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: text, model: EMB_MODEL }),
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return j.data[0].embedding as number[];
}

export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "");
  const org = String(searchParams.get("org") || "");
  const limit = Number(searchParams.get("limit") || "20");
  if (!org) return NextResponse.json({ error: "org requerida" }, { status: 400 });
  if (!q.trim()) return NextResponse.json({ results: [] });

  if (useAI()) {
    const vec = await embedOne(q);
    const { data, error } = await supabase.rpc("search_notes_files", { p_org: org, p_query: vec as any, p_limit: limit });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ results: data, mode: "semantic" });
  }

  // Fallback simple por palabras
  let rn = await supabase
    .from("patient_notes")
    .select("id, patient_id, titulo, contenido, patients!inner(org_id)")
    .eq("patients.org_id", org)
    .ilike("contenido", `%${q}%`)
    .limit(limit);
  const notes = (rn.data || []).map((n: any) => ({
    kind: "note", id: n.id, patient_id: n.patient_id, ref: n.id,
    snippet: `${n.titulo || ""} ${n.contenido || ""}`.slice(0, 240), score: 0.3
  }));

  let rf = await supabase
    .from("patient_file_versions")
    .select("patient_id, path, name, patients!inner(org_id)")
    .eq("patients.org_id", org)
    .ilike("name", `%${q}%`)
    .limit(limit);
  const files = (rf.data || []).map((f: any) => ({
    kind: "file", id: null, patient_id: f.patient_id, ref: null, snippet: f.name, score: 0.2
  }));

  return NextResponse.json({ results: [...notes, ...files].slice(0, limit), mode: "keyword" });
}

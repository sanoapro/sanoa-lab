import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/** === Embeddings providers & helpers === */
const OAI_MODEL = "text-embedding-3-small"; // 1536 dims
const GEM_MODEL = "models/text-embedding-004"; // 768 dims
const DIM = 1536;

const hasGemini = () => !!process.env.GEMINI_API_KEY;
const hasOpenAI = () => !!process.env.OPENAI_API_KEY;

function toDim(vec: number[], dim: any = DIM) {
  if (vec.length === dim) return vec;
  if (vec.length > dim) return vec.slice(0, dim);
  return vec.concat(Array(dim - vec.length).fill(0));
}

async function embedOneGemini(text: string): Promise<number[]> {
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
  const url = `${base}/models/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: GEM_MODEL, content: { parts: [{ text }] } }),
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return toDim(j.embedding?.values || []);
}

async function embedOneOpenAI(text: string): Promise<number[]> {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: text, model: OAI_MODEL }),
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return j.data[0].embedding as number[];
}

async function embedOne(text: string): Promise<number[]> {
  if (hasGemini()) return embedOneGemini(text);
  if (hasOpenAI()) return embedOneOpenAI(text);
  return Array(DIM).fill(0); // no keys → cae a keyword
}

/** === Handler === */
export async function GET(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const q = String(searchParams.get("q") || "");
  const org = String(searchParams.get("org") || "");
  const limit = Math.max(1, Math.min(200, Number(searchParams.get("limit") || "20")));

  if (!org) return NextResponse.json({ error: "org requerida" }, { status: 400 });
  if (!q.trim()) return NextResponse.json({ results: [] });

  // SEMÁNTICO si hay alguna key
  if (hasGemini() || hasOpenAI()) {
    const vec = await embedOne(q);
    const { data, error } = await supabase.rpc("search_notes_files", {
      p_org: org,
      p_query: vec as any,
      p_limit: limit,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({
      results: data,
      mode: "semantic",
      provider: hasGemini() ? "gemini" : "openai",
      dim: DIM,
    });
  }

  // ===== Fallback KEYWORD =====
  const rn = await supabase
    .from("patient_notes")
    .select("id, patient_id, titulo, contenido, patients!inner(org_id)")
    .eq("patients.org_id", org)
    .ilike("contenido", `%${q}%`)
    .limit(limit);

  const notes =
    (rn.data || []).map((n: any) => ({
      kind: "note",
      id: n.id,
      patient_id: n.patient_id,
      ref: n.id,
      snippet: `${n.titulo || ""} ${n.contenido || ""}`.trim().slice(0, 240),
      score: 0.3,
    })) || [];

  const rf = await supabase
    .from("patient_file_versions")
    .select("patient_id, path, name, patients!inner(org_id)")
    .eq("patients.org_id", org)
    .ilike("name", `%${q}%`)
    .limit(limit);

  const files =
    (rf.data || []).map((f: any) => ({
      kind: "file",
      id: null,
      patient_id: f.patient_id,
      ref: null,
      snippet: f.name as string,
      score: 0.2,
    })) || [];

  return NextResponse.json({
    results: [...notes, ...files].slice(0, limit),
    mode: "keyword",
  });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/** === Embeddings providers & helpers === */
const OAI_MODEL = "text-embedding-3-small"; // 1536 dims
const GEM_MODEL = "models/text-embedding-004"; // 768 dims
const DIM = 1536;

const hasGemini = () => !!process.env.GEMINI_API_KEY;
const hasOpenAI = () => !!process.env.OPENAI_API_KEY;

function toDim(vec: number[], dim = DIM) {
  if (vec.length === dim) return vec;
  if (vec.length > dim) return vec.slice(0, dim);
  return vec.concat(Array(dim - vec.length).fill(0));
}

function isAllZeros(v: number[]) {
  let s = 0;
  for (const x of v) s += Math.abs(x);
  return s === 0;
}

async function embedBatchGemini(
  texts: string[],
): Promise<{ vec: number[]; provider: string; model: string; dim: number }[]> {
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
  const url = `${base}/models/text-embedding-004:batchEmbedContents?key=${process.env.GEMINI_API_KEY}`;

  const body = {
    requests: texts.map((t) => ({
      model: GEM_MODEL,
      content: { parts: [{ text: t }] },
    })),
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  const arr = (j.embeddings || []) as Array<{ values: number[] }>;
  return arr.map((e) => ({
    vec: toDim(e.values || []),
    provider: "gemini",
    model: GEM_MODEL,
    dim: 768,
  }));
}

async function embedBatchOpenAI(
  texts: string[],
): Promise<{ vec: number[]; provider: string; model: string; dim: number }[]> {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input: texts, model: OAI_MODEL }),
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return j.data.map((d: any) => ({
    vec: toDim(d.embedding as number[]),
    provider: "openai",
    model: OAI_MODEL,
    dim: DIM,
  }));
}

async function embedBatch(texts: string[]) {
  if (hasGemini()) return embedBatchGemini(texts);
  if (hasOpenAI()) return embedBatchOpenAI(texts);
  // Sin claves: devolvemos vectores vacíos (serán NULL en BD)
  return texts.map(() => ({
    vec: Array(DIM).fill(0),
    provider: null as any,
    model: null as any,
    dim: null as any,
  }));
}

/** === Handler === */
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { scope = "notes", limit = 200, org_id, patient_id } = await req.json().catch(() => ({}));

  if (!org_id) return NextResponse.json({ error: "org_id requerido" }, { status: 400 });

  // NOTES
  if (scope === "notes") {
    let q = supabase
      .from("patient_notes")
      .select("id, patient_id, titulo, contenido, patients!inner(org_id)")
      .eq("patients.org_id", org_id)
      .limit(limit);
    if (patient_id) q = q.eq("patient_id", patient_id);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (data || []).map((n: any) => ({
      note_id: n.id as string,
      patient_id: n.patient_id as string,
      org_id: (n as any).patients.org_id as string,
      content: `${n.titulo || ""}\n${n.contenido || ""}`.trim() || "(nota vacía)",
    }));

    let total = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const slice = rows.slice(i, i + 100);
      const embeds = await embedBatch(slice.map((r) => r.content));

      const payload = slice.map((r, idx) => {
        const e = embeds[idx];
        // Si no hay proveedor o el vector es todo ceros → guardamos embedding NULL
        const embedding = !e.provider || isAllZeros(e.vec) ? null : (e.vec as any);
        return {
          org_id: r.org_id,
          patient_id: r.patient_id,
          note_id: r.note_id,
          content: r.content,
          embedding,
          provider: e.provider,
          model: e.model,
          dim: e.dim,
        };
      });

      const { error: e } = await supabase
        .from("note_embeddings")
        .upsert(payload, { onConflict: "note_id" });
      if (e) return NextResponse.json({ error: e.message }, { status: 400 });
      total += slice.length;
    }

    return NextResponse.json({
      ok: true,
      indexed: total,
      provider: hasGemini() ? "gemini" : hasOpenAI() ? "openai" : "none",
      dim: DIM,
    });
  }

  // FILES
  if (scope === "files") {
    let q = supabase
      .from("patient_file_versions")
      .select("patient_id, path, name, patients!inner(org_id)")
      .eq("patients.org_id", org_id);
    if (patient_id) q = q.eq("patient_id", patient_id);

    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Una por path (última versión)
    const lastByPath = new Map<string, any>();
    for (const r of data || []) lastByPath.set(r.path, r);
    const rows = Array.from(lastByPath.values()).map((r: any) => ({
      org_id: r.patients.org_id as string,
      patient_id: r.patient_id as string,
      path: r.path as string,
      name: r.name as string,
      content: (r.name as string) || "",
    }));

    let total = 0;
    for (let i = 0; i < rows.length; i += 100) {
      const slice = rows.slice(i, i + 100);
      const embeds = await embedBatch(slice.map((r) => r.content));

      const payload = slice.map((r, idx) => {
        const e = embeds[idx];
        const embedding = !e.provider || isAllZeros(e.vec) ? null : (e.vec as any);
        return {
          org_id: r.org_id,
          patient_id: r.patient_id,
          path: r.path,
          name: r.name,
          content: r.content,
          embedding,
          provider: e.provider,
          model: e.model,
          dim: e.dim,
        };
      });

      const { error: e } = await supabase
        .from("file_embeddings")
        .upsert(payload, { onConflict: "path" });
      if (e) return NextResponse.json({ error: e.message }, { status: 400 });
      total += slice.length;
    }

    return NextResponse.json({
      ok: true,
      indexed: total,
      provider: hasGemini() ? "gemini" : hasOpenAI() ? "openai" : "none",
      dim: DIM,
    });
  }

  return NextResponse.json({ error: "scope desconocido (usa 'notes' o 'files')" }, { status: 400 });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

const EMB_MODEL = "text-embedding-3-small";
const useAI = () => !!process.env.OPENAI_API_KEY;

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!useAI()) return texts.map(() => Array(1536).fill(0));
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const r = await fetch(`${base}/embeddings`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ input: texts, model: EMB_MODEL }),
  });
  if (!r.ok) throw new Error(await r.text());
  const j = await r.json();
  return j.data.map((d: any) => d.embedding as number[]);
}

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { scope = "notes", limit = 200, org_id, patient_id } = await req.json().catch(() => ({}));
  if (!org_id) return NextResponse.json({ error: "org_id requerido" }, { status: 400 });

  if (scope === "notes") {
    let q = supabase.from("patient_notes").select("id, patient_id, titulo, contenido, patients!inner(org_id)").eq("patients.org_id", org_id).limit(limit);
    if (patient_id) q = q.eq("patient_id", patient_id);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const rows = (data || []).map((n: any) => ({
      note_id: n.id as string,
      patient_id: n.patient_id as string,
      org_id: (n as any).patients.org_id as string,
      content: `${n.titulo || ""}\n${n.contenido || ""}`.trim() || "(nota vacía)",
    }));

    for (let i = 0; i < rows.length; i += 100) {
      const slice = rows.slice(i, i + 100);
      const vecs = await embedBatch(slice.map((r) => r.content));
      const payload = slice.map((r, idx) => ({
        org_id: r.org_id, patient_id: r.patient_id, note_id: r.note_id, content: r.content, embedding: vecs[idx] as any
      }));
      const { error: e } = await supabase.from("note_embeddings").upsert(payload, { onConflict: "note_id" });
      if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, indexed: rows.length, model: useAI() ? EMB_MODEL : "fallback" });
  }

  if (scope === "files") {
    let q = supabase.from("patient_file_versions").select("patient_id, path, name, patients!inner(org_id)").eq("patients.org_id", org_id);
    if (patient_id) q = q.eq("patient_id", patient_id);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    const lastByPath = new Map<string, any>();
    for (const r of (data || [])) lastByPath.set(r.path, r);
    const rows = Array.from(lastByPath.values()).map((r: any) => ({
      org_id: r.patients.org_id as string,
      patient_id: r.patient_id as string,
      path: r.path as string,
      name: r.name as string,
      content: (r.name as string) || "",
    }));

    for (let i = 0; i < rows.length; i += 100) {
      const slice = rows.slice(i, i + 100);
      const vecs = await embedBatch(slice.map((r) => r.content));
      const payload = slice.map((r, idx) => ({
        org_id: r.org_id, patient_id: r.patient_id, path: r.path, name: r.name, content: r.content, embedding: vecs[idx] as any
      }));
      const { error: e } = await supabase.from("file_embeddings").upsert(payload, { onConflict: "path" });
      if (e) return NextResponse.json({ error: e.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, indexed: rows.length, model: useAI() ? EMB_MODEL : "fallback" });
  }

  return NextResponse.json({ error: "scope desconocido" }, { status: 400 });
}

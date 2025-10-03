// /workspaces/sanoa-lab/app/api/export/pacientes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

/** Convierte filas a CSV simple sin comillas dobles (escapes mínimos) */
function toCSV(rows: any[]): string {
  const header = ["id", "nombre", "edad", "genero", "created_at", "deleted_at", "tags"];
  const lines = [header.join(",")];
  for (const r of rows) {
    const vals = [
      r.id,
      r.nombre ?? "",
      r.edad ?? "",
      r.genero ?? "",
      r.created_at ?? "",
      r.deleted_at ?? "",
      (r.tags ?? "").replace(/\n/g, " ").replace(/,/g, ";"),
    ];
    lines.push(vals.map((v: any) => String(v).replace(/\r?\n/g, " ")).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseServer(); // ✅ await
  const { searchParams } = new URL(req.url);

  // filtros básicos (paridad con UI)
  const q = searchParams.get("q") || undefined;
  const genero = searchParams.get("genero") || undefined;
  const includeDeleted = searchParams.get("includeDeleted") === "1";
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;

  // Tags (any/all)
  const tagsAny = (searchParams.get("tagsAny") || "").split(",").filter(Boolean);
  const tagsAll = (searchParams.get("tagsAll") || "").split(",").filter(Boolean);
  const tagIds = tagsAll.length > 0 ? tagsAll : tagsAny;
  let idsByTags: string[] | null = null;

  if (tagIds.length > 0) {
    const mode = tagsAll.length > 0 ? "all" : "any";
    const { data: rows, error } = await supabase.rpc("patients_ids_by_tags", {
      tag_ids: tagIds,
      mode,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    idsByTags = (rows ?? []).map((r: any) => r.patient_id as string);
    if (idsByTags.length === 0) {
      const csvEmpty = "id,nombre,edad,genero,created_at,deleted_at,tags\n";
      return new NextResponse(new Blob([csvEmpty]), {
        headers: {
          "content-type": "text/csv; charset=utf-8",
          "content-disposition": "attachment; filename=pacientes.csv",
        },
      });
    }
  }

  let q1 = supabase.from("v_patients_export").select("*").order("created_at", { ascending: false });

  if (!includeDeleted) q1 = q1.is("deleted_at", null);
  if (q) q1 = q1.ilike("nombre", `%${q}%`);
  if (genero && ["F", "M", "O"].includes(genero)) q1 = q1.eq("genero", genero);
  if (from) q1 = q1.gte("created_at", new Date(from + "T00:00:00Z").toISOString());
  if (to) q1 = q1.lte("created_at", new Date(to + "T23:59:59Z").toISOString());
  if (idsByTags) q1 = q1.in("id", idsByTags);

  const { data, error } = await q1;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const csv = toCSV(data ?? []);
  return new NextResponse(new Blob([csv]), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=pacientes.csv",
    },
  });
}

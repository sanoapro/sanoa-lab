// MODE: session (user-scoped, cookies)
// GET /api/export/pacientes/xlsx?org_id&q&genero&tagsAny=a,b&from=YYYY-MM-DD&to=YYYY-MM-DD&page&pageSize
import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import * as XLSX from "xlsx";

function toInt(v: string | null, d: number = 50): number {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : d;
}

type PatientViewRow = {
  id: string;
  org_id: string;
  name: string | null;
  gender: string | null;
  dob: string | null; // ISO or YYYY-MM-DD
  tags: string[] | null;
  created_at: string | null; // ISO
  deleted_at: string | null; // ISO
};

export async function GET(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }),
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }),
      { status: 400 },
    );
  }

  const q = url.searchParams.get("q")?.trim() || "";
  const genero = url.searchParams.get("genero")?.trim() || "";
  const tagsAny: string[] = (url.searchParams.get("tagsAny") || "")
    .split(",")
    .map((s: string) => s.trim())
    .filter(Boolean);
  const from = url.searchParams.get("from") || undefined;
  const to = url.searchParams.get("to") || undefined;
  const page = toInt(url.searchParams.get("page"), 1);
  const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 1000), 5000); // export permite más

  let sel = supa
    .from("v_patients")
    .select("id, org_id, name, gender, dob, tags, created_at, deleted_at", { count: "exact" })
    .eq("org_id", org_id);

  if (q) sel = sel.ilike("name", `%${q}%`);
  if (genero) sel = sel.eq("gender", genero);
  if (from) sel = sel.gte("created_at", from);
  if (to) sel = sel.lte("created_at", to);
  if (tagsAny.length) sel = sel.contains("tags", tagsAny); // si tags es array[] (ajustar si es jsonb)

  const fromIdx = (page - 1) * pageSize;
  const { data, error } = await sel
    .order("created_at", { ascending: false })
    .range(fromIdx, fromIdx + pageSize - 1)
    .returns<PatientViewRow[]>();

  if (error) {
    return new Response(
      JSON.stringify({ ok: false, error: { code: "DB_ERROR", message: error.message } }),
      { status: 400 },
    );
  }

  const rows = (data ?? []).map((r: PatientViewRow) => ({
    ID: r.id,
    Nombre: r.name ?? "",
    Género: r.gender ?? "",
    Nacimiento: r.dob ?? "",
    Tags: Array.isArray(r.tags) ? r.tags.join(", ") : "",
    Creado: r.created_at ? new Date(r.created_at).toISOString() : "",
    Eliminado: r.deleted_at ? new Date(r.deleted_at).toISOString() : "",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "Pacientes");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });

  const filename = `pacientes_${org_id}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(new Blob([buf]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

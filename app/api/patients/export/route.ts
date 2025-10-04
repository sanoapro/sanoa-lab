// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/export → CSV respetando filtros
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

function splitMulti(q: URLSearchParams, key: string): string[] | null {
  const vals = q.getAll(key).flatMap((v: any) =>
    v
      .split(",")
      .map((s: any) => s.trim())
      .filter(Boolean),
  );
  return vals.length ? Array.from(new Set(vals)) : null;
}
function esc(s: any) {
  if (s === null || typeof s === "undefined") return "";
  const v = String(s);
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user)
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 },
      );

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    if (!org_id)
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 },
      );

    const q = url.searchParams.get("q");
    const genero = url.searchParams.get("genero");
    const tagsAny = splitMulti(url.searchParams, "tagsAny");
    const tagsAll = splitMulti(url.searchParams, "tagsAll");
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const includeDeleted =
      (url.searchParams.get("includeDeleted") ?? "false").toLowerCase() === "true";
    const MAX = 10000;

    const { data, error } = await (
      await getSupabaseServer()
    ).rpc("patients_search", {
      p_org_id: org_id,
      p_q: (q) ?? undefined,
      p_genero: (genero) ?? undefined,
      p_tags_any: (tagsAny) ?? undefined,
      p_tags_all: (tagsAll) ?? undefined,
      p_from: (from) ?? undefined,
      p_to: (to) ?? undefined,
      p_include_deleted: includeDeleted,
      p_limit: MAX,
      p_offset: 0,
    });

    if (error)
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 },
      );

    const rows = (data ?? []).map(({ total: _t, ...r }: any) => r);
    if (rows.length > MAX) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "TOO_MANY_ROWS",
            message: `Demasiados registros (${rows.length}). Refina filtros. Límite: ${MAX}.`,
          },
        },
        { status: 400 },
      );
    }

    const header = ["id", "name", "gender", "dob", "age_years", "tags", "created_at", "deleted_at"];
    const csv = [
      header.join(","),
      ...rows.map((r: any) => {
        const age = r.dob
          ? Math.max(0, Math.floor((Date.now() - Date.parse(r.dob)) / (365.25 * 24 * 3600 * 1000)))
          : "";
        return [
          esc(r.id),
          esc(r.name ?? ""),
          esc(r.gender ?? ""),
          esc(r.dob ?? ""),
          esc(age),
          esc(Array.isArray(r.tags) ? r.tags.join("|") : ""),
          esc(r.created_at ?? ""),
          esc(r.deleted_at ?? ""),
        ].join(",");
      }),
    ].join("\n");

    const filename = `patients_${org_id}_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response(new Blob([csv]), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 },
    );
  }
}

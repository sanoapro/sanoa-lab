// MODE: session (user-scoped, cookies)
// Ruta: /api/patients/search
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServer } from "@/lib/supabase/server";

function toInt(v: string | null, def: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : def;
}

function splitMulti(q: URLSearchParams, key: string): string[] | null {
  const vals = q
    .getAll(key)
    .flatMap((v: any) => v.split(",").map((s: any) => s.trim()).filter(Boolean));
  return vals.length ? Array.from(new Set(vals)) : null;
}

const SuggestQuerySchema = z.object({
  org_id: z.string().uuid(),
  q: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(20).default(8),
  scope: z.enum(["mine", "org"]).default("mine"),
  provider_id: z.string().uuid().optional(),
});

function hasLegacySearchParams(params: URLSearchParams) {
  const legacyKeys = [
    "genero",
    "tagsAny",
    "tagsAll",
    "from",
    "to",
    "includeDeleted",
    "page",
    "pageSize",
  ];
  return legacyKeys.some((key: any) => params.has(key));
}

function formatZodError(error: z.ZodError) {
  return error.issues
    .map((issue: any) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
}

export async function GET(req: NextRequest) {
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json(
        { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    if (!orgId) {
      return NextResponse.json(
        { ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } },
        { status: 400 }
      );
    }

    if (hasLegacySearchParams(url.searchParams)) {
      const q = url.searchParams.get("q");
      const genero = url.searchParams.get("genero");
      const tagsAny = splitMulti(url.searchParams, "tagsAny");
      const tagsAll = splitMulti(url.searchParams, "tagsAll");
      const from = url.searchParams.get("from");
      const to = url.searchParams.get("to");
      const includeDeleted = (url.searchParams.get("includeDeleted") ?? "false").toLowerCase() === "true";
      const page = toInt(url.searchParams.get("page"), 1);
      const pageSize = Math.min(toInt(url.searchParams.get("pageSize"), 50), 200);
      const offset = (page - 1) * pageSize;

      const { data, error } = await supa.rpc("patients_search", {
        p_org_id: orgId,
        p_q: (q) ?? undefined,
        p_genero: (genero) ?? undefined,
        p_tags_any: (tagsAny) ?? undefined,
        p_tags_all: (tagsAll) ?? undefined,
        p_from: (from) ?? undefined,
        p_to: (to) ?? undefined,
        p_include_deleted: includeDeleted,
        p_limit: pageSize,
        p_offset: offset,
      });

      if (error) {
        return NextResponse.json(
          { ok: false, error: { code: "DB_ERROR", message: error.message } },
          { status: 400 }
        );
      }

      const total = data?.[0]?.total ?? 0;
      return NextResponse.json({
        ok: true,
        data: (data ?? []).map(({ total: _t, ...r }: any) => r),
        meta: { page, pageSize, total },
      });
    }

    const parsed = SuggestQuerySchema.safeParse({
      org_id: orgId,
      q: url.searchParams.get("q") || "",
      limit: url.searchParams.get("limit") || undefined,
      scope: url.searchParams.get("scope") || undefined,
      provider_id: url.searchParams.get("provider_id") || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "VALIDATION_ERROR",
            message: formatZodError(parsed.error),
          },
        },
        { status: 400 }
      );
    }

    const { org_id, q, limit, scope, provider_id } = parsed.data;

    const { data: viaRpc, error: rpcErr } = await supa.rpc("patients_search_suggest", {
      p_org_id: org_id,
      p_q: (q) ?? undefined,
      p_limit: limit,
      p_scope: scope,
      p_provider_id: (provider_id) ?? undefined,
    });

    if (!rpcErr && Array.isArray(viaRpc)) {
      return NextResponse.json({
        ok: true,
        data: viaRpc.map((r: any) => ({
          id: r.id,
          full_name: r.full_name,
          phone: r.phone ?? null,
          email: r.email ?? null,
        })),
      });
    }

    let sel = supa
      .from("patients")
      .select("id, org_id, full_name, phone, email")
      .eq("org_id", org_id)
      .or(`full_name.ilike.%${q}%,phone.ilike.%${q}%,email.ilike.%${q}%`)
      .order("full_name", { ascending: true })
      .limit(limit);

    if (scope === "mine" && provider_id) {
      // Filtro adicional se puede manejar en cliente en el modo fallback.
    }

    const { data, error } = await sel;
    if (error) {
      return NextResponse.json(
        { ok: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: (data ?? []).map((r: any) => ({
        id: r.id,
        full_name: r.full_name,
        phone: r.phone ?? null,
        email: r.email ?? null,
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } },
      { status: 500 }
    );
  }
}

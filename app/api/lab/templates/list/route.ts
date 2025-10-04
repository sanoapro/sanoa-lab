import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, serverError } from "@/lib/api/responses";

type OwnerKind = "user" | "org";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const supaAny = supa as any;

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    const scopeParam = url.searchParams.get("scope") ?? url.searchParams.get("owner") ?? "user";
    const scope = (scopeParam as OwnerKind) ?? "user";

    if (!orgId) {
      return badRequest("org_id requerido");
    }

    let query = supaAny
      .from("lab_templates")
      .select("id, org_id, owner_kind, owner_id, title, items, is_active, created_at")
      .eq("org_id" as any, orgId as any)
      .eq("is_active" as any, true as any)
      .order("created_at", { ascending: false });

    if (scope === "user") {
      query = query.eq("owner_kind" as any, "user" as any).eq("owner_id" as any, auth.user.id as any);
    }

    if (scope === "org") {
      query = query.eq("owner_kind" as any, "org" as any);
    }

    const { data, error } = await query;
    if (error) {
      return dbError(error);
    }

    return ok({ rows: data ?? [] });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

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

    const q = supaAny
      .from("lab_templates")
      .select("*")
      .eq("org_id" as any, orgId)
      .eq("is_active" as any, true)
      .order("created_at", { ascending: false });

    const query =
      scope === "user"
        ? q.eq("owner_kind" as any, "user").eq("owner_id" as any, auth.user.id)
        : q.eq("owner_kind" as any, "org");

    const { data, error } = await query;
    if (error) {
      return dbError(error);
    }

    return ok({ rows: data ?? [] });
  } catch (err: any) {
    return serverError(err?.message ?? "Error");
  }
}

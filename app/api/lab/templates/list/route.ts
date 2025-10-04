import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { ok, unauthorized, badRequest, dbError, serverError } from "@/lib/api/responses";

type OwnerKind = "user" | "org";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();

  try {
    const { data: auth } = await supa.auth.getUser();
    if (!auth?.user) {
      return unauthorized();
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    const owner = ((url.searchParams.get("owner") || "user") as OwnerKind) ?? "user";

    if (!orgId) {
      return badRequest("org_id requerido");
    }

    let query = supa
      .from<any>("lab_templates" as any)
      .select("id, org_id, owner_kind, owner_id, title, items, is_active, created_at")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (owner === "user") {
      query = query.eq("owner_kind", "user").eq("owner_id", auth.user.id);
    }

    if (owner === "org") {
      query = query.eq("owner_kind", "org");
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

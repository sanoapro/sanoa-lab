import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * GET /api/lab/templates/list?org_id=UUID[&owner=user|org]
 * - owner=user → solo mis plantillas
 * - owner=org  → plantillas compartidas de la organización
 */
export async function GET(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id") || "";
  const owner = (searchParams.get("owner") || "user") as "user" | "org";
  if (!org_id) return NextResponse.json({ error: "org_id requerido" }, { status: 400 });

  let q = supa
    .from("lab_templates")
    .select("id, org_id, owner_kind, owner_id, title, items, is_active, created_at")
    .eq("org_id", org_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (owner === "user") q = q.eq("owner_kind", "user").eq("owner_id", auth.user.id);
  if (owner === "org") q = q.eq("owner_kind", "org");

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, rows: data ?? [] });
}

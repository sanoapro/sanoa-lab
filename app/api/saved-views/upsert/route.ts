// MODE: session (user-scoped, cookies)
// POST /api/saved-views/upsert  { org_id, scope, name, filters }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    scope?: string;
    name?: string;
    filters?: any;
  };
  if (!body?.org_id || !body?.scope || !body?.name || typeof body.filters === "undefined") {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "BAD_REQUEST", message: "org_id, scope, name y filters son requeridos" },
      },
      { status: 400 },
    );
  }

  const row = {
    org_id: body.org_id,
    user_id: u.user.id,
    scope: body.scope,
    name: String(body.name).slice(0, 120),
    filters: body.filters,
  };

  const { data, error } = await supa
    .from("saved_views")
    .upsert(row, { onConflict: "org_id,user_id,scope,name" })
    .select("id,name,filters")
    .single();

  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  return NextResponse.json({ ok: true, data });
}

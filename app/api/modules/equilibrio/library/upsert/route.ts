// MODE: session (user-scoped, cookies)
// POST /api/modules/equilibrio/library/upsert
// { org_id, items: [{ id?, module, kind, title, description?, active?, default_goal? }] }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    items?: Array<{
      id?: string;
      module?: string;
      kind?: string;
      title?: string;
      description?: string;
      active?: boolean;
      default_goal?: string | null;
    }>;
  };
  if (!body?.org_id || !Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id e items requeridos" } },
      { status: 400 },
    );
  }

  const rows = body.items.map((it) => ({
    id: it.id ?? undefined,
    org_id: body.org_id!,
    module: String(it.module || "equilibrio"),
    kind: String(it.kind || "custom"),
    title: String(it.title || "").slice(0, 200),
    description: it.description ? String(it.description).slice(0, 1000) : null,
    active: it.active ?? true,
    default_goal: it.default_goal ? String(it.default_goal).slice(0, 120) : null,
    created_by: auth.user!.id,
  }));

  const { data, error } = await supa
    .from("equilibrio_task_library")
    .upsert(rows, { onConflict: "org_id,title" })
    .select("id, module, kind, title, active, default_goal");

  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  return NextResponse.json({ ok: true, data });
}

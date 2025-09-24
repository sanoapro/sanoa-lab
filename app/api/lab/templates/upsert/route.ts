import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * POST /api/lab/templates/upsert
 * Body: { id?, org_id, owner_kind: "user"|"org", title, items:[{ code?, name, notes? }], is_active? }
 * - Si llega id → actualiza (solo si es del mismo owner)
 * - Sin id → crea
 */
export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const { id, org_id, owner_kind, title, items, is_active = true } = b;

  if (!org_id || !owner_kind || !title || !Array.isArray(items)) {
    return NextResponse.json({ error: "org_id, owner_kind, title, items requeridos" }, { status: 400 });
  }
  if (!["user", "org"].includes(owner_kind)) {
    return NextResponse.json({ error: "owner_kind inválido" }, { status: 400 });
  }

  const payload = {
    org_id,
    owner_kind,
    owner_id: owner_kind === "user" ? auth.user.id : null,
    title,
    items,
    is_active: !!is_active,
  };

  if (id) {
    // seguridad: sólo permite actualizar si eres el dueño
    let q = supa.from("lab_templates").update(payload).eq("id", id).eq("org_id", org_id);
    if (owner_kind === "user") q = q.eq("owner_id", auth.user.id);
    const { error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id });
  } else {
    const { data, error } = await supa.from("lab_templates")
      .insert(payload)
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.id });
  }
}

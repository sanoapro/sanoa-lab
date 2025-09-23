import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

/**
 * Tabla sugerida: lab_test_templates
 *   id uuid pk default gen_random_uuid()
 *   org_id uuid null
 *   created_by uuid not null
 *   name text not null
 *   notes text null
 *   items jsonb not null default '[]'   -- [{code?, name, notes?}]
 *   is_active boolean not null default true
 *   created_at timestamptz default now()
 *   updated_at timestamptz default now()
 */

export async function GET() {
  const supa = createRouteHandlerClient({ cookies });
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { data, error } = await supa
    .from("lab_test_templates")
    .select("id, name, notes, items, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, rows: data });
}

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, name, notes = "", items = [], is_active = true } = body;

  if (!name || !Array.isArray(items))
    return NextResponse.json({ error: "name e items (array) requeridos" }, { status: 400 });

  if (id) {
    const { error } = await supa
      .from("lab_test_templates")
      .update({ name, notes, items, is_active, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id });
  } else {
    const { data, error } = await supa
      .from("lab_test_templates")
      .insert({ name, notes, items, is_active, created_by: auth.user.id })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, id: data.id });
  }
}

export async function DELETE(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  const { error } = await supa.from("lab_test_templates").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

// MODE: session (user-scoped, cookies)
// GET: /api/tasks/templates?org_id&module
// POST: /api/tasks/templates  { org_id, module, title, content }
// DELETE: /api/tasks/templates  { id, org_id }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const mod = url.searchParams.get("module");
  if (!org_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 }
    );
  }

  let q = supa
    .from("patient_task_templates")
    .select("id,org_id,module,title,content,created_at,created_by")
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });
  if (mod) q = q.eq("module", mod);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    module?: string;
    title?: string;
    content?: any;
  };
  if (!body?.org_id || !body?.module || !body?.title) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, module y title son requeridos" } },
      { status: 400 }
    );
  }

  const { data, error } = await supa
    .from("patient_task_templates")
    .insert({
      org_id: body.org_id,
      module: body.module,
      title: String(body.title).slice(0, 160),
      content: body.content ?? {},
      created_by: u.user.id,
    })
    .select("id,org_id,module,title,content,created_at,created_by")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, data });
}

export async function DELETE(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 }
    );
  }

  const body = (await req.json().catch(() => null)) as { id?: string; org_id?: string };
  if (!body?.id || !body?.org_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "id y org_id requeridos" } },
      { status: 400 }
    );
  }

  const { error } = await supa
    .from("patient_task_templates")
    .delete()
    .eq("id", body.id)
    .eq("org_id", body.org_id);
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }

  return NextResponse.json({ ok: true });
}

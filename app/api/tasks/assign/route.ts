// MODE: session (user-scoped, cookies)
// POST /api/tasks/assign
// { org_id, module, patient_id, template_id?, title?, content?, due_date? }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

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
    patient_id?: string;
    template_id?: string;
    title?: string;
    content?: any;
    due_date?: string | null;
  };
  if (!body?.org_id || !body?.module || !body?.patient_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, module y patient_id son requeridos" } },
      { status: 400 }
    );
  }

  let title = (body.title || "").toString().slice(0, 160);
  let content = body.content ?? {};

  if (body.template_id) {
    const { data: tpl, error: eTpl } = await supa
      .from("patient_task_templates")
      .select("title,content")
      .eq("id", body.template_id)
      .eq("org_id", body.org_id)
      .single();
    if (eTpl) {
      return NextResponse.json(
        { ok: false, error: { code: "NOT_FOUND", message: "Plantilla no encontrada" } },
        { status: 404 }
      );
    }
    title = title || tpl.title;
    content = Object.keys(content || {}).length ? content : tpl.content ?? {};
  }

  const { data, error } = await supa
    .from("patient_tasks")
    .insert({
      org_id: body.org_id,
      module: body.module,
      patient_id: body.patient_id,
      template_id: body.template_id ?? null,
      title: title || "Tarea",
      content,
      status: "assigned",
      due_date: body.due_date ?? null,
      assigned_by: u.user.id,
    })
    .select("id,org_id,module,patient_id,title,status,due_date,assigned_by,created_at")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, data });
}

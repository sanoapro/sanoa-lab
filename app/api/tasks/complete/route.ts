// MODE: session (user-scoped, cookies)
// PATCH /api/tasks/complete  { org_id, id, status? ('done'|'in_progress'|'assigned'), due_date? }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    id?: string;
    status?: string;
    due_date?: string | null;
  };
  if (!body?.org_id || !body?.id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id e id requeridos" } },
      { status: 400 },
    );
  }

  const patch: Record<string, unknown> = {};
  if (body.status && ["done", "in_progress", "assigned"].includes(body.status)) {
    patch.status = body.status;
  }
  if (typeof body.due_date !== "undefined") {
    patch.due_date = body.due_date;
  }

  const { data, error } = await supa
    .from("patient_tasks")
    .update(patch)
    .eq("id", body.id)
    .eq("org_id", body.org_id)
    .select("id,status,due_date,updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, data });
}

// MODE: session (user-scoped, cookies)
// GET /api/tasks/list?org_id&module?&patient_id?&status?
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) {
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );
  }

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id requerido" } },
      { status: 400 },
    );
  }

  let q = supa
    .from("patient_tasks")
    .select(
      "id,org_id,module,patient_id,template_id,title,content,status,due_date,assigned_by,created_at,updated_at",
    )
    .eq("org_id", org_id)
    .order("created_at", { ascending: false });

  const moduleName = url.searchParams.get("module");
  const patient_id = url.searchParams.get("patient_id");
  const status = url.searchParams.get("status");

  if (moduleName) q = q.eq("module", moduleName);
  if (patient_id) q = q.eq("patient_id", patient_id);
  if (status) q = q.eq("status", status);

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  }
  return NextResponse.json({ ok: true, data });
}

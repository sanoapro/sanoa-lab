// MODE: session (user-scoped, cookies)
// GET /api/modules/equilibrio/plans/get?org_id&patient_id
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const patient_id = url.searchParams.get("patient_id");
  if (!org_id || !patient_id) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id y patient_id requeridos" } },
      { status: 400 },
    );
  }

  const { data: plan, error: e1 } = await supa
    .from("equilibrio_plans")
    .select("id, starts_on, is_active, created_at")
    .eq("org_id", org_id)
    .eq("patient_id", patient_id)
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (e1)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e1.message } },
      { status: 400 },
    );
  if (!plan) return NextResponse.json({ ok: true, data: null });

  const { data: items, error: e2 } = await supa
    .from("equilibrio_plan_items")
    .select(
      "id, library_id, goal, notes, mon, tue, wed, thu, fri, sat, sun, created_at, library:equilibrio_task_library(id, title, kind, module, default_goal)",
    )
    .eq("plan_id", plan.id)
    .order("created_at", { ascending: true });

  if (e2)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: e2.message } },
      { status: 400 },
    );

  return NextResponse.json({ ok: true, data: { plan, items } });
}

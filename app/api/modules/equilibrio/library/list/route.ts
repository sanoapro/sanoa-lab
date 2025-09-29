// MODE: session (user-scoped, cookies)
// GET /api/modules/equilibrio/library/list?org_id&q?&active?&module?
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: auth } = await supa.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" } }, { status:401 });
  }

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  if (!org_id) {
    return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id requerido" } }, { status:400 });
  }

  let q = supa.from("equilibrio_task_library")
    .select("id, org_id, module, kind, title, description, active, default_goal")
    .eq("org_id", org_id)
    .order("title", { ascending: true });

  const active = url.searchParams.get("active");
  if (active === "true") q = q.eq("active", true);
  const mod = url.searchParams.get("module");
  if (mod) q = q.eq("module", mod);
  const search = url.searchParams.get("q");
  if (search) q = q.ilike("title", `%${search}%`);

  const { data, error } = await q.limit(500);
  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message } }, { status:400 });
  return NextResponse.json({ ok:true, data });
}

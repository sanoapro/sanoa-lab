// MODE: session (user-scoped, cookies)
// GET /api/saved-views/list?org_id&scope
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

  const url = new URL(req.url);
  const org_id = url.searchParams.get("org_id");
  const scope = url.searchParams.get("scope") ?? "";
  if (!org_id || !scope) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"org_id y scope requeridos" }}, { status:400 });

  const { data, error } = await supa.from("saved_views")
    .select("id,name,filters")
    .eq("org_id", org_id)
    .eq("user_id", u.user.id)
    .eq("scope", scope)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message }}, { status:400 });
  return NextResponse.json({ ok:true, data });
}

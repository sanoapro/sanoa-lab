// MODE: session (user-scoped, cookies)
// DELETE /api/saved-views/delete  { id, org_id }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest) {
  // MODE: session
  const supa = await getSupabaseServer();
  const { data: u } = await supa.auth.getUser();
  if (!u?.user) return NextResponse.json({ ok:false, error:{ code:"UNAUTHORIZED", message:"No autenticado" }}, { status:401 });

  const body = await req.json().catch(()=>null) as { id?: string; org_id?: string };
  if (!body?.id || !body?.org_id) return NextResponse.json({ ok:false, error:{ code:"BAD_REQUEST", message:"id y org_id requeridos" }}, { status:400 });

  const { error } = await supa.from("saved_views")
    .delete()
    .eq("id", body.id)
    .eq("org_id", body.org_id)
    .eq("user_id", u.user.id);

  if (error) return NextResponse.json({ ok:false, error:{ code:"DB_ERROR", message:error.message }}, { status:400 });
  return NextResponse.json({ ok:true });
}

// MODE: session (user-scoped, cookies)
// Ruta: /api/saved-views/[id]  (DELETE)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const id = params.id;
    if (!org_id || !id) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id o id" } }, { status: 400 });
    }

    // Política RLS ya asegura user_id=auth.uid() en saved_views (definida en Lote 1)
    const { data, error } = await supa.from("saved_views").delete().eq("org_id", org_id).eq("id", id).eq("user_id", u.user.id).select("*");
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

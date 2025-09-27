// MODE: session (user-scoped, cookies)
// Ruta: /api/saved-views  (GET lista, POST upsert)
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }

    const url = new URL(req.url);
    const org_id = url.searchParams.get("org_id");
    const scope = url.searchParams.get("scope") ?? undefined;

    if (!org_id) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "Falta org_id" } }, { status: 400 });
    }

    let q = supa.from("saved_views").select("*").eq("org_id", org_id).eq("user_id", u.user.id);
    if (scope) q = q.eq("scope", scope);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // MODE: session
  try {
    const supa = await getSupabaseServer();
    const { data: u } = await supa.auth.getUser();
    if (!u?.user) {
      return NextResponse.json({ ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado." } }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const org_id: string | undefined = body?.org_id;
    const item: any = body?.item;

    if (!org_id || !item?.scope || !item?.name) {
      return NextResponse.json({ ok: false, error: { code: "BAD_REQUEST", message: "org_id, scope y name requeridos." } }, { status: 400 });
    }

    const payload = {
      id: item.id, // si viene, upsert por PK
      org_id,
      user_id: u.user.id,
      scope: item.scope,             // p.ej. 'bank_tx'
      name: item.name,               // nombre visible
      filters: item.filters ?? {},   // JSON con params de URL
    };

    const { data, error } = await supa.from("saved_views").upsert(payload, { onConflict: "id" }).select("*");
    if (error) return NextResponse.json({ ok: false, error: { code: "DB_ERROR", message: error.message } }, { status: 400 });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { code: "SERVER_ERROR", message: e?.message ?? "Error" } }, { status: 500 });
  }
}

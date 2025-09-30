// MODE: session (user-scoped, cookies)
// POST /api/agenda/appointments/update-status
// { org_id, ids: string[], status: 'completed'|'no_show'|'cancelled' }
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supa = await getSupabaseServer();
  const { data: au } = await supa.auth.getUser();
  if (!au?.user)
    return NextResponse.json(
      { ok: false, error: { code: "UNAUTHORIZED", message: "No autenticado" } },
      { status: 401 },
    );

  const body = (await req.json().catch(() => null)) as {
    org_id?: string;
    ids?: string[];
    status?: "completed" | "no_show" | "cancelled";
  };
  if (!body?.org_id || !Array.isArray(body.ids) || body.ids.length === 0 || !body.status) {
    return NextResponse.json(
      { ok: false, error: { code: "BAD_REQUEST", message: "org_id, ids, status requeridos" } },
      { status: 400 },
    );
  }

  const { error } = await supa
    .from("agenda_appointments")
    .update({ status: body.status })
    .in("id", body.ids)
    .eq("org_id", body.org_id);

  if (error)
    return NextResponse.json(
      { ok: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 400 },
    );
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { result_id } = await req.json().catch(() => ({}));
  if (!result_id) return NextResponse.json({ error: "result_id requerido" }, { status: 400 });

  const { data: auth } = await supa.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // 1) Traer el resultado para obtener request_id
  const r1 = await supa.from("lab_results").select("id, request_id").eq("id", result_id).single();
  if (r1.error) return NextResponse.json({ error: r1.error.message }, { status: 400 });

  // 2) Marcar revisado
  const r2 = await supa
    .from("lab_results")
    .update({ reviewed_by: auth.user.id, reviewed_at: new Date().toISOString() })
    .eq("id", result_id);
  if (r2.error) return NextResponse.json({ error: r2.error.message }, { status: 400 });

  // 3) (simple) Marcar solicitud como 'reviewed'
  const r3 = await supa.from("lab_requests").update({ status: "reviewed" }).eq("id", r1.data.request_id);
  if (r3.error) return NextResponse.json({ error: r3.error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

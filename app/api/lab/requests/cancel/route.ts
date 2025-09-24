import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function POST(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { request_id } = await req.json().catch(() => ({}));
  if (!request_id) return NextResponse.json({ error: "request_id requerido" }, { status: 400 });

  const { error } = await supa
    .from("lab_requests")
    .update({ status: "cancelled" })
    .eq("id", request_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const supa = createRouteHandlerClient({ cookies });
  const { searchParams } = new URL(req.url);
  const org_id = searchParams.get("org_id") || "";
  const patient_id = searchParams.get("patient_id");
  if (!org_id) return NextResponse.json({ error: "org_id requerido" }, { status: 400 });

  let q = supa.from("lab_requests").select("id, org_id, patient_id, title, status, due_at, created_at");
  q = q.eq("org_id", org_id).order("created_at", { ascending: false });
  if (patient_id) q = q.eq("patient_id", patient_id);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ items: data || [] });
}
